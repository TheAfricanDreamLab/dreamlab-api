import { Injectable } from '@nestjs/common';
import type { MfaChallenge, TokenResponse } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, InjectRedis, RedisRateLimiter, randomToken, sha256, tooManyRequests, unauthorized } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, eq, sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { IamDatabase, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { SecretBox } from '../../keys/secret-box.service';
import { UserRow, UsersRepository } from '../../users/users.repository';
import { matchTotp, newRecoveryCodes, newTotpSecret, otpauthUrl, TOTP_PERIOD_SECONDS } from '../utils/totp';
import { SessionIssuer } from './session-issuer.service';
import { SessionRow, SessionsService } from './sessions.service';

const CHALLENGE_TTL_SECONDS = 300;
const SETUP_TTL_SECONDS = 600;
const MAX_FAILURES = 5;
const LOCK_SECONDS = 900;
const { users } = schema;

interface ChallengeRecord {
  uid: string;
  method: SessionRow['authMethod'];
  /** Tenant the first factor came through, so the session lands in the same place. */
  org: string | null;
  attempts: number;
}

/**
 * Authenticator apps (IAM-19). Signing in with any first factor returns a challenge instead of
 * tokens when the account has one; the code (or a recovery code) completes it.
 */
@Injectable()
export class MfaService {
  private readonly limiter: RedisRateLimiter;

  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() private readonly redis: Redis,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly users: UsersRepository,
    private readonly box: SecretBox,
    private readonly issuer: SessionIssuer,
    private readonly sessions: SessionsService,
  ) {
    this.limiter = new RedisRateLimiter(redis, 'iam:rl:');
  }

  static enabled(user: Pick<UserRow, 'mfaEnabledAt' | 'mfaSecretEncrypted'>): boolean {
    return user.mfaEnabledAt !== null && user.mfaSecretEncrypted !== null;
  }

  async challenge(user: UserRow, method: SessionRow['authMethod'], meta: RequestMeta): Promise<MfaChallenge> {
    const token = randomToken(32);
    const record: ChallengeRecord = { uid: user.id, method, org: meta.tenantOrgId, attempts: 0 };
    await this.redis.set(this.challengeKey(token), JSON.stringify(record), 'EX', CHALLENGE_TTL_SECONDS);
    return {
      mfaRequired: true,
      mfaToken: token,
      expiresIn: CHALLENGE_TTL_SECONDS,
      methods: user.mfaRecoveryHashes.length > 0 ? ['totp', 'recovery_code'] : ['totp'],
    };
  }

  async verifyChallenge(token: string, code: string, meta: RequestMeta): Promise<TokenResponse> {
    const key = this.challengeKey(token);
    const raw = await this.redis.get(key);
    if (!raw) throw unauthorized('mfa_challenge_invalid', 'This sign-in has expired. Please sign in again.');
    const record = JSON.parse(raw) as ChallengeRecord;
    const user = await this.users.findById(record.uid);
    if (!user || user.status !== 'active' || !MfaService.enabled(user)) {
      await this.redis.del(key);
      throw unauthorized('mfa_challenge_invalid', 'This sign-in has expired. Please sign in again.');
    }
    if (!(await this.checkCode(user, code))) {
      record.attempts += 1;
      if (record.attempts >= MAX_FAILURES) await this.redis.del(key);
      else await this.redis.set(key, JSON.stringify(record), 'KEEPTTL');
      throw badRequest('mfa_code_invalid', 'That code isn’t right. Check your authenticator app and try again.');
    }
    // Single use: whoever deletes it first completes the sign-in.
    if ((await this.redis.del(key)) !== 1) throw unauthorized('mfa_challenge_invalid', 'This sign-in has expired. Please sign in again.');
    return this.db.system((tx) => this.issuer.start(tx, user, record.method, { ...meta, tenantOrgId: record.org }, { mfa: true }));
  }

  async status(principal: Principal) {
    const user = await this.mustFindUser(principal.userId);
    const session = await this.sessions.findUsable(principal.sessionId);
    return {
      enabled: MfaService.enabled(user),
      enabledAt: user.mfaEnabledAt?.toISOString() ?? null,
      recoveryCodesRemaining: user.mfaRecoveryHashes.length,
      sessionVerified: Boolean(session?.mfaAt),
    };
  }

  async setup(principal: Principal) {
    const user = await this.mustFindUser(principal.userId);
    if (MfaService.enabled(user)) throw conflict('mfa_already_enabled', 'You already have an authenticator app. Remove it first to add another.');
    const secret = newTotpSecret();
    await this.redis.set(`iam:totp-setup:${user.id}`, this.box.encrypt(secret), 'EX', SETUP_TTL_SECONDS);
    return { secret, otpauthUrl: otpauthUrl(secret, user.email ?? user.phone ?? user.fullName), expiresIn: SETUP_TTL_SECONDS };
  }

  async confirm(principal: Principal, code: string, meta: RequestMeta) {
    const pending = await this.redis.get(`iam:totp-setup:${principal.userId}`);
    if (!pending) throw badRequest('mfa_setup_expired', 'Setting up took too long. Start again.');
    const secret = this.box.decrypt(pending);
    const step = matchTotp(secret, code);
    if (step === null || !(await this.claimStep(principal.userId, step))) {
      throw badRequest('mfa_code_invalid', 'That code isn’t right. Check the time on your phone and try the newest code.');
    }
    const recoveryCodes = newRecoveryCodes();
    await this.db.system(async (tx) => {
      const updated = await tx
        .update(users)
        .set({ mfaSecretEncrypted: this.box.encrypt(secret), mfaEnabledAt: new Date(), mfaRecoveryHashes: recoveryCodes.map((c) => sha256(c)) })
        .where(and(eq(users.id, principal.userId), sql`${users.mfaEnabledAt} is null`))
        .returning({ id: users.id });
      if (updated.length === 0) throw conflict('mfa_already_enabled', 'You already have an authenticator app.');
      await this.outbox.add(tx, { type: IamEvents.UserMfaEnabled, actor: userActor(principal.userId), requestId: meta.requestId, payload: { userId: principal.userId } });
    });
    await this.redis.del(`iam:totp-setup:${principal.userId}`);
    // Proving the code in this session counts as passing MFA here.
    await this.sessions.markMfa(principal.sessionId);
    return { recoveryCodes };
  }

  /** Confirm a code inside an existing session, then reissue its tokens with `mfa` in amr. */
  async stepUp(principal: Principal, code: string): Promise<TokenResponse> {
    const user = await this.mustFindUser(principal.userId);
    if (!MfaService.enabled(user)) throw badRequest('mfa_not_enabled', 'Add an authenticator app first (Account → Two-step sign-in).');
    await this.assertCode(user, code);
    const session = await this.sessions.markMfa(principal.sessionId);
    if (!session) throw unauthorized('session_ended', 'Session has ended');
    const context = await this.issuer.resolveContext(principal.userId, session.activeOrgId);
    return this.issuer.tokenResponse(session, context);
  }

  async regenerateRecoveryCodes(principal: Principal, code: string) {
    const user = await this.mustFindUser(principal.userId);
    if (!MfaService.enabled(user)) throw badRequest('mfa_not_enabled', 'Add an authenticator app first.');
    await this.assertCode(user, code);
    const recoveryCodes = newRecoveryCodes();
    await this.db.sys.update(users).set({ mfaRecoveryHashes: recoveryCodes.map((c) => sha256(c)) }).where(eq(users.id, user.id));
    return { recoveryCodes };
  }

  async disable(principal: Principal, code: string, meta: RequestMeta): Promise<void> {
    const user = await this.mustFindUser(principal.userId);
    if (!MfaService.enabled(user)) return;
    await this.assertCode(user, code);
    await this.db.system(async (tx) => {
      await tx.update(users).set({ mfaSecretEncrypted: null, mfaEnabledAt: null, mfaRecoveryHashes: [] }).where(eq(users.id, user.id));
      await this.outbox.add(tx, { type: IamEvents.UserMfaDisabled, actor: userActor(user.id), requestId: meta.requestId, payload: { userId: user.id } });
    });
  }

  // ---------- helpers ----------

  private async assertCode(user: UserRow, code: string): Promise<void> {
    if (!(await this.checkCode(user, code))) throw badRequest('mfa_code_invalid', 'That code isn’t right. Check your authenticator app and try again.');
  }

  /** TOTP (each time step usable once) or a recovery code (removed when used). Locks after repeated failures. */
  private async checkCode(user: UserRow, code: string): Promise<boolean> {
    const lockKey = `iam:mfa-lock:${user.id}`;
    const locked = await this.redis.ttl(lockKey);
    if (locked > 0) throw tooManyRequests('mfa_locked', 'Too many wrong codes. Try again in a few minutes.', locked);

    let ok = false;
    const trimmed = code.trim().toLowerCase();
    if (/^\d{6}$/.test(trimmed)) {
      const step = matchTotp(this.box.decrypt(user.mfaSecretEncrypted!), trimmed);
      ok = step !== null && (await this.claimStep(user.id, step));
    } else {
      const hash = sha256(trimmed);
      const updated = await this.db.sys
        .update(users)
        .set({ mfaRecoveryHashes: sql`array_remove(${users.mfaRecoveryHashes}, ${hash})` })
        .where(and(eq(users.id, user.id), sql`${hash} = any(${users.mfaRecoveryHashes})`))
        .returning({ id: users.id });
      ok = updated.length > 0;
    }
    if (ok) {
      await this.limiter.reset(`mfa-fail:${user.id}`);
      return true;
    }
    const fails = await this.limiter.hit(`mfa-fail:${user.id}`, MAX_FAILURES, LOCK_SECONDS);
    if (fails.remaining <= 0) await this.redis.set(lockKey, '1', 'EX', LOCK_SECONDS);
    return false;
  }

  /** A TOTP code works once: record its time step for as long as it could still be accepted. */
  private async claimStep(userId: string, step: number): Promise<boolean> {
    const result = await this.redis.set(`iam:totp-used:${userId}:${step}`, '1', 'EX', TOTP_PERIOD_SECONDS * 3, 'NX');
    return result === 'OK';
  }

  private challengeKey(token: string): string {
    return `iam:mfa-challenge:${sha256(token)}`;
  }

  private async mustFindUser(id: string): Promise<UserRow> {
    const user = await this.users.findById(id);
    if (!user) throw unauthorized('session_ended', 'Session has ended');
    return user;
  }
}
