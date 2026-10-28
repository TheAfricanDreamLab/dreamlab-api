import { baseConfigSchema, booleanString } from '@lib/config';
import { emailConfigShape } from '@lib/email';
import { z } from 'zod';

export const notifyConfigSchema = baseConfigSchema.extend({
  SERVICE_NAME: z.string().default('notify'),
  NOTIFY_PORT: z.coerce.number().int().positive().default(3004),

  /** App role: row-level security applies (a person's own notifications). */
  NOTIFY_DATABASE_URL: z.string().url(),
  /** System role: delivering notifications to many people at once. */
  NOTIFY_SYSTEM_DATABASE_URL: z.string().url(),
  /** Owner role: migrations only. */
  NOTIFY_MIGRATION_DATABASE_URL: z.string().url().optional(),
  NOTIFY_MIGRATE_ON_BOOT: booleanString.default('false'),

  IAM_JWKS_URL: z.string().url(),
  /** Where emailed links point: the web app's public address. */
  PUBLIC_APP_URL: z.string().url().default('http://localhost:3100'),
  ...emailConfigShape,
});

export type NotifyConfig = z.infer<typeof notifyConfigSchema>;

export const notifyProductionSchema = notifyConfigSchema.superRefine((c, ctx) => {
  if (c.NODE_ENV !== 'production') return;
  if (c.TRUST_PROXY === 'true') ctx.addIssue({ code: 'custom', path: ['TRUST_PROXY'], message: 'must name the gateway network, not true, in production' });
  if (!c.AUTH_ISSUER.startsWith('https://')) ctx.addIssue({ code: 'custom', path: ['AUTH_ISSUER'], message: 'must be an https URL in production' });
  if (!c.PUBLIC_APP_URL.startsWith('https://')) ctx.addIssue({ code: 'custom', path: ['PUBLIC_APP_URL'], message: 'must be an https URL in production' });
});
