import { SwitchOrgRequestSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class SwitchOrgDto extends createZodDto(SwitchOrgRequestSchema) {}
