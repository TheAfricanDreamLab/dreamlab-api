import { citext, ltree } from '@lib/database';
import {
  AnyPgColumn,
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './identity';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** The tenant. Kinds are capabilities; each kind has a 0..1 profile row. */
export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey(),
    parentOrgId: uuid('parent_org_id').references((): AnyPgColumn => organizations.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    kinds: text('kinds').array().notNull(),
    status: text('status', { enum: ['pending', 'active', 'suspended'] }).notNull().default('active'),
    branding: jsonb('branding').$type<Record<string, unknown>>().notNull().default({}),
    terminology: jsonb('terminology').$type<Record<string, string>>().notNull().default({}),
    dataRegion: text('data_region').notNull().default('ng'),
    ...timestamps,
  },
  (t) => [uniqueIndex('organizations_slug_key').on(t.slug), index('organizations_kinds_idx').using('gin', t.kinds)],
);

const orgRef = () =>
  uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' });

export const institutionProfiles = pgTable('institution_profiles', {
  orgId: orgRef().primaryKey(),
  academicCalendar: jsonb('academic_calendar').notNull().default({}),
  ...timestamps,
});

export const enterpriseProfiles = pgTable('enterprise_profiles', {
  orgId: orgRef().primaryKey(),
  industry: text('industry'),
  sizeBand: text('size_band'),
  accountOwnerUserId: uuid('account_owner_user_id').references(() => users.id),
  ...timestamps,
});

export const partnerProfiles = pgTable('partner_profiles', {
  orgId: orgRef().primaryKey(),
  revenueShareDefaultPct: numeric('revenue_share_default_pct', { precision: 5, scale: 2 }),
  payoutAccountRef: text('payout_account_ref'),
  ...timestamps,
});

export const sponsorProfiles = pgTable('sponsor_profiles', {
  orgId: orgRef().primaryKey(),
  fundingType: text('funding_type'),
  reportingCadence: text('reporting_cadence'),
  ...timestamps,
});

export const orgDomains = pgTable(
  'org_domains',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    domain: citext('domain').notNull(),
    verificationToken: text('verification_token').notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    joinPolicy: text('join_policy', { enum: ['none', 'request', 'auto'] }).notNull().default('none'),
    ...timestamps,
  },
  (t) => [uniqueIndex('org_domains_domain_key').on(t.domain), index('org_domains_org_idx').on(t.orgId)],
);

/** Modelled now, built in IAM-12/13. */
export const ssoConnections = pgTable(
  'sso_connections',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    protocol: text('protocol', { enum: ['saml', 'oidc'] }).notNull(),
    config: jsonb('config').notNull().default({}),
    enforced: boolean('enforced').notNull().default(false),
    ...timestamps,
  },
  (t) => [index('sso_connections_org_idx').on(t.orgId)],
);

/** Modelled now, built in IAM-14. */
export const scimDirectories = pgTable(
  'scim_directories',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    tokenHash: text('token_hash').notNull(),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('scim_directories_org_idx').on(t.orgId)],
);

/** The org's one reporting tree. `path` is an ltree of unit ids (hyphens removed), root first. */
export const orgUnits = pgTable(
  'org_units',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    parentUnitId: uuid('parent_unit_id').references((): AnyPgColumn => orgUnits.id),
    name: text('name').notNull(),
    path: ltree('path').notNull(),
    ...timestamps,
  },
  (t) => [index('org_units_org_idx').on(t.orgId), index('org_units_path_gist').using('gist', t.path)],
);

export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    name: text('name').notNull(),
    kind: text('kind', { enum: ['static', 'dynamic'] }).notNull().default('static'),
    rule: jsonb('rule'),
    ...timestamps,
  },
  (t) => [uniqueIndex('groups_org_name_key').on(t.orgId, t.name)],
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    orgUnitId: uuid('org_unit_id').references(() => orgUnits.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['invited', 'active', 'suspended', 'left'] }).notNull(),
    source: text('source', { enum: ['invite', 'self', 'domain', 'scim', 'import', 'bootstrap'] }).notNull(),
    externalId: text('external_id'),
    jobTitle: text('job_title'),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('memberships_user_org_key').on(t.userId, t.orgId),
    index('memberships_org_status_idx').on(t.orgId, t.status),
    index('memberships_unit_idx').on(t.orgUnitId),
  ],
);

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.membershipId] }), index('group_members_membership_idx').on(t.membershipId)],
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    email: citext('email'),
    phone: text('phone'),
    roleKeys: text('role_keys').array().notNull(),
    orgUnitId: uuid('org_unit_id').references(() => orgUnits.id, { onDelete: 'set null' }),
    jobTitle: text('job_title'),
    tokenHash: text('token_hash').notNull(),
    status: text('status', { enum: ['pending', 'accepted', 'revoked', 'expired'] }).notNull().default('pending'),
    invitedByUserId: uuid('invited_by_user_id').references(() => users.id),
    acceptedMembershipId: uuid('accepted_membership_id').references(() => memberships.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('invitations_token_hash_key').on(t.tokenHash), index('invitations_org_status_idx').on(t.orgId, t.status)],
);

/** System roles have org_id null; enterprise custom roles (IAM-15) set it. */
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey(),
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    scopeTypes: text('scope_types').array().notNull(),
    permissions: text('permissions').array().notNull(),
    system: boolean('system').notNull().default(false),
    ...timestamps,
  },
  (t) => [unique('roles_org_key_key').on(t.orgId, t.key).nullsNotDistinct()],
);

export const roleAssignments = pgTable(
  'role_assignments',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    scopeType: text('scope_type', {
      enum: ['org', 'org_unit', 'group', 'program', 'cohort', 'course', 'course_run'],
    }).notNull(),
    scopeId: uuid('scope_id'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    grantedByUserId: uuid('granted_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('role_assignments_unique').on(t.membershipId, t.roleId, t.scopeType, t.scopeId).nullsNotDistinct(),
    index('role_assignments_org_idx').on(t.orgId),
  ],
);
