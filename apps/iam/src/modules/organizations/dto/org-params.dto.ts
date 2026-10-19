import { SlugSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class OrgParamsDto extends createZodDto(z.object({ orgId: UuidSchema })) {}
export class SlugParamsDto extends createZodDto(z.object({ slug: SlugSchema })) {}
