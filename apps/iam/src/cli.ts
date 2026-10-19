import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadConfig, loadDotEnv } from '@lib/config';
import { runMigrations } from '@lib/database';
import { iamInfrastructure } from './app.module';
import { iamConfigSchema } from './config';
import { iamMigrationsFolder } from './database';
import { SigningKeysService } from './modules/keys/signing-keys.service';
import { SeedModule } from './modules/seed/seed.module';
import { SeedService } from './modules/seed/seed.service';

/** Operational commands: `migrate`, `seed`, `rotate-keys`. */
async function main(command: string | undefined): Promise<void> {
  loadDotEnv();
  const config = loadConfig(iamConfigSchema);
  const logger = new Logger('iam-cli');

  if (command === 'migrate') {
    if (!config.IAM_MIGRATION_DATABASE_URL) throw new Error('IAM_MIGRATION_DATABASE_URL is required');
    await runMigrations(config.IAM_MIGRATION_DATABASE_URL, iamMigrationsFolder());
    logger.log('Migrations applied');
    return;
  }

  @Module({ imports: [...iamInfrastructure(config), SeedModule], providers: [SigningKeysService] })
  class CliModule {}

  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['log', 'warn', 'error'] });
  try {
    if (command === 'seed') await app.get(SeedService).run();
    else if (command === 'rotate-keys') logger.log(`Active key is now ${await app.get(SigningKeysService).rotate()}`);
    else throw new Error(`Unknown command "${command ?? ''}". Use: migrate | seed | rotate-keys`);
  } finally {
    await app.close();
  }
}

main(process.argv[2]).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
