import { Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Db<S extends Record<string, unknown>> = NodePgDatabase<S>;
export type Tx<S extends Record<string, unknown>> = Parameters<Parameters<Db<S>['transaction']>[0]>[0];

export interface TenantContext {
  orgId: string;
  userId?: string | null;
}

export interface DatabaseOptions<S extends Record<string, unknown>> {
  schema: S;
  /** Connection as the service's application role. Row-level security applies. */
  appUrl: string;
  /** Connection as the service's system role (BYPASSRLS), for cross-tenant work only. */
  systemUrl: string;
  poolSize?: number;
}

/**
 * Two pools per service:
 *  - `tenant(...)` runs on the RLS-enforced app role with `app.org_id` set for the transaction.
 *  - `system(...)` runs on the BYPASSRLS role and must be used deliberately (auth flows, relays).
 */
export class DatabaseService<S extends Record<string, unknown>> {
  private readonly logger = new Logger('Database');
  readonly appPool: Pool;
  readonly systemPool: Pool;
  readonly app: Db<S>;
  readonly sys: Db<S>;

  constructor(options: DatabaseOptions<S>) {
    const max = options.poolSize ?? 10;
    this.appPool = new Pool({ connectionString: options.appUrl, max, application_name: 'app' });
    this.systemPool = new Pool({ connectionString: options.systemUrl, max: Math.max(2, Math.ceil(max / 2)), application_name: 'system' });
    for (const pool of [this.appPool, this.systemPool]) {
      pool.on('error', (err) => this.logger.error(`Idle client error: ${err.message}`));
    }
    this.app = drizzle(this.appPool, { schema: options.schema });
    this.sys = drizzle(this.systemPool, { schema: options.schema });
  }

  /** Run `fn` in a transaction scoped to one organisation; RLS hides every other tenant's rows. */
  tenant<T>(ctx: TenantContext, fn: (tx: Tx<S>) => Promise<T>): Promise<T> {
    return this.app.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.org_id', ${ctx.orgId}, true), set_config('app.user_id', ${ctx.userId ?? ''}, true)`,
      );
      return fn(tx);
    });
  }

  /** Run `fn` in a transaction as the system role. Use only where cross-tenant access is the point. */
  system<T>(fn: (tx: Tx<S>) => Promise<T>): Promise<T> {
    return this.sys.transaction(fn);
  }

  async ping(): Promise<void> {
    await this.appPool.query('select 1');
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.appPool.end(), this.systemPool.end()]);
  }
}
