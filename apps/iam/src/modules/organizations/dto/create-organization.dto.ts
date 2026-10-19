import { CreateOrganizationSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class CreateOrganizationDto extends createZodDto(CreateOrganizationSchema) {}
