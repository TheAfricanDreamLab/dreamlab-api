import { ltree } from '@lib/database';
import { AnyPgColumn, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgRef } from '../../organizations/entities/organization.entity';

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
