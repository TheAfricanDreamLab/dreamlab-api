import { Injectable, Logger } from '@nestjs/common';
import type {
  GoogleSignInRequestSchema,
  OtpPurpose,
  RegisterRequest,
  SignInResponse,
  TokenResponse,
} from '@dreamlab/contracts';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Principal } from '@lib/auth';
import {
  badRequest,
  conflict,
  forbidden,
  InjectRedis,
  newId,
  notFound,
  randomToken,
  RedisRateLimiter,
  safeEqual,
  sha256,
  tooManyRequests,
  unauthorized,
} from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import type Redis from 'ioredis';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import type { IamConfig } from '../../config';
import { IamDatabase, IamTx, schema } from '../../database';
import { IamEvents } from '../../events';
import { AuthzService } from '../authz/authz.service';
import { OtpService, OtpVerification } from '../otp/otp.service';
import { isEmail, UserRow, UsersRepository } from '../users/users.repository';
import { GoogleIdentityService } from './services/google-identity.service';
import { MfaService } from './services/mfa.service';
import { PasswordService } from './services/password.service';
import { PERSONAL, SessionIssuer, TokenContext } from './services/session-issuer.service';
import { SessionRow, SessionsService } from './services/sessions.service';
import { SsoPolicy } from './services/sso-policy.service';
import { TokenService } from './services/token.service';

/** A registration's password waits here until verify (see register); a day covers a late code. */
export const pendingPasswordKey = (userId: string): string => `iam:pending-pw:${userId}`;
const PENDING_PASSWORD_TTL_SECONDS = 24 * 3600;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly limiter: RedisRateLimiter;

  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() private readonly redis: Redis,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly users: UsersRepository,
    private readonly passwords: PasswordService,
    private readonly otp: OtpService,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenService,
    private readonly issuer: SessionIssuer,
    private readonly mfa: MfaService,
    private readonly ssoPolicy: SsoPolicy,
    private readonly authz: AuthzService,
    private readonly google: GoogleIdentityService,
  ) {
    this.limiter = new RedisRateLimiter(redis, 'iam:rl:');
  }

  // ---------- registration and verification ----------

  /**
   * Create an account. Needs no organisation. An unverified account with the same identifier is
   * taken over (nobody has proven they own it yet); a verified one is a conflict.
   *
   * The password is not stored yet: it waits in Redis with a registration token returned to this
   * caller, and verify applies it only when that token comes back. Otherwise someone could register
   * another person's address with their own password and keep it once that person verifies the
   * account (with a code, through SCIM or an invitation).
   */
  async register(dto: RegisterRequest, meta: RequestMeta) {
    const identifier = (dto.email ?? dto.phone)!;
    await this.ipLimit('register', meta, 20, 3600);
    await this.ssoPolicy.assertNotEnforced(identifier);
    const passwordHash = await this.passwords.hash(dto.password);

    const user = await this.db.system(async (tx) => {
      const existing = await this.users.findByIdentifier(identifier, tx);
      if (existing && UsersRepository.isAnyVerified(existing)) {
        throw conflict('account_exists', 'An account with this email or phone already exists. Sign in or reset your password.');
      }
      const row = existing ?? (await this.users.create(tx, { email: dto.email ?? null, phone: dto.phone ?? null, fullName: dto.fullName, locale: dto.locale }));
      if (existing) await this.users.update(tx, row.id, { fullName: dto.fullName, locale: dto.locale });
      // A password set before the account was proven is never trusted.
      await this.users.dropPassword(tx, row.id);
      await this.recordConsent(tx, row.id, dto.consent, meta);
      if (!existing) {
        await this.outbox.add(tx, {
          type: IamEvents.UserRegistered,
          actor: userActor(row.id),
          requestId: meta.requestId,
          payload: { userId: row.id, channel: dto.email ? 'email' : 'sms' },
        });
      }
      return row;
    });

    const registrationToken = randomToken();
    await this.redis.set(pendingPasswordKey(user.id), JSON.stringify({ token: sha256(registrationToken), hash: passwordHash }), 'EX', PENDING_PASSWORD_TTL_SECONDS);
    const verification = await this.otp.issue('verify', identifier);
    return { userId: user.id, verification, registrationToken };
  }

  /** Always answers the same way, so it cannot be used to discover accounts. */
  async requestOtp(identifier: string, purpose: OtpPurpose, meta: RequestMeta, channel?: 'sms' | 'whatsapp') {
    await this.ipLimit('otp', meta, 30, 3600);
    // Domain policy is public (it depends on the address, not on whether an account exists).
    if (purpose === 'login') await this.ssoPolicy.assertNotEnforced(identifier);
    const user = await this.users.findByIdentifier(identifier);
    const eligible =
      user !== null &&
      user.status === 'active' &&
      (purpose === 'verify' ? !UsersRepository.isVerified(user, identifier) : true);
    if (eligible) {
      try {
        await this.otp.issue(purpose, identifier, channel);
      } catch (err) {
        // Do not reveal rate limits on an identifier the caller may not own.
        this.logger.warn(`OTP not issued: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return { accepted: true as const, expiresInSeconds: this.config.OTP_TTL_SECONDS };
  }

  async verify(identifier: string, code: string, meta: RequestMeta, registrationToken?: string): Promise<SignInResponse> {
    const user = await this.users.findByIdentifier(identifier);
    if (!user) throw badRequest('otp_invalid', 'The code is invalid or has expired');
    this.assertOtp(await this.otp.verify('verify', identifier, code));
    this.assertActive(user);
    const pending = await this.takePendingPassword(user.id);
    return this.db.system(async (tx) => {
      if (!UsersRepository.isAnyVerified(user)) {
        // The first proof of ownership: keep the password only if this caller is who registered.
        await this.users.dropPassword(tx, user.id);
        if (pending && registrationToken && safeEqual(pending.token, sha256(registrationToken))) await this.users.setPassword(tx, user.id, pending.hash);
      }
      await this.users.markVerified(tx, user.id, identifier);
      await this.outbox.add(tx, {
        type: IamEvents.UserVerified,
        actor: userActor(user.id),
        requestId: meta.requestId,
        payload: { userId: user.id, channel: isEmail(identifier) ? 'email' : 'sms' },
      });
      return this.signIn(tx, user, 'verify', meta);
    });
  }

  /** The password waiting from registration, removed as it is read (it can be used once). */
  private async takePendingPassword(userId: string): Promise<{ token: string; hash: string } | null> {
    const raw = await this.redis.getdel(pendingPasswordKey(userId));
    try {
      return raw ? (JSON.parse(raw) as { token: string; hash: string }) : null;
    } catch {
      return null;
    }
  }

  // ---------- sign-in ----------

  async login(identifier: string, password: string, meta: RequestMeta): Promise<SignInResponse> {
    await this.ipLimit('login', meta, this.config.LOGIN_IP_LIMIT_PER_15M, 900);
    const idKey = sha256(identifier);
    const lockTtl = await this.redis.ttl(`iam:lock:${idKey}`);
    if (lockTtl > 0) throw tooManyRequests('account_locked', 'Too many failed sign-in attempts; try again later', lockTtl);

    const user = await this.users.findByIdentifier(identifier);
    const hash = user ? await this.users.passwordHash(user.id) : null;
    const ok = user && hash ? await this.passwords.verify(hash, password) : await this.passwords.verifyDummy(password);
    if (!ok || !user) {
      await this.recordFailure(idKey, user?.id ?? null, meta);
      throw unauthorized('invalid_credentials', 'Email, phone or password is incorrect');
    }
    await this.limiter.reset(`login-fail:${idKey}`);
    this.assertActive(user);
    // Only after the password is proven, so the policy check cannot be used to probe accounts.
    await this.ssoPolicy.assertNotEnforced(user.email ?? identifier, await this.authz.isPlatformAdmin(user.id));
    if (!UsersRepository.isVerified(user, identifier)) {
      throw forbidden('account_unverified', 'Verify your email or phone first: request a code with purpose "verify"');
    }
    return this.db.system((tx) => this.signIn(tx, user, 'password', meta));
  }

  async loginWithOtp(identifier: string, code: string, meta: RequestMeta): Promise<SignInResponse> {
    await this.ipLimit('login', meta, this.config.LOGIN_IP_LIMIT_PER_15M, 900);
    const user = await this.users.findByIdentifier(identifier);
    if (!user) throw badRequest('otp_invalid', 'The code is invalid or has expired');
    this.assertOtp(await this.otp.verify('login', identifier, code));
    this.assertActive(user);
    await this.ssoPolicy.assertNotEnforced(user.email ?? identifier, await this.authz.isPlatformAdmin(user.id));
    if (!UsersRepository.isAnyVerified(user)) await this.takePendingPassword(user.id);
    return this.db.system(async (tx) => {
      // Receiving the code proves control of the identifier, not that this person chose the password.
      if (!UsersRepository.isAnyVerified(user)) await this.users.dropPassword(tx, user.id);
      if (!UsersRepository.isVerified(user, identifier)) await this.users.markVerified(tx, user.id, identifier);
      return this.signIn(tx, user, 'otp', meta);
    });
  }

  async verifyMfa(mfaToken: string, code: string, meta: RequestMeta): Promise<TokenResponse> {
    await this.ipLimit('login', meta, this.config.LOGIN_IP_LIMIT_PER_15M, 900);
    return this.mfa.verifyChallenge(mfaToken, code, meta);
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenResponse> {
    void meta;
    const outcome = await this.consumeRefreshToken(refreshToken);
    const session = await this.sessions.findUsable(outcome.sessionId);
    const user = session ? await this.users.findById(session.userId) : null;
    if (!session || !user || session.userId !== outcome.userId) {
      throw unauthorized('refresh_token_invalid', 'Refresh token is invalid or expired');
    }
    this.assertActive(user);
    const context = await this.issuer.resolveContext(user.id, session.activeOrgId);
    return this.db.system(async (tx) => {
      await this.sessions.touch(tx, session.id, { activeOrgId: context.orgId, activeMembershipId: context.membershipId });
      return this.issuer.tokenResponse(session, context);
    });
  }

  async switchOrg(principal: Principal, orgId: string | null, meta: RequestMeta): Promise<TokenResponse> {
    void meta;
    const session = await this.sessions.findUsable(principal.sessionId);
    if (!session) throw unauthorized('session_ended', 'Session has ended');
    let context: TokenContext = PERSONAL;
    if (orgId) {
      const access = await this.authz.orgAccess(principal.userId, orgId);
      if (!access) throw forbidden('not_a_member', 'You are not an active member of that organisation');
      context = { orgId, membershipId: access.membershipId, roles: AuthzService.orgRoleKeys(access) };
    }
    return this.db.system(async (tx) => {
      await this.sessions.touch(tx, session.id, { activeOrgId: context.orgId, activeMembershipId: context.membershipId });
      await this.issuer.rememberContext(tx, principal.userId, context.orgId);
      return this.issuer.tokenResponse(session, context);
    });
  }

  /**
   * Sign in or sign up with Google. Accounts are matched by Google subject first, then by
   * email. Google has verified the email, so a matching account is linked. If that account was
   * never verified, someone else may have set its password, so the password is removed.
   */
  async googleSignIn(dto: z.infer<typeof GoogleSignInRequestSchema>, meta: RequestMeta): Promise<SignInResponse> {
    await this.ipLimit('login', meta, this.config.LOGIN_IP_LIMIT_PER_15M, 900);
    const google = await this.google.verify(dto.idToken);
    const { userIdentities } = schema;
    const existing = await this.users.findByIdentifier(google.email);
    await this.ssoPolicy.assertNotEnforced(google.email, existing ? await this.authz.isPlatformAdmin(existing.id) : false);
    return this.db.system(async (tx) => {
      const [linked] = await tx
        .select({ userId: userIdentities.userId })
        .from(userIdentities)
        .where(and(eq(userIdentities.provider, 'google'), eq(userIdentities.subject, google.subject)));
      let user = linked ? await this.users.findById(linked.userId, tx) : await this.users.findByIdentifier(google.email, tx);

      if (!user) {
        if (!dto.consent) {
          throw badRequest('consent_required', 'Accept the terms and privacy policy to create your account', { fields: ['consent'] });
        }
        user = await this.users.create(tx, {
          email: google.email,
          phone: null,
          fullName: google.name ?? google.email.split('@')[0]!,
          locale: dto.locale ?? google.locale ?? 'en',
        });
        await this.recordConsent(tx, user.id, dto.consent, meta);
        await this.outbox.add(tx, {
          type: IamEvents.UserRegistered,
          actor: userActor(user.id),
          requestId: meta.requestId,
          payload: { userId: user.id, channel: 'google' },
        });
      } else if (!linked && !user.emailVerifiedAt) {
        await tx.delete(userIdentities).where(and(eq(userIdentities.userId, user.id), eq(userIdentities.provider, 'password')));
      }
      if (!user.emailVerifiedAt && user.email?.toLowerCase() === google.email) await this.users.markVerified(tx, user.id, google.email);
      await tx
        .insert(userIdentities)
        .values({ id: newId(), userId: user.id, provider: 'google', subject: google.subject, lastUsedAt: new Date() })
        .onConflictDoUpdate({ target: [userIdentities.provider, userIdentities.subject], set: { lastUsedAt: new Date() } });
      this.assertActive(user);
      return this.signIn(tx, user, 'google', meta);
    });
  }

  // ---------- sign-out and passwords ----------

  async logout(principal: Principal, meta: RequestMeta): Promise<void> {
    await this.sessions.revoke({ sessionId: principal.sessionId }, 'logout', principal.userId, meta.requestId);
  }

  async logoutAll(principal: Principal, meta: RequestMeta): Promise<void> {
    await this.sessions.revoke({ userId: principal.userId }, 'logout_all', principal.userId, meta.requestId);
  }

  async resetPassword(identifier: string, code: string, newPassword: string, meta: RequestMeta): Promise<void> {
    const user = await this.users.findByIdentifier(identifier);
    if (!user) throw badRequest('otp_invalid', 'The code is invalid or has expired');
    this.assertOtp(await this.otp.verify('reset', identifier, code));
    const hash = await this.passwords.hash(newPassword);
    await this.takePendingPassword(user.id);
    await this.db.system(async (tx) => {
      await this.users.setPassword(tx, user.id, hash);
      // Possession of the code also proves control of the identifier.
      if (!UsersRepository.isVerified(user, identifier)) await this.users.markVerified(tx, user.id, identifier);
      await this.outbox.add(tx, {
        type: IamEvents.UserPasswordChanged,
        actor: userActor(user.id),
        requestId: meta.requestId,
        payload: { userId: user.id, via: 'reset' },
      });
    });
    await this.redis.del(`iam:lock:${sha256(identifier)}`);
    await this.sessions.revoke({ userId: user.id }, 'password_reset', user.id, meta.requestId);
  }

  async changePassword(principal: Principal, current: string, next: string, meta: RequestMeta): Promise<void> {
    const hash = await this.users.passwordHash(principal.userId);
    if (!hash || !(await this.passwords.verify(hash, current))) {
      throw unauthorized('invalid_credentials', 'Current password is incorrect');
    }
    const nextHash = await this.passwords.hash(next);
    await this.db.system(async (tx) => {
      await this.users.setPassword(tx, principal.userId, nextHash);
      await this.outbox.add(tx, {
        type: IamEvents.UserPasswordChanged,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { userId: principal.userId, via: 'change' },
      });
    });
    await this.sessions.revoke({ userId: principal.userId, exceptSessionId: principal.sessionId }, 'password_changed', principal.userId, meta.requestId);
  }

  // ---------- sessions ----------

  async listSessions(principal: Principal) {
    const rows = await this.sessions.list(principal.userId);
    return {
      items: rows.map((s) => ({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        lastUsedAt: s.lastUsedAt.toISOString(),
        userAgent: s.userAgent,
        ip: s.ip,
        current: s.id === principal.sessionId,
      })),
    };
  }

  async revokeSession(principal: Principal, sessionId: string, meta: RequestMeta): Promise<void> {
    const session = await this.sessions.findUsable(sessionId);
    if (!session || session.userId !== principal.userId) throw notFound('session_not_found', 'Session not found');
    await this.sessions.revoke({ sessionId }, 'revoked_by_user', principal.userId, meta.requestId);
  }

  // ---------- helpers ----------

  /** The first factor passed. Accounts with an authenticator app get a challenge; others a session. */
  private async signIn(tx: IamTx, user: UserRow, method: SessionRow['authMethod'], meta: RequestMeta): Promise<SignInResponse> {
    if (MfaService.enabled(user)) return this.mfa.challenge(user, method, meta);
    return this.issuer.start(tx, user, method, meta);
  }

  private async consumeRefreshToken(refreshToken: string): Promise<{ sessionId: string; userId: string }> {
    const outcome = await this.tokens.consumeRefreshToken(refreshToken);
    if (outcome.kind === 'superseded') {
      throw unauthorized('refresh_token_superseded', 'This refresh token was just rotated by another request; use the newer one');
    }
    if (outcome.kind === 'reused') {
      await this.sessions.revoke({ sessionId: outcome.sessionId }, 'refresh_token_reuse', null, null);
      throw unauthorized('refresh_token_reused', 'This sign-in was ended for your safety. Please sign in again.');
    }
    if (outcome.kind === 'invalid') throw unauthorized('refresh_token_invalid', 'Refresh token is invalid or expired');
    return outcome;
  }

  private async recordConsent(tx: IamTx, userId: string, consent: RegisterRequest['consent'], meta: RequestMeta): Promise<void> {
    await recordConsent(tx, userId, consent, meta);
  }

  private async recordFailure(idKey: string, userId: string | null, meta: RequestMeta): Promise<void> {
    const failures = await this.limiter.hit(`login-fail:${idKey}`, this.config.LOGIN_MAX_FAILURES, this.config.LOGIN_LOCKOUT_SECONDS);
    // Lock on the LOGIN_MAX_FAILURES-th consecutive failure.
    if (failures.remaining > 0) return;
    await this.redis.set(`iam:lock:${idKey}`, '1', 'EX', this.config.LOGIN_LOCKOUT_SECONDS);
    await this.limiter.reset(`login-fail:${idKey}`);
    if (userId) {
      await this.db.system((tx) =>
        this.outbox.add(tx, {
          type: IamEvents.UserLockedOut,
          actor: userActor(null),
          requestId: meta.requestId,
          payload: { userId, ip: meta.ip, lockoutSeconds: this.config.LOGIN_LOCKOUT_SECONDS },
        }),
      );
    }
  }

  private async ipLimit(action: string, meta: RequestMeta, limit: number, windowSeconds: number): Promise<void> {
    if (!meta.ip) return;
    const result = await this.limiter.hit(`${action}-ip:${meta.ip}`, limit, windowSeconds);
    if (!result.allowed) throw tooManyRequests('rate_limited', 'Too many requests from this network; try again later', result.retryAfterSeconds);
  }

  private assertOtp(result: OtpVerification): void {
    if (result === 'ok') return;
    if (result === 'exhausted') throw badRequest('otp_exhausted', 'Too many wrong codes. Request a new code.');
    throw badRequest('otp_invalid', 'The code is invalid or has expired');
  }

  private assertActive(user: UserRow): void {
    if (user.status !== 'active') throw forbidden('account_disabled', 'This account is disabled');
  }
}

/** Terms, privacy, AI processing and marketing choices, as given at sign-up. Also used by single sign-on. */
export async function recordConsent(tx: IamTx, userId: string, consent: RegisterRequest['consent'], meta: RequestMeta): Promise<void> {
  const rows = [
    { purpose: 'terms' as const, version: consent.termsVersion, granted: true },
    { purpose: 'privacy' as const, version: consent.privacyVersion, granted: true },
    { purpose: 'ai_processing' as const, version: consent.privacyVersion, granted: consent.aiProcessing },
    { purpose: 'marketing' as const, version: consent.privacyVersion, granted: consent.marketing },
  ];
  await tx.insert(schema.consentRecords).values(
    rows.map((c) => ({ id: newId(), userId, purpose: c.purpose, policyVersion: c.version, granted: c.granted, ip: meta.ip, userAgent: meta.userAgent })),
  );
}
