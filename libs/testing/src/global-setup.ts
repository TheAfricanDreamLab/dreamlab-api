/**
 * Starts Postgres (with the per-service roles from docker/postgres/init.sql), Redis and RabbitMQ
 * once for the whole e2e run and exposes their URLs through process.env.
 * Uses relative imports only: Jest runs this before path aliases are configured.
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { RedisContainer } from '@testcontainers/redis';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

export default async function globalSetup(): Promise<void> {
  const [postgres, redis, rabbit] = await Promise.all([
    new PostgreSqlContainer('postgres:17-alpine')
      .withUsername('postgres')
      .withPassword('postgres')
      .withDatabase('postgres')
      .withCopyFilesToContainer([
        { source: join(__dirname, '..', '..', '..', 'docker', 'postgres', 'init.sql'), target: '/docker-entrypoint-initdb.d/10-service-databases.sql' },
      ])
      .start(),
    // Clustered, like Azure Managed Redis: a MULTI across hash slots fails here as it does there.
    new RedisContainer('redis:7.4-alpine').withCommand(['redis-server', '--cluster-enabled', 'yes']).start(),
    new RabbitMQContainer('rabbitmq:4.1-management-alpine').withStartupTimeout(180_000).start(),
  ]);

  // One node owns every slot, so plain (non-cluster) clients keep working.
  const slots = await redis.exec(['redis-cli', 'cluster', 'addslotsrange', '0', '16383']);
  if (slots.exitCode !== 0 || !slots.output.includes('OK')) throw new Error(`Redis cluster setup failed: ${slots.output}`);

  const pg = (user: string, db = 'dreamlab_iam') => `postgres://${user}:${user}@${postgres.getHost()}:${postgres.getPort()}/${db}`;
  Object.assign(process.env, {
    IAM_DATABASE_URL: pg('iam_app'),
    IAM_SYSTEM_DATABASE_URL: pg('iam_system'),
    IAM_MIGRATION_DATABASE_URL: pg('iam_owner'),
    CATALOG_DATABASE_URL: pg('catalog_app', 'dreamlab_catalog'),
    CATALOG_SYSTEM_DATABASE_URL: pg('catalog_system', 'dreamlab_catalog'),
    CATALOG_MIGRATION_DATABASE_URL: pg('catalog_owner', 'dreamlab_catalog'),
    LEARNING_DATABASE_URL: pg('learning_app', 'dreamlab_learning'),
    LEARNING_SYSTEM_DATABASE_URL: pg('learning_system', 'dreamlab_learning'),
    LEARNING_MIGRATION_DATABASE_URL: pg('learning_owner', 'dreamlab_learning'),
    REDIS_URL: redis.getConnectionUrl(),
    RABBITMQ_URL: rabbit.getAmqpUrl(),
    // Every spec file boots IAM against the same database, so they must share the key that encrypts its signing keys.
    E2E_KEY_ENCRYPTION_SECRET: randomBytes(32).toString('base64'),
  });
  (globalThis as Record<string, unknown>).__E2E_CONTAINERS__ = [postgres, redis, rabbit];
}
