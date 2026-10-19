/**
 * Every IAM table, gathered from the feature modules' entities (one table per file) plus the
 * outbox/inbox tables from @lib/messaging. Imported as the `schema` namespace in ./index.ts.
 */
export * from '../modules/users/entities/user.entity';
export * from '../modules/users/entities/user-identity.entity';
export * from '../modules/auth/entities/session.entity';
export * from '../modules/auth/entities/consent-record.entity';
export * from '../modules/keys/entities/signing-key.entity';
// Named, so the orgRef column helper does not become part of the schema.
export { organizations } from '../modules/organizations/entities/organization.entity';
export * from '../modules/organizations/entities/org-profiles.entity';
export * from '../modules/organizations/entities/org-domain.entity';
export * from '../modules/organizations/entities/sso-connection.entity';
export * from '../modules/organizations/entities/scim-directory.entity';
export * from '../modules/org-structure/entities/org-unit.entity';
export * from '../modules/org-structure/entities/group.entity';
export * from '../modules/members/entities/membership.entity';
export * from '../modules/org-structure/entities/group-member.entity';
export * from '../modules/invitations/entities/invitation.entity';
export * from '../modules/members/entities/role.entity';
export * from '../modules/members/entities/role-assignment.entity';
export { inbox, outbox } from '@lib/messaging';
