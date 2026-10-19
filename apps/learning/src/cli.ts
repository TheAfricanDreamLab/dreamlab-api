import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { loadConfig, loadDotEnv } from '@lib/config';
import { runMigrations } from '@lib/database';
import { learningConfigSchema } from './config';
import { learningMigrationsFolder } from './database';

/** Operational commands: `migrate`. */
async function main(command: string | undefined): Promise<void> {
  loadDotEnv();
  const config = loadConfig(learningConfigSchema);
  if (command !== 'migrate') throw new Error(`Unknown command "${command ?? ''}". Use: migrate`);
  if (!config.LEARNING_MIGRATION_DATABASE_URL) throw new Error('LEARNING_MIGRATION_DATABASE_URL is required');
  await runMigrations(config.LEARNING_MIGRATION_DATABASE_URL, learningMigrationsFolder());
  new Logger('learning-cli').log('Migrations applied');
}

main(process.argv[2]).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
