import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from './organization.entity';

/** SCIM 2.0 provisioning for an organisation (IAM-17). Only the bearer token's SHA-256 is stored. */
export const scimDirectories = pgTable(
  'scim_directories',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    tokenHash: text('token_hash').notNull(),
    /** First characters of the token, so admins can recognise it. */
    tokenHint: text('token_hint'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('scim_directories_org_key').on(t.orgId), uniqueIndex('scim_directories_token_key').on(t.tokenHash)],
);
