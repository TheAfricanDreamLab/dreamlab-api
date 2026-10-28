import { DatabaseService, Tx } from '@lib/database';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from './schema';

export { schema };
export type NotifySchema = typeof schema;
export type NotifyDatabase = DatabaseService<NotifySchema>;
export type NotifyTx = Tx<NotifySchema>;

/**
 * Migrations sit next to this file when running from source (ts-node, jest), and are copied
 * next to main.js (dist/apps/notify/database/migrations) in the webpack build.
 */
export function notifyMigrationsFolder(): string {
  const candidates = [join(__dirname, 'migrations'), join(__dirname, 'database', 'migrations')];
  const found = candidates.find((dir) => existsSync(join(dir, 'meta', '_journal.json')));
  if (!found) throw new Error(`Notify migrations not found in: ${candidates.join(', ')}`);
  return found;
}
