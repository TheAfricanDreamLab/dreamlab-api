import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  // One table per *.entity.ts in the feature modules, plus the outbox/inbox tables.
  schema: ['./apps/iam/src/modules/**/entities/*.entity.ts', './libs/messaging/src/schema.ts'],
  out: './apps/iam/src/database/migrations',
  dbCredentials: { url: process.env.IAM_MIGRATION_DATABASE_URL ?? 'postgres://iam_owner:iam_owner@localhost:5433/dreamlab_iam' },
  strict: true,
  verbose: true,
});
