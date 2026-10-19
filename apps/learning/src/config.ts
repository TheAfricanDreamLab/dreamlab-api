import { baseConfigSchema, booleanString } from '@lib/config';
import { z } from 'zod';

export const learningConfigSchema = baseConfigSchema.extend({
  SERVICE_NAME: z.string().default('learning'),
  LEARNING_PORT: z.coerce.number().int().positive().default(3003),

  /** App role: row-level security applies (a learner sees only their own records). */
  LEARNING_DATABASE_URL: z.string().url(),
  /** System role (BYPASSRLS): peers' discussion posts, poll results, platform statistics. */
  LEARNING_SYSTEM_DATABASE_URL: z.string().url(),
  LEARNING_MIGRATION_DATABASE_URL: z.string().url().optional(),
  LEARNING_MIGRATE_ON_BOOT: booleanString.default('false'),

  IAM_JWKS_URL: z.string().url(),
});

export type LearningConfig = z.infer<typeof learningConfigSchema>;

export const learningProductionSchema = learningConfigSchema.superRefine((c, ctx) => {
  if (c.NODE_ENV !== 'production') return;
  if (c.TRUST_PROXY === 'true') ctx.addIssue({ code: 'custom', path: ['TRUST_PROXY'], message: 'must name the gateway network, not true, in production' });
  if (!c.AUTH_ISSUER.startsWith('https://')) ctx.addIssue({ code: 'custom', path: ['AUTH_ISSUER'], message: 'must be an https URL in production' });
});
