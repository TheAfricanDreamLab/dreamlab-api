import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConsentSchema, SsoResult } from '@dreamlab/contracts';
import type { z } from 'zod';
import type { Principal } from '@lib/auth';
import { badRequest, forbidden, InjectRedis, newId, notFound, randomToken, RedisRateLimiter, sha256, tooManyRequests, unauthorized } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import type { IamConfig } from '../../../config';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { recordConsent } from '../../auth/auth.service';
import { SessionIssuer } from '../../auth/services/session-issuer.service';
import { SsoPolicy } from '../../auth/services/sso-policy.service';
import { emailDomain } from '../../auth/utils/email-domain';
import { AuthzService } from '../../authz/authz.service';
import { SecretBox } from '../../keys/secret-box.service';
import type { OidcConfig, SamlConfig } from '../../organizations/entities/sso-connection.entity';
import { UsersRepository } from '../../users/users.repository';
import { OidcClient, OidcError } from '../providers/oidc.client';
import { SamlClient } from '../providers/saml.client';
import { OIDC_CLIENT, samlEntityId, serviceProvider } from './sso-connections.service';

const STATE_TTL_SECONDS = 600;
const DONE_TTL_SECONDS = 120;
const { ssoConnections, orgDomains, organizations, userIdentities, memberships, roleAssignments, roles } = schema;
type ConnectionRow = typeof ssoConnections.$inferSelect;

/** Fingerprint of the identity-provider details, so a test only vouches for what was tested. */
const connectionVersion = (c: ConnectionRow): string => sha256(JSON.stringify([c.protocol, c.config, c.secretEncrypted]));

interface PendingSignOn {
  connectionId: string;
  orgId: string;
  protocol: 'oidc' | 'saml';
  mode: 'signin' | 'test';
  /** The connection as it was when the test started; a test only counts for those details. */
  connectionVersion: string;
  testerUserId: string | null;
  returnTo: string | null;
  consent: z.infer<typeof ConsentSchema> | null;
  nonce?: string;
  codeVerifier?: string;
}

interface Identity {
  subject: string;
  email: string | null;
  name: string | null;
}

/**
 * The browser side of single sign-on. State lives in Redis and is single-use; the web app also
 * keeps it in an httpOnly cookie and only finishes a sign-on that started in the same browser.
 */
@Injectable()
export class SsoSignInService {
  private readonly logger = new Logger(SsoSignInService.name);
  private readonly limiter: RedisRateLimiter;

  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectRedis() private readonly redis: Redis,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(OIDC_CLIENT) private readonly oidc: OidcClient,
    private readonly box: SecretBox,
    private readonly policy: SsoPolicy,
    private readonly issuer: SessionIssuer,
    private readonly users: UsersRepository,
    private readonly authz: AuthzService,
  ) {
    this.limiter = new RedisRateLimiter(redis, 'iam:rl:');
  }

  async discover(input: { email?: string; slug?: string }) {
    let route = null;
    if (input.email) route = await this.policy.forEmail(input.email);
    else if (input.slug) {
      const [org] = await this.db.sys.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, input.slug));
      route = org ? await this.policy.forOrg(org.id) : null;
    }
    if (!route) throw notFound('sso_not_found', 'We couldn’t find single sign-on for that. Check the address, or sign in another way.');
    return { orgId: route.orgId, orgName: route.orgName, orgSlug: route.orgSlug, protocol: route.protocol };
  }

  async start(
    input: { orgId: string; mode: 'signin' | 'test'; consent?: z.infer<typeof ConsentSchema>; returnTo?: string },
    principal: Principal | undefined,
    meta: RequestMeta,
  ) {
    await this.ipLimit(meta);
    const connection = await this.connectionFor(input.orgId, input.mode);
    if (input.mode === 'test') {
      if (!principal || !(await this.authz.can(principal.userId, input.orgId, 'org.security.manage'))) {
        throw forbidden('permission_denied', 'Only the organisation’s admins can test its sign-on');
      }
    }
    const state = randomToken(32);
    const pending: PendingSignOn = {
      connectionId: connection.id,
      orgId: connection.orgId,
      protocol: connection.protocol,
      mode: input.mode,
      connectionVersion: connectionVersion(connection),
      testerUserId: input.mode === 'test' ? principal!.userId : null,
      returnTo: input.returnTo ?? null,
      consent: input.consent ?? null,
    };
    let redirectUrl: string;
    if (connection.protocol === 'oidc') {
      const c = connection.config as OidcConfig;
      pending.nonce = randomToken(24);
      pending.codeVerifier = randomToken(48);
      const discovery = await this.oidc.discover(c.issuer).catch((err: unknown) => {
        throw badRequest('sso_unavailable', `Your organisation’s sign-on isn’t answering: ${err instanceof Error ? err.message : 'unknown error'}`);
      });
      redirectUrl = this.oidc.authorizationUrl(discovery, {
        clientId: c.clientId,
        redirectUri: serviceProvider(this.config, connection.orgId, connection).oidcRedirectUri,
        state,
        nonce: pending.nonce,
        codeVerifier: pending.codeVerifier,
      });
    } else {
      redirectUrl = await this.samlClient(connection).authorizeUrl(state);
    }
    await this.redis.set(this.stateKey(state), JSON.stringify(pending), 'EX', STATE_TTL_SECONDS);
    return { redirectUrl, state, expiresIn: STATE_TTL_SECONDS };
  }

  async oidcCallback(state: string, code: string, meta: RequestMeta): Promise<SsoResult> {
    const pending = await this.takeState(state);
    if (pending.protocol !== 'oidc') throw unauthorized('sso_state_invalid', 'This sign-on has expired. Please start again.');
    const connection = await this.connectionFor(pending.orgId, pending.mode, pending.connectionId);
    const c = connection.config as OidcConfig;
    let identity: Identity;
    try {
      const discovery = await this.oidc.discover(c.issuer);
      identity = await this.oidc.exchange(discovery, {
        clientId: c.clientId,
        clientSecret: this.box.decrypt(connection.secretEncrypted!),
        code,
        redirectUri: serviceProvider(this.config, connection.orgId, connection).oidcRedirectUri,
        codeVerifier: pending.codeVerifier!,
        nonce: pending.nonce!,
      });
    } catch (err) {
      this.logger.warn(`OIDC sign-on failed for org ${pending.orgId}: ${err instanceof Error ? err.message : String(err)}`);
      throw unauthorized('sso_failed', err instanceof OidcError ? `Sign-on failed: ${err.message}.` : 'Sign-on failed. Please try again.');
    }
    return this.complete(connection, pending, identity, meta);
  }

  /** Validate the POSTed SAML response now; the browser finishes it with a same-site request. */
  async samlAcs(samlResponse: string, relayState: string) {
    const pending = await this.takeState(relayState);
    if (pending.protocol !== 'saml') throw unauthorized('sso_state_invalid', 'This sign-on has expired. Please start again.');
    const connection = await this.connectionFor(pending.orgId, pending.mode, pending.connectionId);
    let identity: Identity;
    try {
      identity = await this.samlClient(connection).validate(samlResponse);
    } catch (err) {
      this.logger.warn(`SAML sign-on failed for org ${pending.orgId}: ${err instanceof Error ? err.message : String(err)}`);
      throw unauthorized('sso_failed', 'Your organisation’s sign-on answer could not be verified. Please try again.');
    }
    await this.redis.set(this.doneKey(relayState), JSON.stringify({ pending, identity }), 'EX', DONE_TTL_SECONDS);
    return { state: relayState };
  }

  async finish(state: string, meta: RequestMeta): Promise<SsoResult> {
    const raw = await this.redis.getdel(this.doneKey(state));
    if (!raw) throw unauthorized('sso_state_invalid', 'This sign-on has expired. Please start again.');
    const { pending, identity } = JSON.parse(raw) as { pending: PendingSignOn; identity: Identity };
    const connection = await this.connectionFor(pending.orgId, pending.mode, pending.connectionId);
    return this.complete(connection, pending, identity, meta);
  }

  async metadata(connectionId: string): Promise<string> {
    const [row] = await this.db.sys.select().from(ssoConnections).where(and(eq(ssoConnections.id, connectionId), eq(ssoConnections.protocol, 'saml')));
    if (!row) throw notFound('sso_not_found', 'No SAML connection with that id');
    return this.samlClient(row).metadata();
  }

  // ---------- helpers ----------

  /**
   * The identity provider vouched for this person. Only addresses at the organisation's verified
   * domains are accepted, so a misconfigured or hostile IdP cannot sign in as anyone else.
   */
  private async complete(connection: ConnectionRow, pending: PendingSignOn, identity: Identity, meta: RequestMeta): Promise<SsoResult> {
    if (!identity.subject) throw unauthorized('sso_failed', 'Your organisation’s sign-on did not say who you are.');
    if (!identity.email) throw forbidden('sso_email_missing', 'Your organisation’s sign-on did not share an email address. Ask your IT team to release the email claim.');
    const domain = emailDomain(identity.email)!;
    const [owned] = await this.db.sys
      .select({ id: orgDomains.id })
      .from(orgDomains)
      .where(and(eq(orgDomains.orgId, connection.orgId), eq(orgDomains.domain, domain), isNotNull(orgDomains.verifiedAt)));
    if (!owned) throw forbidden('sso_domain_not_verified', `${domain} is not one of this organisation’s verified email domains.`);

    if (pending.mode === 'test') {
      // Count the test only if the connection is unchanged since the test started.
      if (connectionVersion(connection) === pending.connectionVersion) {
        await this.db.sys.update(ssoConnections).set({ testedAt: new Date() }).where(eq(ssoConnections.id, connection.id));
      }
      return { kind: 'test', orgId: connection.orgId, email: identity.email, name: identity.name };
    }

    const subject = `${connection.id}:${identity.subject}`;
    // Committed first: authorization reads the new membership through its own connection.
    const user = await this.db.system(async (tx) => {
      const [linked] = await tx
        .select({ userId: userIdentities.userId })
        .from(userIdentities)
        .where(and(eq(userIdentities.provider, connection.protocol), eq(userIdentities.subject, subject)));
      let user = linked ? await this.users.findById(linked.userId, tx) : await this.users.findByIdentifier(identity.email!, tx);
      if (!user) {
        if (!pending.consent) throw badRequest('consent_required', 'Accept the terms and privacy policy to create your account');
        user = await this.users.create(tx, { email: identity.email, phone: null, fullName: identity.name ?? identity.email!.split('@')[0]!, locale: 'en' });
        await recordConsent(tx, user.id, pending.consent, meta);
        await this.outbox.add(tx, { type: IamEvents.UserRegistered, actor: userActor(user.id), requestId: meta.requestId, payload: { userId: user.id, channel: 'sso' } });
      } else if (!linked && !user.emailVerifiedAt) {
        // Nobody had proven this address; a password set on it may not be the owner's.
        await tx.delete(userIdentities).where(and(eq(userIdentities.userId, user.id), eq(userIdentities.provider, 'password')));
      }
      if (user.status !== 'active') throw forbidden('account_disabled', 'This account is disabled');
      if (!user.emailVerifiedAt && user.email?.toLowerCase() === identity.email) await this.users.markVerified(tx, user.id, identity.email!);
      await tx
        .insert(userIdentities)
        .values({ id: newId(), userId: user.id, provider: connection.protocol, subject, ssoConnectionId: connection.id, lastUsedAt: new Date() })
        .onConflictDoUpdate({ target: [userIdentities.provider, userIdentities.subject], set: { lastUsedAt: new Date() } });
      await this.ensureMembership(tx, user.id, connection, meta);
      return user;
    });
    // The organisation's own sign-on counts as its second factor.
    const tokens = await this.db.system((tx) => this.issuer.start(tx, user, 'sso', meta, { mfa: true, orgId: connection.orgId }));
    return { kind: 'session' as const, tokens, returnTo: pending.returnTo };
  }

  /** Sign-on is also how people join: first sign-in makes them a member with the default role. */
  private async ensureMembership(tx: IamTx, userId: string, connection: ConnectionRow, meta: RequestMeta): Promise<void> {
    const [existing] = await tx.select().from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.orgId, connection.orgId)));
    if (existing?.status === 'active') return;
    if (existing?.status === 'suspended') throw forbidden('membership_suspended', 'Your access to this organisation is paused. Ask an admin.');
    const membershipId = existing?.id ?? newId();
    if (existing) {
      await tx.update(memberships).set({ status: 'active', joinedAt: new Date() }).where(eq(memberships.id, existing.id));
    } else {
      await tx.insert(memberships).values({ id: membershipId, userId, orgId: connection.orgId, status: 'active', source: 'domain', joinedAt: new Date() });
    }
    const [anyRole] = await tx.select({ id: roleAssignments.id }).from(roleAssignments).where(eq(roleAssignments.membershipId, membershipId));
    if (!anyRole) {
      const [role] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.key, connection.defaultRoleKey), or(isNull(roles.orgId), eq(roles.orgId, connection.orgId))));
      if (role) await tx.insert(roleAssignments).values({ id: newId(), orgId: connection.orgId, membershipId, roleId: role.id, scopeType: 'org', grantedByUserId: null });
    }
    await this.authz.bumpVersion(tx, [userId]);
    await this.outbox.add(tx, {
      type: IamEvents.MemberJoined,
      orgId: connection.orgId,
      actor: userActor(userId),
      requestId: meta.requestId,
      payload: { orgId: connection.orgId, membershipId, userId, via: 'sso' },
    });
  }

  private async connectionFor(orgId: string, mode: 'signin' | 'test', connectionId?: string): Promise<ConnectionRow> {
    const [row] = await this.db.sys
      .select({ c: ssoConnections, status: organizations.status })
      .from(ssoConnections)
      .innerJoin(organizations, eq(organizations.id, ssoConnections.orgId))
      .where(and(eq(ssoConnections.orgId, orgId), connectionId ? eq(ssoConnections.id, connectionId) : undefined));
    // Tests may run before sign-on is switched on, or while the organisation awaits approval.
    if (!row || (mode === 'signin' && (!row.c.enabled || row.status !== 'active')) || row.status === 'suspended') {
      throw notFound('sso_not_found', 'Single sign-on isn’t available for this organisation.');
    }
    return row.c;
  }

  private samlClient(connection: ConnectionRow): SamlClient {
    const c = connection.config as SamlConfig;
    const sp = serviceProvider(this.config, connection.orgId, connection);
    return new SamlClient({ entityId: samlEntityId(this.config, connection.orgId), acsUrl: sp.samlAcsUrl }, c, this.redis, connection.id);
  }

  private async takeState(state: string): Promise<PendingSignOn> {
    const raw = await this.redis.getdel(this.stateKey(state));
    if (!raw) throw unauthorized('sso_state_invalid', 'This sign-on has expired. Please start again.');
    return JSON.parse(raw) as PendingSignOn;
  }

  private stateKey(state: string): string {
    return `iam:sso-state:${sha256(state)}`;
  }

  private doneKey(state: string): string {
    return `iam:sso-done:${sha256(state)}`;
  }

  private async ipLimit(meta: RequestMeta): Promise<void> {
    if (!meta.ip) return;
    const result = await this.limiter.hit(`sso-ip:${meta.ip}`, this.config.LOGIN_IP_LIMIT_PER_15M, 900);
    if (!result.allowed) throw tooManyRequests('rate_limited', 'Too many requests from this network; try again later', result.retryAfterSeconds);
  }
}
