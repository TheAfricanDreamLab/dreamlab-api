import {
  MfaChallengeSchema,
  MfaCodeRequestSchema,
  MfaStatusSchema,
  MfaVerifyRequestSchema,
  RecoveryCodesSchema,
  TokenResponseSchema,
  TotpConfirmRequestSchema,
  TotpSetupSchema,
} from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

/**
 * SignInResponseSchema is a union (tokens, or an MFA challenge). Nest DTOs need one object, so the
 * wire schema merges both with every field optional; the contract keeps the precise union.
 */
export class SignInResponseDto extends createZodDto(TokenResponseSchema.partial().merge(MfaChallengeSchema.partial())) {}
export class MfaVerifyDto extends createZodDto(MfaVerifyRequestSchema) {}
export class MfaStatusDto extends createZodDto(MfaStatusSchema) {}
export class TotpSetupDto extends createZodDto(TotpSetupSchema) {}
export class TotpConfirmDto extends createZodDto(TotpConfirmRequestSchema) {}
export class RecoveryCodesDto extends createZodDto(RecoveryCodesSchema) {}
export class MfaCodeDto extends createZodDto(MfaCodeRequestSchema) {}
