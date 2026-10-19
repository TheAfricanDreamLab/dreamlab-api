import { citext } from '@lib/database';
import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** One global person. Email and phone are both optional, but at least one is required. */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: citext('email'),
    phone: text('phone'),
    fullName: text('full_name').notNull(),
    locale: text('locale').notNull().default('en'),
    status: text('status', { enum: ['active', 'suspended', 'deleted'] }).notNull().default('active'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    /** Incremented whenever the user's memberships or roles change; tokens carry it as `azv`. */
    authzVersion: integer('authz_version').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_key').on(t.email),
    uniqueIndex('users_phone_key').on(t.phone),
    check('users_contact_present', sql`${t.email} is not null or ${t.phone} is not null`),
  ],
);

/** Ways a user authenticates. The password hash lives on the `password` identity. */
export const userIdentities = pgTable(
  'user_identities',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['password', 'otp', 'google', 'oidc', 'saml'] }).notNull(),
    subject: text('subject').notNull(),
    secretHash: text('secret_hash'),
    ssoConnectionId: uuid('sso_connection_id'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('user_identities_provider_subject_key').on(t.provider, t.subject), index('user_identities_user_idx').on(t.userId)],
);

/** A signed-in device. Refresh tokens point at a session; revoking it ends every token. */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activeOrgId: uuid('active_org_id'),
    activeMembershipId: uuid('active_membership_id'),
    authMethod: text('auth_method', { enum: ['password', 'otp', 'verify', 'sso'] }).notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
  },
  (t) => [index('sessions_user_active_idx').on(t.userId).where(sql`revoked_at is null`)],
);

/** NDPA consent trail: append-only, one row per decision. */
export const consentRecords = pgTable(
  'consent_records',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text('purpose', { enum: ['terms', 'privacy', 'ai_processing', 'marketing', 'guardian'] }).notNull(),
    policyVersion: text('policy_version').notNull(),
    granted: boolean('granted').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('consent_records_user_idx').on(t.userId)],
);

/** EdDSA signing keys. Private keys are AES-256-GCM encrypted with IAM_KEY_ENCRYPTION_SECRET. */
export const signingKeys = pgTable('signing_keys', {
  kid: text('kid').primaryKey(),
  alg: text('alg').notNull().default('EdDSA'),
  publicJwk: jsonb('public_jwk').notNull(),
  privateJwkEncrypted: text('private_jwk_encrypted').notNull(),
  status: text('status', { enum: ['active', 'retiring', 'retired'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  retiredAt: timestamp('retired_at', { withTimezone: true }),
});
