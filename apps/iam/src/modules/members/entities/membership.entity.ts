import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { orgUnits } from '../../org-structure/entities/org-unit.entity';
import { orgRef } from '../../organizations/entities/organization.entity';
import { users } from '../../users/entities/user.entity';

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    orgUnitId: uuid('org_unit_id').references(() => orgUnits.id, { onDelete: 'set null' }),
    /** requested: asked to join through a verified email domain, waiting for an admin. */
    status: text('status', { enum: ['invited', 'requested', 'active', 'suspended', 'left'] }).notNull(),
    source: text('source', { enum: ['invite', 'self', 'domain', 'scim', 'import', 'bootstrap'] }).notNull(),
    /** The identity provider's id for this person (SCIM externalId). */
    externalId: text('external_id'),
    jobTitle: text('job_title'),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('memberships_user_org_key').on(t.userId, t.orgId),
    index('memberships_org_status_idx').on(t.orgId, t.status),
    index('memberships_unit_idx').on(t.orgUnitId),
    uniqueIndex('memberships_org_external_key').on(t.orgId, t.externalId).where(sql`external_id is not null`),
  ],
);
