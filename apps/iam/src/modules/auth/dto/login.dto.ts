import { LoginRequestSchema, OtpLoginRequestSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class LoginDto extends createZodDto(LoginRequestSchema) {}
export class OtpLoginDto extends createZodDto(OtpLoginRequestSchema) {}
