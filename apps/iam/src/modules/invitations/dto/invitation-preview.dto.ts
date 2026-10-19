import { InvitationPreviewSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class InvitationPreviewDto extends createZodDto(InvitationPreviewSchema) {}
