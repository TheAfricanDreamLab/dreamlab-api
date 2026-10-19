import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./apps/catalog/src/modules/**/entities/*.entity.ts', './libs/messaging/src/schema.ts'],
  out: './apps/catalog/src/database/migrations',
  dbCredentials: { url: process.env.CATALOG_MIGRATION_DATABASE_URL ?? 'postgres://catalog_owner:catalog_owner@localhost:5433/dreamlab_catalog' },
  strict: true,
  verbose: true,
});
