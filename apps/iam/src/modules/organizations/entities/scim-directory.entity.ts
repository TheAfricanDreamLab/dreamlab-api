import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from './organization.entity';

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
