import { NoBodySchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class EmptyBodyDto extends createZodDto(NoBodySchema) {}
