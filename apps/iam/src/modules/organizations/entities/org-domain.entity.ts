import { citext } from '@lib/database';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from './organization.entity';

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
