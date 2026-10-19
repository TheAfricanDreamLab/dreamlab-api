import { citext } from '@lib/database';
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '../../../database/columns';
import { memberships } from '../../members/entities/membership.entity';
import { orgUnits } from '../../org-structure/entities/org-unit.entity';
import { orgRef } from '../../organizations/entities/organization.entity';
import { users } from '../../users/entities/user.entity';

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey(),
    orgId: orgRef(),
    email: citext('email'),
    phone: text('phone'),
    roleKeys: text('role_keys').array().notNull(),
    orgUnitId: uuid('org_unit_id').references(() => orgUnits.id, { onDelete: 'set null' }),
    jobTitle: text('job_title'),
    tokenHash: text('token_hash').notNull(),
    status: text('status', { enum: ['pending', 'accepted', 'revoked', 'expired'] }).notNull().default('pending'),
    invitedByUserId: uuid('invited_by_user_id').references(() => users.id),
    acceptedMembershipId: uuid('accepted_membership_id').references(() => memberships.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('invitations_token_hash_key').on(t.tokenHash), index('invitations_org_status_idx').on(t.orgId, t.status)],
);
