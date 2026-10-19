import { RegisterRequestSchema, RegisterResponseSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterRequestSchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}
