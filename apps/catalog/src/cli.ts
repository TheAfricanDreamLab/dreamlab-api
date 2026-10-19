import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig, loadDotEnv } from '@lib/config';
import { runMigrations } from '@lib/database';
import { catalogInfrastructure } from './app.module';
import { catalogConfigSchema } from './config';
import { catalogMigrationsFolder } from './database';
import { CatalogSeedService } from './modules/seed/catalog-seed.service';
import { DATASETS } from './modules/seed/datasets';
import { SeedModule } from './modules/seed/seed.module';

/** Operational commands: `migrate`, `seed <dataset>`. */
async function main(command: string | undefined, arg: string | undefined): Promise<void> {
  loadDotEnv();
  const config = loadConfig(catalogConfigSchema);
  const logger = new Logger('catalog-cli');

  if (command === 'migrate') {
    if (!config.CATALOG_MIGRATION_DATABASE_URL) throw new Error('CATALOG_MIGRATION_DATABASE_URL is required');
    await runMigrations(config.CATALOG_MIGRATION_DATABASE_URL, catalogMigrationsFolder());
    logger.log('Migrations applied');
    return;
  }
  if (command !== 'seed') throw new Error(`Unknown command "${command ?? ''}". Use: migrate | seed <${Object.keys(DATASETS).join('|')}>`);
  const dataset = DATASETS[(arg ?? config.CATALOG_SEED ?? '') as keyof typeof DATASETS];
  if (!dataset) throw new Error(`Unknown dataset "${arg ?? ''}". Use: ${Object.keys(DATASETS).join(', ')}`);

  @Module({ imports: [...catalogInfrastructure(config), SeedModule] })
  class CliModule {}

  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['log', 'warn', 'error'] });
  try {
    await app.get(CatalogSeedService).run(dataset, config.CATALOG_SEED_OWNER_SLUG);
  } finally {
    await app.close();
  }
}

main(process.argv[2], process.argv[3]).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
