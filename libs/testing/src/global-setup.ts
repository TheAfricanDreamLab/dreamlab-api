/**
 * Starts Postgres (with the per-service roles from docker/postgres/init.sql), Redis and RabbitMQ
 * once for the whole e2e run and exposes their URLs through process.env.
 * Uses relative imports only: Jest runs this before path aliases are configured.
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { RedisContainer } from '@testcontainers/redis';
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
    new RedisContainer('redis:7.4-alpine').start(),
    new RabbitMQContainer('rabbitmq:4.1-management-alpine').withStartupTimeout(180_000).start(),
  ]);

  const pg = (user: string) => `postgres://${user}:${user}@${postgres.getHost()}:${postgres.getPort()}/dreamlab_iam`;
  Object.assign(process.env, {
    IAM_DATABASE_URL: pg('iam_app'),
    IAM_SYSTEM_DATABASE_URL: pg('iam_system'),
    IAM_MIGRATION_DATABASE_URL: pg('iam_owner'),
    REDIS_URL: redis.getConnectionUrl(),
    RABBITMQ_URL: rabbit.getAmqpUrl(),
  });
  (globalThis as Record<string, unknown>).__E2E_CONTAINERS__ = [postgres, redis, rabbit];
}
