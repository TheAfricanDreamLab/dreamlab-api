import type { Membership } from '@dreamlab/contracts';
import type { memberships } from '../../modules/members/entities/membership.entity';
import type { users } from '../../modules/users/entities/user.entity';

type MembershipRow = typeof memberships.$inferSelect;
type UserRow = typeof users.$inferSelect;

export interface AssignmentView {
  id: string;
  membershipId: string;
  roleKey: string;
  scopeType: string;
  scopeId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
}

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export const toAssignment = (a: AssignmentView) => ({
  id: a.id,
  membershipId: a.membershipId,
  roleKey: a.roleKey,
  scopeType: a.scopeType as Membership['roles'][number]['scopeType'],
  scopeId: a.scopeId,
  startsAt: iso(a.startsAt),
  endsAt: iso(a.endsAt),
  createdAt: a.createdAt.toISOString(),
});

export const toMembership = (m: MembershipRow, user: Pick<UserRow, 'id' | 'fullName' | 'email' | 'phone'>, roles: AssignmentView[]): Membership => ({
  id: m.id,
  orgId: m.orgId,
  userId: m.userId,
  orgUnitId: m.orgUnitId,
  status: m.status,
  source: m.source,
  externalId: m.externalId,
  jobTitle: m.jobTitle,
  user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
  roles: roles.map(toAssignment),
  joinedAt: iso(m.joinedAt),
  createdAt: m.createdAt.toISOString(),
});
