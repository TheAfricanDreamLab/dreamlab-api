import { RoleSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class RoleListDto extends createZodDto(z.object({ items: z.array(RoleSchema) })) {}
