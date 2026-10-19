import { InvitationSchema, pageOf } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class InvitationDto extends createZodDto(InvitationSchema) {}
export class InvitationPageDto extends createZodDto(pageOf(InvitationSchema)) {}
