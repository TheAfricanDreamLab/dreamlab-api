import { UpdateOrganizationSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateOrganizationDto extends createZodDto(UpdateOrganizationSchema) {}
