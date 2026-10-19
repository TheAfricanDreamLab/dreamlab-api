import { boolean, index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from './organization.entity';

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
