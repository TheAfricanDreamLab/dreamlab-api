import { baseConfigSchema, booleanString } from '@lib/config';
import { z } from 'zod';

export const iamConfigSchema = baseConfigSchema.extend({
  SERVICE_NAME: z.string().default('iam'),
  IAM_PORT: z.coerce.number().int().positive().default(3001),

  /** App role: row-level security applies. */
  IAM_DATABASE_URL: z.string().url(),
  /** System role (BYPASSRLS): auth flows and relays that are cross-tenant by nature. */
  IAM_SYSTEM_DATABASE_URL: z.string().url(),
  /** Owner role: migrations only. */
  IAM_MIGRATION_DATABASE_URL: z.string().url().optional(),
  IAM_MIGRATE_ON_BOOT: booleanString.default('false'),
  IAM_SEED_ON_BOOT: booleanString.default('false'),

  /** 32 random bytes, base64. Encrypts signing private keys at rest. */
  IAM_KEY_ENCRYPTION_SECRET: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'Must be 32 bytes, base64-encoded'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(3600).default(30 * 24 * 3600),
  SIGNING_KEY_MAX_AGE_DAYS: z.coerce.number().int().min(1).default(90),

  OTP_TTL_SECONDS: z.coerce.number().int().min(60).default(600),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(0).default(60),
  OTP_HOURLY_LIMIT: z.coerce.number().int().min(1).default(10),
  LOGIN_MAX_FAILURES: z.coerce.number().int().min(1).default(5),
  LOGIN_LOCKOUT_SECONDS: z.coerce.number().int().min(60).default(900),
  LOGIN_IP_LIMIT_PER_15M: z.coerce.number().int().min(1).default(100),
  INVITATION_TTL_HOURS: z.coerce.number().int().min(1).default(7 * 24),
  ARGON2_MEMORY_KIB: z.coerce.number().int().min(8192).default(19456),

  PLATFORM_ORG_SLUG: z.string().default('platform'),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(10).optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().default('Platform Admin'),
  /** Seed The African Dream Lab institution for local development. */
  SEED_DEMO_ORGS: booleanString.default('false'),

  /**
   * Email delivery. With no override, Resend is used when RESEND_API_KEY is set, otherwise
   * ZeptoMail when ZEPTOMAIL_TOKEN is set, otherwise codes are only logged (development).
   */
  EMAIL_PROVIDER: z.enum(['resend', 'zeptomail', 'console']).optional(),
  EMAIL_FROM: z.string().min(3).default('The African Dream Lab <no-reply@theafricandreamlab.com>'),
  RESEND_API_KEY: z.string().min(10).optional(),
  ZEPTOMAIL_TOKEN: z.string().min(10).optional(),
  ZEPTOMAIL_API_URL: z.string().url().default('https://api.zeptomail.com/v1.1/email'),
  /** Comma-separated Google OAuth client ids (web, Android, iOS) whose ID tokens are accepted. */
  GOOGLE_CLIENT_IDS: z
    .string()
    .optional()
    .transform((v) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean)),
  PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type IamConfig = z.infer<typeof iamConfigSchema>;

export function emailProvider(config: Pick<IamConfig, 'EMAIL_PROVIDER' | 'RESEND_API_KEY' | 'ZEPTOMAIL_TOKEN'>): 'resend' | 'zeptomail' | 'console' {
  if (config.EMAIL_PROVIDER) return config.EMAIL_PROVIDER;
  if (config.RESEND_API_KEY) return 'resend';
  if (config.ZEPTOMAIL_TOKEN) return 'zeptomail';
  return 'console';
}
