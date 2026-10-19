import { citext } from '@lib/database';
import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from './organization.entity';

/**
 * An email domain an organisation claims (IAM-14). It counts only once verified through a DNS TXT
 * record. Many organisations may claim a domain while unverified, so a squatter cannot block the
 * real owner; only one can hold it verified.
 */
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
  (t) => [
    uniqueIndex('org_domains_verified_domain_key').on(t.domain).where(sql`verified_at is not null`),
    uniqueIndex('org_domains_org_domain_key').on(t.orgId, t.domain),
    index('org_domains_org_idx').on(t.orgId),
  ],
);
