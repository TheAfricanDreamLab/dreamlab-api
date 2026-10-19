import type { Membership, Organization, OrgKind } from '@dreamlab/contracts';
import { labelToId } from '@lib/database';
import type { schema } from '../../database';

type OrgRow = typeof schema.organizations.$inferSelect;
type MembershipRow = typeof schema.memberships.$inferSelect;
type UserRow = typeof schema.users.$inferSelect;
type UnitRow = typeof schema.orgUnits.$inferSelect;
type InvitationRow = typeof schema.invitations.$inferSelect;
type GroupRow = typeof schema.groups.$inferSelect;

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

export const toOrganization = (o: OrgRow): Organization => ({
  id: o.id,
  slug: o.slug,
  name: o.name,
  kinds: o.kinds as OrgKind[],
  parentOrgId: o.parentOrgId,
  status: o.status,
  branding: o.branding,
  terminology: o.terminology,
  dataRegion: o.dataRegion,
  createdAt: o.createdAt.toISOString(),
});

export const toPublicOrganization = (o: OrgRow) => ({
  id: o.id,
  slug: o.slug,
  name: o.name,
  kinds: o.kinds as OrgKind[],
  branding: o.branding,
  terminology: o.terminology,
});

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

export const toUnit = (u: UnitRow) => ({
  id: u.id,
  orgId: u.orgId,
  parentUnitId: u.parentUnitId,
  name: u.name,
  path: u.path.split('.').map(labelToId),
  createdAt: u.createdAt.toISOString(),
});

export const toInvitation = (i: InvitationRow) => ({
  id: i.id,
  orgId: i.orgId,
  email: i.email,
  phone: i.phone,
  roleKeys: i.roleKeys,
  orgUnitId: i.orgUnitId,
  jobTitle: i.jobTitle,
  status: i.status === 'pending' && i.expiresAt.getTime() < Date.now() ? ('expired' as const) : i.status,
  expiresAt: i.expiresAt.toISOString(),
  createdAt: i.createdAt.toISOString(),
});

export const toGroup = (g: GroupRow, memberCount: number) => ({
  id: g.id,
  orgId: g.orgId,
  name: g.name,
  kind: g.kind,
  memberCount,
  createdAt: g.createdAt.toISOString(),
});

/** Cursor pagination over UUIDv7 ids (time-ordered). */
export function pageResult<T extends { id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  return { items, nextCursor: rows.length > limit ? items[items.length - 1]!.id : null };
}
