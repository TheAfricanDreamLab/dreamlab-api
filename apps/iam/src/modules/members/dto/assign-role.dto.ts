import { AssignRoleSchema, RoleAssignmentSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class AssignRoleDto extends createZodDto(AssignRoleSchema) {}
export class RoleAssignmentDto extends createZodDto(RoleAssignmentSchema) {}
