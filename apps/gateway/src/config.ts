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
  /** Courses and programmes (/v1/catalog/*). */
  CATALOG_URL: z.string().url(),
  /** Enrolments and the course player (/v1/learning/*). */
  LEARNING_URL: z.string().url(),
  /** In-app notifications and email preferences (/v1/notifications/*). */
  NOTIFY_URL: z.string().url(),
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

/** Settings that are fine in development but dangerous in production. */
export const gatewayProductionSchema = gatewayConfigSchema.superRefine((c, ctx) => {
  if (c.NODE_ENV !== 'production') return;
  if (c.GATEWAY_ALLOW_TENANT_HEADER) ctx.addIssue({ code: 'custom', path: ['GATEWAY_ALLOW_TENANT_HEADER'], message: 'must be false in production' });
  if (c.TRUST_PROXY === 'true') ctx.addIssue({ code: 'custom', path: ['TRUST_PROXY'], message: 'must name the proxies (hops or CIDRs), not true, in production' });
  if (c.CORS_ORIGINS.some((o) => o.startsWith('http://'))) ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'only https origins in production' });
});
