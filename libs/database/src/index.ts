import { DynamicModule, Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { customType } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { DatabaseOptions, DatabaseService } from './database.service';

export * from './database.service';

export const DATABASE = Symbol('DATABASE');
export const InjectDatabase = (): ParameterDecorator & PropertyDecorator => Inject(DATABASE);

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly db: DatabaseService<Record<string, unknown>>) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db.close();
  }
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot<S extends Record<string, unknown>>(options: DatabaseOptions<S>): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE, useFactory: () => new DatabaseService(options) }, DatabaseShutdown],
      exports: [DATABASE],
    };
  }
}

/** Apply pending migrations as the database owner. */
export async function runMigrations(ownerUrl: string, migrationsFolder: string): Promise<void> {
  const pool = new Pool({ connectionString: ownerUrl, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}

/** Case-insensitive text (Postgres citext extension). */
export const citext = customType<{ data: string }>({ dataType: () => 'citext' });

/** Hierarchical label path (Postgres ltree extension), e.g. `a1b2.c3d4`. */
export const ltree = customType<{ data: string }>({ dataType: () => 'ltree' });

/** ltree labels cannot contain hyphens on every Postgres version, so ids are stored without them. */
export const idToLabel = (id: string): string => id.replace(/-/g, '');
export const labelToId = (label: string): string =>
  `${label.slice(0, 8)}-${label.slice(8, 12)}-${label.slice(12, 16)}-${label.slice(16, 20)}-${label.slice(20)}`;
