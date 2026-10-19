import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { memberships } from '../../members/entities/membership.entity';
import { orgRef } from '../../organizations/entities/organization.entity';
import { groups } from './group.entity';

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    orgId: orgRef(),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.membershipId] }), index('group_members_membership_idx').on(t.membershipId)],
);
