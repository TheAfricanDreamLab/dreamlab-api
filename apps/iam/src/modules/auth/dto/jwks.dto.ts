import { JwksSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class JwksDto extends createZodDto(JwksSchema) {}
