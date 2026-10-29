import { DatabaseService, Tx } from '@lib/database';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as schema from './schema';

export { schema };
export type AdmissionsSchema = typeof schema;
export type AdmissionsDatabase = DatabaseService<AdmissionsSchema>;
export type AdmissionsTx = Tx<AdmissionsSchema>;

/**
 * Migrations sit next to this file when running from source (ts-node, jest), and are copied
 * next to main.js (dist/apps/admissions/database/migrations) in the webpack build.
 */
export function admissionsMigrationsFolder(): string {
  const candidates = [join(__dirname, 'migrations'), join(__dirname, 'database', 'migrations')];
  const found = candidates.find((dir) => existsSync(join(dir, 'meta', '_journal.json')));
  if (!found) throw new Error(`Admissions migrations not found in: ${candidates.join(', ')}`);
  return found;
}
