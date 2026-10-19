/** Event types IAM publishes on the `dreamlab.events` exchange (also the routing keys). */
export const IamEvents = {
  UserRegistered: 'user.registered',
  UserVerified: 'user.verified',
  UserPasswordChanged: 'user.password_changed',
  UserLockedOut: 'user.locked_out',
  SessionCreated: 'session.created',
  SessionRevoked: 'session.revoked',
  OrgCreated: 'org.created',
  OrgUpdated: 'org.updated',
  MemberInvited: 'member.invited',
  MemberJoined: 'member.joined',
  MemberUpdated: 'member.updated',
  MemberRemoved: 'member.removed',
  RoleGranted: 'role.granted',
  RoleRevoked: 'role.revoked',
  UnitChanged: 'org_unit.changed',
  GroupChanged: 'group.changed',
} as const;
