import { PasswordChangeRequestSchema, PasswordResetRequestSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class PasswordResetDto extends createZodDto(PasswordResetRequestSchema) {}
export class PasswordChangeDto extends createZodDto(PasswordChangeRequestSchema) {}
