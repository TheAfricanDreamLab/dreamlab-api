import { CreateInvitationSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateInvitationDto extends createZodDto(CreateInvitationSchema) {}
