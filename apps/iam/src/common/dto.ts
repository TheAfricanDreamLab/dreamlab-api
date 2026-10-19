/**
 * Nest DTO classes generated from the shared contracts, so validation, OpenAPI and the
 * client types all come from one definition in @dreamlab/contracts.
 */
import * as c from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// auth
export class RegisterDto extends createZodDto(c.RegisterRequestSchema) {}
export class RegisterResponseDto extends createZodDto(c.RegisterResponseSchema) {}
export class OtpRequestDto extends createZodDto(c.OtpRequestSchema) {}
export class OtpAcceptedDto extends createZodDto(c.OtpAcceptedSchema) {}
export class VerifyDto extends createZodDto(c.VerifyRequestSchema) {}
export class LoginDto extends createZodDto(c.LoginRequestSchema) {}
export class GoogleSignInDto extends createZodDto(c.GoogleSignInRequestSchema) {}
export class OtpLoginDto extends createZodDto(c.OtpLoginRequestSchema) {}
export class RefreshDto extends createZodDto(c.RefreshRequestSchema) {}
export class PasswordResetDto extends createZodDto(c.PasswordResetRequestSchema) {}
export class PasswordChangeDto extends createZodDto(c.PasswordChangeRequestSchema) {}
export class SwitchOrgDto extends createZodDto(c.SwitchOrgRequestSchema) {}
export class TokenResponseDto extends createZodDto(c.TokenResponseSchema) {}
export class SessionListDto extends createZodDto(c.SessionListSchema) {}
export class JwksDto extends createZodDto(c.JwksSchema) {}
export class EmptyBodyDto extends createZodDto(c.NoBodySchema) {}

// directory
export class MeDto extends createZodDto(c.MeSchema) {}
export class OrganizationDto extends createZodDto(c.OrganizationSchema) {}
export class PublicOrganizationDto extends createZodDto(c.PublicOrganizationSchema) {}
export class CreateOrganizationDto extends createZodDto(c.CreateOrganizationSchema) {}
export class UpdateOrganizationDto extends createZodDto(c.UpdateOrganizationSchema) {}
export class OrganizationPageDto extends createZodDto(c.pageOf(c.OrganizationSchema)) {}
export class OrgListQueryDto extends createZodDto(
  c.PageQuerySchema.extend({ q: z.string().max(120).optional(), kind: c.OrgKindSchema.optional() }),
) {}
export class MembershipDto extends createZodDto(c.MembershipSchema) {}
export class MembershipPageDto extends createZodDto(c.pageOf(c.MembershipSchema)) {}
export class MemberListQueryDto extends createZodDto(c.MemberListQuerySchema) {}
export class UpdateMembershipDto extends createZodDto(c.UpdateMembershipSchema) {}
export class AssignRoleDto extends createZodDto(c.AssignRoleSchema) {}
export class RoleAssignmentDto extends createZodDto(c.RoleAssignmentSchema) {}
export class RoleListDto extends createZodDto(z.object({ items: z.array(c.RoleSchema) })) {}
export class InvitationDto extends createZodDto(c.InvitationSchema) {}
export class InvitationPageDto extends createZodDto(c.pageOf(c.InvitationSchema)) {}
export class InvitationListQueryDto extends createZodDto(c.PageQuerySchema.extend({ status: c.InvitationStatusSchema.optional() })) {}
export class CreateInvitationDto extends createZodDto(c.CreateInvitationSchema) {}
export class AcceptInvitationDto extends createZodDto(c.AcceptInvitationSchema) {}
export class OrgUnitDto extends createZodDto(c.OrgUnitSchema) {}
export class OrgUnitListDto extends createZodDto(z.object({ items: z.array(c.OrgUnitSchema) })) {}
export class CreateOrgUnitDto extends createZodDto(c.CreateOrgUnitSchema) {}
export class UpdateOrgUnitDto extends createZodDto(c.UpdateOrgUnitSchema) {}
export class GroupDto extends createZodDto(c.GroupSchema) {}
export class GroupListDto extends createZodDto(z.object({ items: z.array(c.GroupSchema) })) {}
export class CreateGroupDto extends createZodDto(c.CreateGroupSchema) {}
export class UpdateGroupDto extends createZodDto(c.UpdateGroupSchema) {}
export class AddGroupMembersDto extends createZodDto(c.AddGroupMembersSchema) {}
export class PageQueryDto extends createZodDto(c.PageQuerySchema) {}

// path params
export class OrgParamsDto extends createZodDto(z.object({ orgId: c.UuidSchema })) {}
export class SlugParamsDto extends createZodDto(z.object({ slug: c.SlugSchema })) {}
export class SessionParamsDto extends createZodDto(z.object({ sessionId: c.UuidSchema })) {}
export class MemberParamsDto extends createZodDto(z.object({ orgId: c.UuidSchema, membershipId: c.UuidSchema })) {}
export class AssignmentParamsDto extends createZodDto(z.object({ orgId: c.UuidSchema, assignmentId: c.UuidSchema })) {}
export class InvitationParamsDto extends createZodDto(z.object({ orgId: c.UuidSchema, invitationId: c.UuidSchema })) {}
export class UnitParamsDto extends createZodDto(z.object({ orgId: c.UuidSchema, unitId: c.UuidSchema })) {}
export class GroupParamsDto extends createZodDto(z.object({ orgId: c.UuidSchema, groupId: c.UuidSchema })) {}
export class GroupMemberParamsDto extends createZodDto(
  z.object({ orgId: c.UuidSchema, groupId: c.UuidSchema, membershipId: c.UuidSchema }),
) {}
