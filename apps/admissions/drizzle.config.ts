import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./apps/admissions/src/modules/**/entities/*.entity.ts', './libs/messaging/src/schema.ts'],
  out: './apps/admissions/src/database/migrations',
  dbCredentials: { url: process.env.ADMISSIONS_MIGRATION_DATABASE_URL ?? 'postgres://admissions_owner:admissions_owner@localhost:5433/dreamlab_admissions' },
  strict: true,
  verbose: true,
});
