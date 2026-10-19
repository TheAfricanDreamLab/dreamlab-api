import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from './organization.entity';

/** OIDC: issuer and client id. The client secret is in `secret_encrypted`, never in `config`. */
export interface OidcConfig {
  issuer: string;
  clientId: string;
}

/** SAML: the identity provider's entity id, sign-on URL and signing certificate (PEM). */
export interface SamlConfig {
  idpEntityId: string;
  idpSsoUrl: string;
  certificate: string;
}

/** One single sign-on connection per organisation (IAM-15 OIDC, IAM-16 SAML). */
export const ssoConnections = pgTable(
  'sso_connections',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    protocol: text('protocol', { enum: ['saml', 'oidc'] }).notNull(),
    config: jsonb('config').$type<OidcConfig | SamlConfig>().notNull().default({} as OidcConfig),
    /** AES-256-GCM, IAM_KEY_ENCRYPTION_SECRET. OIDC client secret only. */
    secretEncrypted: text('secret_encrypted'),
    enabled: boolean('enabled').notNull().default(false),
    enforced: boolean('enforced').notNull().default(false),
    testedAt: timestamp('tested_at', { withTimezone: true }),
    defaultRoleKey: text('default_role_key').notNull().default('learner'),
    ...timestamps,
  },
  (t) => [uniqueIndex('sso_connections_org_key').on(t.orgId)],
);
