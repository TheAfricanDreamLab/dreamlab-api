import { AnyPgColumn, index, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';

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

/**
 * The `org_id` column of a tenant-owned table (cascades with the organisation). Defined here, not in
 * database/columns.ts, so that file never imports an entity and no import cycle can form.
 */
export const orgRef = () =>
  uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' });
