import { DatabaseService, Tx } from '@lib/database';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from './schema';

export { schema };
export type CatalogSchema = typeof schema;
export type CatalogDatabase = DatabaseService<CatalogSchema>;
export type CatalogTx = Tx<CatalogSchema>;

/**
 * Migrations sit next to this file when running from source (ts-node, jest), and are copied
 * next to main.js (dist/apps/catalog/database/migrations) in the webpack build.
 */
export function catalogMigrationsFolder(): string {
  const candidates = [join(__dirname, 'migrations'), join(__dirname, 'database', 'migrations')];
  const found = candidates.find((dir) => existsSync(join(dir, 'meta', '_journal.json')));
  if (!found) throw new Error(`Catalog migrations not found in: ${candidates.join(', ')}`);
  return found;
}
