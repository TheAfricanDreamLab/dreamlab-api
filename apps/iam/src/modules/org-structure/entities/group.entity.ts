import { jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from '../../organizations/entities/organization.entity';

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
