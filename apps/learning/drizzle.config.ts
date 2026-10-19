import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./apps/learning/src/modules/**/entities/*.entity.ts', './libs/messaging/src/schema.ts'],
  out: './apps/learning/src/database/migrations',
  dbCredentials: { url: process.env.LEARNING_MIGRATION_DATABASE_URL ?? 'postgres://learning_owner:learning_owner@localhost:5433/dreamlab_learning' },
  strict: true,
  verbose: true,
});
