import { OrgKindSchema, OrgStatusSchema, PageQuerySchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class OrgListQueryDto extends createZodDto(
  PageQuerySchema.extend({ q: z.string().max(120).optional(), kind: OrgKindSchema.optional(), status: OrgStatusSchema.optional() }),
) {}
