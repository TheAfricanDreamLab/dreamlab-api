import {
  OidcCallbackRequestSchema,
  SamlAcceptedSchema,
  SamlAcsRequestSchema,
  SsoConnectionSchema,
  SsoDiscoverRequestSchema,
  SsoDiscoverySchema,
  SsoFinishRequestSchema,
  SsoSettingsSchema,
  SsoStartRequestSchema,
  SsoStartSchema,
  TokenResponseSchema,
  UpdateSsoConnectionSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class SsoDiscoverDto extends createZodDto(SsoDiscoverRequestSchema) {}
export class SsoDiscoveryDto extends createZodDto(SsoDiscoverySchema) {}
export class SsoStartRequestDto extends createZodDto(SsoStartRequestSchema) {}
export class SsoStartDto extends createZodDto(SsoStartSchema) {}
export class OidcCallbackDto extends createZodDto(OidcCallbackRequestSchema) {}
export class SamlAcsDto extends createZodDto(SamlAcsRequestSchema) {}
export class SamlAcceptedDto extends createZodDto(SamlAcceptedSchema) {}
export class SsoFinishDto extends createZodDto(SsoFinishRequestSchema) {}
/** SsoResultSchema is a discriminated union; Nest DTOs need one object, so every field is optional on the wire. */
export class SsoResultDto extends createZodDto(
  z.object({
    kind: z.enum(['session', 'test']),
    tokens: TokenResponseSchema.optional(),
    returnTo: z.string().nullable().optional(),
    orgId: UuidSchema.optional(),
    email: z.string().optional(),
    name: z.string().nullable().optional(),
  }),
) {}
export class SsoSettingsDto extends createZodDto(SsoSettingsSchema) {}
export class SsoConnectionDto extends createZodDto(SsoConnectionSchema) {}
export class UpdateSsoConnectionDto extends createZodDto(UpdateSsoConnectionSchema) {}
export class ConnectionParamsDto extends createZodDto(z.object({ connectionId: UuidSchema })) {}
