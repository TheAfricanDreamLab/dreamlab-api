import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CONTRACTS_VERSION } from '@dreamlab/contracts';
import { createHttpApp, installGatewayTrust, setupSwagger } from '@lib/common';
import { loadConfig, loadDotEnv, swaggerEnabled, trustProxySetting } from '@lib/config';
import { runMigrations } from '@lib/database';
import { CATALOG_RPC_QUEUE } from '@lib/rpc';
import type { BlobStorage } from '@lib/storage';
import { CatalogAppModule } from './app.module';
import { catalogProductionSchema } from './config';
import { catalogMigrationsFolder } from './database';
import { CatalogSeedService } from './modules/seed/catalog-seed.service';
import { DATASETS } from './modules/seed/datasets';
import { STORAGE } from './modules/authoring/authoring.service';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig(catalogProductionSchema);

  if (config.CATALOG_MIGRATE_ON_BOOT) {
    if (!config.CATALOG_MIGRATION_DATABASE_URL) throw new Error('CATALOG_MIGRATE_ON_BOOT needs CATALOG_MIGRATION_DATABASE_URL');
    await runMigrations(config.CATALOG_MIGRATION_DATABASE_URL, catalogMigrationsFolder());
  }

  const app = await createHttpApp(CatalogAppModule.forRoot(config), {
    trustProxy: trustProxySetting(config.TRUST_PROXY),
    hsts: config.NODE_ENV === 'production',
  });
  installGatewayTrust(app.getHttpAdapter().getInstance(), config.INTERNAL_GATEWAY_TOKEN);

  // The same process answers RabbitMQ RPC from the learning service.
  app.connectMicroservice<MicroserviceOptions>(
    { transport: Transport.RMQ, options: { urls: [config.RABBITMQ_URL], queue: CATALOG_RPC_QUEUE, queueOptions: { durable: true }, prefetchCount: 32 } },
    { inheritAppConfig: true },
  );
  await app.startAllMicroservices();

  if (swaggerEnabled(config)) {
    setupSwagger(app, {
      title: 'Dream Lab OS · Catalog service',
      description: `Courses, versions, modules, items and programmes. Implements @dreamlab/contracts ${CONTRACTS_VERSION}. Clients should call it through the gateway.`,
      version: CONTRACTS_VERSION,
    });
  }
  await app.listen({ port: config.CATALOG_PORT, host: '0.0.0.0' });

  // Development: Azurite needs its containers, and CORS so the browser can upload.
  if (config.NODE_ENV === 'development') {
    await app
      .get<BlobStorage>(STORAGE)
      .prepareForDevelopment()
      .catch((err: unknown) => new Logger('Storage').warn(`Azurite not prepared: ${err instanceof Error ? err.message : String(err)}`));
  }

  // After listening, so a slow or unavailable IAM never blocks the catalog from serving.
  if (config.CATALOG_SEED) {
    const seed = app.get(CatalogSeedService);
    const dataset = DATASETS[config.CATALOG_SEED];
    const attempt = async (n: number): Promise<void> => {
      try {
        await seed.run(dataset, config.CATALOG_SEED_OWNER_SLUG);
      } catch (err) {
        new Logger('CatalogSeed').error(`Seeding failed (attempt ${n}): ${err instanceof Error ? err.message : String(err)}`);
        if (n < 10) setTimeout(() => void attempt(n + 1), 15_000).unref();
      }
    };
    void attempt(1);
  }
}

void bootstrap();
