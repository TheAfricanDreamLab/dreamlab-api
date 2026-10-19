import { SignUpOrganizationSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class SignUpOrganizationDto extends createZodDto(SignUpOrganizationSchema) {}
