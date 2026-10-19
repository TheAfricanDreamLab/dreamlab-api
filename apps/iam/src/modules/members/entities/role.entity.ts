import { boolean, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { organizations } from '../../organizations/entities/organization.entity';

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
