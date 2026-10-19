import { baseConfigSchema, booleanString } from '@lib/config';
import { z } from 'zod';

const csv = z
  .string()
  .optional()
  .transform((v) => (v ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));

export const gatewayConfigSchema = baseConfigSchema.extend({
  SERVICE_NAME: z.string().default('gateway'),
  GATEWAY_PORT: z.coerce.number().int().positive().default(3000),
  IAM_URL: z.string().url(),
  IAM_JWKS_URL: z.string().url(),
  /** Hosts that mean "no tenant". `<slug>.<base>` resolves to that organisation. */
  GATEWAY_BASE_DOMAINS: csv,
  /** Lets the X-Tenant header choose the tenant. Development and testing only. */
  GATEWAY_ALLOW_TENANT_HEADER: booleanString.default('false'),
  GATEWAY_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(300),
  GATEWAY_UPSTREAM_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15_000),
  /** Allowed browser origins for CORS. Empty = same-origin only. */
  CORS_ORIGINS: csv,
});

export type GatewayConfig = z.infer<typeof gatewayConfigSchema>;
