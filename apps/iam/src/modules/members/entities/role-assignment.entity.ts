import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { orgRef } from '../../organizations/entities/organization.entity';
import { users } from '../../users/entities/user.entity';
import { memberships } from './membership.entity';
import { roles } from './role.entity';

export const roleAssignments = pgTable(
  'role_assignments',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    scopeType: text('scope_type', {
      enum: ['org', 'org_unit', 'group', 'program', 'cohort', 'course', 'course_run'],
    }).notNull(),
    scopeId: uuid('scope_id'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    grantedByUserId: uuid('granted_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('role_assignments_unique').on(t.membershipId, t.roleId, t.scopeType, t.scopeId).nullsNotDistinct(),
    index('role_assignments_org_idx').on(t.orgId),
  ],
);
