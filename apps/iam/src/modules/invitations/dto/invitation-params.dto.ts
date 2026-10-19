import { UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class InvitationParamsDto extends createZodDto(z.object({ orgId: UuidSchema, invitationId: UuidSchema })) {}
