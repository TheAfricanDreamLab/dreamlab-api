import { baseConfigSchema, booleanString } from '@lib/config';
import { storageConfigShape } from '@lib/storage';
import { z } from 'zod';

export const catalogConfigSchema = baseConfigSchema.extend({
  SERVICE_NAME: z.string().default('catalog'),
  CATALOG_PORT: z.coerce.number().int().positive().default(3002),

  /** App role: row-level security applies (authoring, per owner organisation). */
  CATALOG_DATABASE_URL: z.string().url(),
  /** System role (BYPASSRLS): the public catalog and content for enrolled learners. */
  CATALOG_SYSTEM_DATABASE_URL: z.string().url(),
  /** Owner role: migrations only. */
  CATALOG_MIGRATION_DATABASE_URL: z.string().url().optional(),
  CATALOG_MIGRATE_ON_BOOT: booleanString.default('false'),

  /**
   * Seed content to load on boot. `dream-lab-test`: the Dream Lab programme with the full Problem
   * Solving course (staging and development). Empty: nothing (production, where the real courses
   * are provisioned separately).
   */
  CATALOG_SEED: z.enum(['dream-lab-test']).optional(),
  /** Organisation that owns seeded content, resolved through IAM. */
  CATALOG_SEED_OWNER_SLUG: z.string().default('platform'),

  IAM_JWKS_URL: z.string().url(),
  /** Course images and videos uploaded in the browser (MEDIA-1). */
  ...storageConfigShape,

  /**
   * What this process does (CAT-6): `api` serves requests; `video-worker` only processes videos and
   * makes captions (its own container, so a long conversion never slows the API); `all` does both
   * (development). Unset: `all` in development, `api` otherwise.
   */
  CATALOG_ROLE: z.enum(['api', 'video-worker', 'all']).optional(),
  /** Scratch space for one job at a time; needs room for the original plus its conversions. */
  VIDEO_WORK_DIR: z.string().optional(),
  FFMPEG_PATH: z.string().default('ffmpeg'),
  FFPROBE_PATH: z.string().default('ffprobe'),
  /** whisper.cpp's command-line program and model, for automatic captions. */
  WHISPER_PATH: z.string().default('whisper-cli'),
  WHISPER_MODEL: z.string().default('/opt/whisper/ggml-base.bin'),
  /** CPU threads a conversion or transcription may use. */
  VIDEO_THREADS: z.coerce.number().int().min(1).max(16).default(2),
  /** How often an idle worker looks for work, in milliseconds. */
  VIDEO_POLL_MS: z.coerce.number().int().min(200).default(5000),
});

export type CatalogConfig = z.infer<typeof catalogConfigSchema>;

export const catalogProductionSchema = catalogConfigSchema.superRefine((c, ctx) => {
  if (c.NODE_ENV !== 'production') return;
  if (c.TRUST_PROXY === 'true') ctx.addIssue({ code: 'custom', path: ['TRUST_PROXY'], message: 'must name the gateway network, not true, in production' });
  if (!c.AUTH_ISSUER.startsWith('https://')) ctx.addIssue({ code: 'custom', path: ['AUTH_ISSUER'], message: 'must be an https URL in production' });
});
