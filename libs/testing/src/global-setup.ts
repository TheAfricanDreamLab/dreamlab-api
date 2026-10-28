/**
 * Starts Postgres (with the per-service roles from docker/postgres/init.sql), Redis and RabbitMQ
 * once for the whole e2e run and exposes their URLs through process.env.
 * Uses relative imports only: Jest runs this before path aliases are configured.
 */
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import { RedisContainer } from '@testcontainers/redis';
import { GenericContainer, Wait } from 'testcontainers';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

export default async function globalSetup(): Promise<void> {
  const [postgres, redis, rabbit, azurite] = await Promise.all([
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
    // Azure Blob Storage emulator, for uploads (MEDIA-1).
    new GenericContainer('mcr.microsoft.com/azure-storage/azurite:3.34.0')
      .withCommand(['azurite-blob', '--blobHost', '0.0.0.0', '--skipApiVersionCheck', '--loose'])
      .withExposedPorts(10000)
      .withWaitStrategy(Wait.forLogMessage(/successfully listens/))
      .start(),
  ]);

  // As on Azure, where the admin cannot grant BYPASSRLS: system roles work through their explicit
  // policies (each service's system_role_policies migration), so the tests prove those are complete.
  const nobypass = await postgres.exec([
    'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c',
    ['iam', 'catalog', 'learning', 'notify'].map((s) => `ALTER ROLE ${s}_system NOBYPASSRLS;`).join(' '),
  ]);
  if (nobypass.exitCode !== 0) throw new Error(`Could not drop BYPASSRLS: ${nobypass.output}`);

  // One node owns every slot, so plain (non-cluster) clients keep working.
  const slots = await redis.exec(['redis-cli', 'cluster', 'addslotsrange', '0', '16383']);
  if (slots.exitCode !== 0 || !slots.output.includes('OK')) throw new Error(`Redis cluster setup failed: ${slots.output}`);
  // Slots are assigned at once, but the cluster only serves commands once its state turns ok.
  for (let i = 0; ; i++) {
    const info = await redis.exec(['redis-cli', 'cluster', 'info']);
    if (info.output.includes('cluster_state:ok')) break;
    if (i >= 100) throw new Error(`Redis cluster never became ready: ${info.output}`);
    await new Promise((r) => setTimeout(r, 100));
  }

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
    NOTIFY_DATABASE_URL: pg('notify_app', 'dreamlab_notify'),
    NOTIFY_SYSTEM_DATABASE_URL: pg('notify_system', 'dreamlab_notify'),
    NOTIFY_MIGRATION_DATABASE_URL: pg('notify_owner', 'dreamlab_notify'),
    // Azurite's published development account key.
    STORAGE_CONNECTION_STRING: `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://${azurite.getHost()}:${azurite.getMappedPort(10000)}/devstoreaccount1;`,
    REDIS_URL: redis.getConnectionUrl(),
    RABBITMQ_URL: rabbit.getAmqpUrl(),
    // Every spec file boots IAM against the same database, so they must share the key that encrypts its signing keys.
    E2E_KEY_ENCRYPTION_SECRET: randomBytes(32).toString('base64'),
  });
  (globalThis as Record<string, unknown>).__E2E_CONTAINERS__ = [postgres, redis, rabbit, azurite];
}
