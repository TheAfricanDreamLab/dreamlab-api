import { UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class MemberParamsDto extends createZodDto(z.object({ orgId: UuidSchema, membershipId: UuidSchema })) {}
export class AssignmentParamsDto extends createZodDto(z.object({ orgId: UuidSchema, assignmentId: UuidSchema })) {}
