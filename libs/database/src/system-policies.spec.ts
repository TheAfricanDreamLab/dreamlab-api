import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * Every table with row-level security needs a policy for its service's system role: on Azure the
 * system role is not the table owner (it cannot be granted BYPASSRLS there), so without the policy
 * the system connection would see no rows of a new table. This test fails until the migration adds it.
 */
const services = ['iam', 'catalog', 'learning', 'notify', 'admissions'];

describe.each(services.filter((svc) => readdirSync(join(__dirname, '../../../apps')).includes(svc)))('%s migrations', (svc) => {
  it('give the system role a policy on every RLS table', () => {
    const dir = join(__dirname, `../../../apps/${svc}/src/database/migrations`);
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');
    const rls = new Set([...sql.matchAll(/ALTER TABLE "([a-z_]+)" ENABLE ROW LEVEL SECURITY/g)].map((m) => m[1]));
    const covered = new Set([...sql.matchAll(new RegExp(`CREATE POLICY "[a-z_]+" ON "([a-z_]+)" TO ${svc}_system`, 'g'))].map((m) => m[1]));
    expect([...rls].filter((t) => !covered.has(t))).toEqual([]);
  });
});
