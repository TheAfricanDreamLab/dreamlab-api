import { InvitationStatusSchema, PageQuerySchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class InvitationListQueryDto extends createZodDto(PageQuerySchema.extend({ status: InvitationStatusSchema.optional() })) {}
