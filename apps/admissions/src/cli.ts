import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { loadConfig, loadDotEnv } from '@lib/config';
import { runMigrations } from '@lib/database';
import { admissionsConfigSchema } from './config';
import { admissionsMigrationsFolder } from './database';

/** Operational commands: `migrate`. */
async function main(command: string | undefined): Promise<void> {
  loadDotEnv();
  const config = loadConfig(admissionsConfigSchema);
  if (command !== 'migrate') throw new Error(`Unknown command "${command ?? ''}". Use: migrate`);
  if (!config.ADMISSIONS_MIGRATION_DATABASE_URL) throw new Error('ADMISSIONS_MIGRATION_DATABASE_URL is required');
  await runMigrations(config.ADMISSIONS_MIGRATION_DATABASE_URL, admissionsMigrationsFolder());
  new Logger('admissions-cli').log('Migrations applied');
}

main(process.argv[2]).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
