import { PageQuerySchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class PageQueryDto extends createZodDto(PageQuerySchema) {}
