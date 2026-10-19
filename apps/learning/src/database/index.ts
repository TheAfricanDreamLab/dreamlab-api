import { DatabaseService, Tx } from '@lib/database';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from './schema';

export { schema };
export type LearningSchema = typeof schema;
export type LearningDatabase = DatabaseService<LearningSchema>;
export type LearningTx = Tx<LearningSchema>;

/**
 * Migrations sit next to this file when running from source (ts-node, jest), and are copied
 * next to main.js (dist/apps/learning/database/migrations) in the webpack build.
 */
export function learningMigrationsFolder(): string {
  const candidates = [join(__dirname, 'migrations'), join(__dirname, 'database', 'migrations')];
  const found = candidates.find((dir) => existsSync(join(dir, 'meta', '_journal.json')));
  if (!found) throw new Error(`Learning migrations not found in: ${candidates.join(', ')}`);
  return found;
}
