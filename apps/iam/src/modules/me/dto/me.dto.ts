import { MeSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class MeDto extends createZodDto(MeSchema) {}
