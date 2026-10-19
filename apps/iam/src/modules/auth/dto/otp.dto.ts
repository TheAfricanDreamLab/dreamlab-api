import { OtpAcceptedSchema, OtpRequestSchema, VerifyRequestSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class OtpRequestDto extends createZodDto(OtpRequestSchema) {}
export class OtpAcceptedDto extends createZodDto(OtpAcceptedSchema) {}
export class VerifyDto extends createZodDto(VerifyRequestSchema) {}
