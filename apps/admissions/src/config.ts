import { baseConfigSchema, booleanString } from '@lib/config';
import { z } from 'zod';

export const admissionsConfigSchema = baseConfigSchema.extend({
  SERVICE_NAME: z.string().default('admissions'),
  ADMISSIONS_PORT: z.coerce.number().int().positive().default(3005),

  /** App role: row-level security applies (an organisation's applications, an applicant's own). */
  ADMISSIONS_DATABASE_URL: z.string().url(),
  /** System role: the outbox relay and reads across organisations (open cycles). */
  ADMISSIONS_SYSTEM_DATABASE_URL: z.string().url(),
  /** Owner role: migrations only. */
  ADMISSIONS_MIGRATION_DATABASE_URL: z.string().url().optional(),
  ADMISSIONS_MIGRATE_ON_BOOT: booleanString.default('false'),

  IAM_JWKS_URL: z.string().url(),

  /** AI-assisted evaluations (ADM-1). Unset: the feature answers 503 and reviews stay human-only. */
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ADMISSIONS_AI_MODEL: z.string().min(1).default('claude-opus-5-5'),
  /** Evaluations kept per application, so repeated requests cannot run up the bill. */
  ADMISSIONS_AI_MAX_PER_APPLICATION: z.coerce.number().int().min(1).max(20).default(3),
});

export type AdmissionsConfig = z.infer<typeof admissionsConfigSchema>;

export const admissionsProductionSchema = admissionsConfigSchema.superRefine((c, ctx) => {
  if (c.NODE_ENV !== 'production') return;
  if (c.TRUST_PROXY === 'true') ctx.addIssue({ code: 'custom', path: ['TRUST_PROXY'], message: 'must name the gateway network, not true, in production' });
  if (!c.AUTH_ISSUER.startsWith('https://')) ctx.addIssue({ code: 'custom', path: ['AUTH_ISSUER'], message: 'must be an https URL in production' });
});
