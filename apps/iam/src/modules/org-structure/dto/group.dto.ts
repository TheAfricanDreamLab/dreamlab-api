import { AddGroupMembersSchema, CreateGroupSchema, GroupSchema, UpdateGroupSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class GroupDto extends createZodDto(GroupSchema) {}
export class GroupListDto extends createZodDto(z.object({ items: z.array(GroupSchema) })) {}
export class CreateGroupDto extends createZodDto(CreateGroupSchema) {}
export class UpdateGroupDto extends createZodDto(UpdateGroupSchema) {}
export class AddGroupMembersDto extends createZodDto(AddGroupMembersSchema) {}
export class GroupParamsDto extends createZodDto(z.object({ orgId: UuidSchema, groupId: UuidSchema })) {}
export class GroupMemberParamsDto extends createZodDto(
  z.object({ orgId: UuidSchema, groupId: UuidSchema, membershipId: UuidSchema }),
) {}
