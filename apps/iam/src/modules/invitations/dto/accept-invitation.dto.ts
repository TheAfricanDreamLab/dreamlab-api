import { AcceptInvitationSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class AcceptInvitationDto extends createZodDto(AcceptInvitationSchema) {}
