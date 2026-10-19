import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { SaveSsoConnectionSchema } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { AppException, badRequest, conflict, newId, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import type { IamConfig } from '../../../config';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { SecretBox } from '../../keys/secret-box.service';
import type { OidcConfig, SamlConfig } from '../../organizations/entities/sso-connection.entity';
import { OidcClient } from '../providers/oidc.client';
import { normaliseCertificate } from '../providers/saml.client';
import { assertSafeUrl, UnsafeUrlError } from '../utils/safe-url';

export const OIDC_CLIENT = Symbol('OIDC_CLIENT');
type SaveDto = z.infer<typeof SaveSsoConnectionSchema>;
type ConnectionRow = typeof schema.ssoConnections.$inferSelect;
const { ssoConnections, orgDomains, roles } = schema;

/** Our side of the connection: the URLs and ids an admin gives their identity provider. */
export function serviceProvider(config: Pick<IamConfig, 'PUBLIC_APP_URL' | 'PUBLIC_API_URL'>, orgId: string, connection: ConnectionRow | null) {
  const app = config.PUBLIC_APP_URL.replace(/\/$/, '');
  const api = config.PUBLIC_API_URL.replace(/\/$/, '');
  return {
    oidcRedirectUri: `${app}/sso/oidc/callback`,
    samlAcsUrl: `${app}/sso/saml/acs`,
    samlEntityId: samlEntityId(config, orgId),
    samlMetadataUrl: connection?.protocol === 'saml' ? `${api}/v1/auth/sso/saml/${connection.id}/metadata` : null,
  };
}

/** One entity id (and audience) per organisation, known before the connection is saved. */
export const samlEntityId = (config: Pick<IamConfig, 'PUBLIC_APP_URL'>, orgId: string): string =>
  `${config.PUBLIC_APP_URL.replace(/\/$/, '')}/sso/saml/${orgId}`;

export function toConnection(row: ConnectionRow) {
  const base = {
    id: row.id,
    protocol: row.protocol,
    enabled: row.enabled,
    enforced: row.enforced,
    testedAt: row.testedAt?.toISOString() ?? null,
    defaultRoleKey: row.defaultRoleKey,
    oidc: null as null | { issuer: string; clientId: string; hasClientSecret: boolean },
    saml: null as null | { idpEntityId: string; idpSsoUrl: string; certificateFingerprint: string; certificateExpiresAt: string | null },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  if (row.protocol === 'oidc') {
    const c = row.config as OidcConfig;
    base.oidc = { issuer: c.issuer, clientId: c.clientId, hasClientSecret: row.secretEncrypted !== null };
  } else {
    const c = row.config as SamlConfig;
    const cert = normaliseCertificate(c.certificate);
    base.saml = { idpEntityId: c.idpEntityId, idpSsoUrl: c.idpSsoUrl, certificateFingerprint: cert.fingerprint, certificateExpiresAt: cert.expiresAt?.toISOString() ?? null };
  }
  return base;
}

/** Org admins configure their own single sign-on (IAM-15 OIDC, IAM-16 SAML). */
@Injectable()
export class SsoConnectionsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(OIDC_CLIENT) private readonly oidc: OidcClient,
    private readonly box: SecretBox,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

  async get(principal: Principal, orgId: string) {
    const row = await this.find(principal, orgId);
    return { connection: row ? toConnection(row) : null, serviceProvider: serviceProvider(this.config, orgId, row) };
  }

  async save(principal: Principal, orgId: string, dto: SaveDto, meta: RequestMeta) {
    await this.assertVerifiedDomain(principal, orgId);
    const existing = await this.find(principal, orgId);
    if (dto.defaultRoleKey) await this.assertRole(principal, orgId, dto.defaultRoleKey);

    let config: OidcConfig | SamlConfig;
    let secretEncrypted: string | null = existing?.protocol === dto.protocol ? existing.secretEncrypted : null;
    if (dto.protocol === 'oidc') {
      const issuer = dto.issuer.replace(/\/+$/, '');
      try {
        await assertSafeUrl(issuer, this.config.SSO_ALLOW_PRIVATE_URLS);
        await this.oidc.discover(issuer);
      } catch (err) {
        throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, 'sso_issuer_unreachable', `We couldn’t use that issuer: ${err instanceof Error ? err.message : 'unknown error'}.`);
      }
      if (dto.clientSecret) secretEncrypted = this.box.encrypt(dto.clientSecret);
      if (!secretEncrypted) throw badRequest('client_secret_required', 'Paste the client secret from your identity provider', { fields: ['clientSecret'] });
      config = { issuer, clientId: dto.clientId };
    } else {
      try {
        await assertSafeUrl(dto.idpSsoUrl, this.config.SSO_ALLOW_PRIVATE_URLS);
      } catch (err) {
        throw badRequest('sso_url_invalid', err instanceof UnsafeUrlError ? err.message : 'That sign-on URL cannot be used', { fields: ['idpSsoUrl'] });
      }
      let pem: string;
      try {
        pem = normaliseCertificate(dto.certificate).pem;
      } catch {
        throw badRequest('certificate_invalid', 'That is not a valid X.509 certificate', { fields: ['certificate'] });
      }
      config = { idpEntityId: dto.idpEntityId, idpSsoUrl: dto.idpSsoUrl, certificate: pem };
      secretEncrypted = null;
    }

    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      // New identity-provider details have not been tested: sign-on cannot stay enforced.
      const values = { protocol: dto.protocol, config, secretEncrypted, testedAt: null, enforced: false, ...(dto.defaultRoleKey ? { defaultRoleKey: dto.defaultRoleKey } : {}) };
      const [row] = existing
        ? await tx.update(ssoConnections).set(values).where(eq(ssoConnections.id, existing.id)).returning()
        : await tx.insert(ssoConnections).values({ id: newId(), orgId, ...values }).returning();
      await this.event(tx, principal, orgId, meta, { connectionId: row!.id, change: existing ? 'updated' : 'created', protocol: dto.protocol });
      return toConnection(row!);
    });
  }

  async update(principal: Principal, orgId: string, patch: { enabled?: boolean; enforced?: boolean; defaultRoleKey?: string }, meta: RequestMeta) {
    const row = await this.find(principal, orgId);
    if (!row) throw notFound('sso_not_found', 'Set up single sign-on first');
    if (patch.defaultRoleKey) await this.assertRole(principal, orgId, patch.defaultRoleKey);
    const enabled = patch.enabled ?? row.enabled;
    let enforced = patch.enforced ?? row.enforced;
    if (!enabled) enforced = false;
    if (enforced && !row.enforced) {
      if (!row.testedAt) throw conflict('sso_untested', 'Sign in once with “Test sign-on” before requiring it, so nobody is locked out.');
      if (!enabled) throw conflict('sso_disabled', 'Turn single sign-on on before requiring it.');
    }
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const [updated] = await tx
        .update(ssoConnections)
        .set({ enabled, enforced, ...(patch.defaultRoleKey ? { defaultRoleKey: patch.defaultRoleKey } : {}) })
        .where(eq(ssoConnections.id, row.id))
        .returning();
      await this.event(tx, principal, orgId, meta, { connectionId: row.id, change: 'settings', enabled, enforced });
      return toConnection(updated!);
    });
  }

  async remove(principal: Principal, orgId: string, meta: RequestMeta): Promise<void> {
    const row = await this.find(principal, orgId);
    if (!row) return;
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      await tx.delete(ssoConnections).where(eq(ssoConnections.id, row.id));
      await this.event(tx, principal, orgId, meta, { connectionId: row.id, change: 'deleted' });
    });
  }

  private async find(principal: Principal, orgId: string): Promise<ConnectionRow | null> {
    const [row] = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select().from(ssoConnections));
    return row ?? null;
  }

  private async assertVerifiedDomain(principal: Principal, orgId: string): Promise<void> {
    const [domain] = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select({ id: orgDomains.id }).from(orgDomains).where(isNotNull(orgDomains.verifiedAt)));
    if (!domain) throw conflict('domain_required', 'Verify at least one email domain first. Sign-on only accepts addresses at your verified domains.');
  }

  private async assertRole(principal: Principal, orgId: string, key: string): Promise<void> {
    if (key === 'platform_admin' || key === 'org_admin') throw badRequest('role_not_allowed', 'Choose a role without admin rights for people joining by sign-on');
    const [role] = await this.db.tenant(this.ctx(principal, orgId), (tx) =>
      tx.select({ scopes: roles.scopeTypes }).from(roles).where(and(eq(roles.key, key), or(isNull(roles.orgId), eq(roles.orgId, orgId)))),
    );
    if (!role || !role.scopes.includes('org')) throw badRequest('role_not_found', `Unknown role: ${key}`, { fields: ['defaultRoleKey'] });
  }

  private async event(tx: IamTx, principal: Principal, orgId: string, meta: RequestMeta, payload: Record<string, unknown>) {
    await this.outbox.add(tx, { type: IamEvents.SsoChanged, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload: { orgId, ...payload } });
  }
}
