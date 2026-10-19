import type { invitations } from '../../modules/invitations/entities/invitation.entity';

type InvitationRow = typeof invitations.$inferSelect;

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
