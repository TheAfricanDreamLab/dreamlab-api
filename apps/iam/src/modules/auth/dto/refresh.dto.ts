import { RefreshRequestSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class RefreshDto extends createZodDto(RefreshRequestSchema) {}
