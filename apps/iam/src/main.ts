import 'reflect-metadata';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IAM_RPC_QUEUE } from '@lib/auth';
import { createHttpApp, setupSwagger } from '@lib/common';
import { loadConfig, loadDotEnv } from '@lib/config';
import { runMigrations } from '@lib/database';
import { CONTRACTS_VERSION } from '@dreamlab/contracts';
import { IamAppModule } from './app.module';
import { iamConfigSchema } from './config';
import { iamMigrationsFolder } from './database';
import { SeedService } from './modules/seed/seed.service';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig(iamConfigSchema);

  if (config.IAM_MIGRATE_ON_BOOT) {
    if (!config.IAM_MIGRATION_DATABASE_URL) throw new Error('IAM_MIGRATE_ON_BOOT needs IAM_MIGRATION_DATABASE_URL');
    await runMigrations(config.IAM_MIGRATION_DATABASE_URL, iamMigrationsFolder());
  }

  const app = await createHttpApp(IamAppModule.forRoot(config));
  if (config.IAM_SEED_ON_BOOT) await app.get(SeedService).run();

  // The same process answers RabbitMQ RPC (authorization checks, tenant resolution).
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: { urls: [config.RABBITMQ_URL], queue: IAM_RPC_QUEUE, queueOptions: { durable: true }, prefetchCount: 32 },
    },
    { inheritAppConfig: true },
  );
  await app.startAllMicroservices();

  if (config.SWAGGER_ENABLED) {
    setupSwagger(app, {
      title: 'Dream Lab OS · IAM service',
      description:
        'Identity and access: accounts, sessions, tokens, organisations, memberships, roles, org structure. ' +
        `Implements @dreamlab/contracts ${CONTRACTS_VERSION}. Clients should call it through the gateway.`,
      version: CONTRACTS_VERSION,
    });
  }
  await app.listen({ port: config.IAM_PORT, host: '0.0.0.0' });
}

void bootstrap();
