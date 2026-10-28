import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./apps/notify/src/modules/**/entities/*.entity.ts'],
  out: './apps/notify/src/database/migrations',
  dbCredentials: { url: process.env.NOTIFY_MIGRATION_DATABASE_URL ?? 'postgres://notify_owner:notify_owner@localhost:5433/dreamlab_notify' },
  strict: true,
  verbose: true,
});
