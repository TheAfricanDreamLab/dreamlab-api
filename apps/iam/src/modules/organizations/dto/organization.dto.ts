import { OrganizationSchema, pageOf, PublicOrganizationSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class OrganizationDto extends createZodDto(OrganizationSchema) {}
export class PublicOrganizationDto extends createZodDto(PublicOrganizationSchema) {}
export class OrganizationPageDto extends createZodDto(pageOf(OrganizationSchema)) {}
