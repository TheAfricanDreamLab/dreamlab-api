import 'reflect-metadata';
import { CONTRACTS_VERSION } from '@dreamlab/contracts';
import { createHttpApp, installGatewayTrust, setupSwagger } from '@lib/common';
import { loadConfig, loadDotEnv, swaggerEnabled, trustProxySetting } from '@lib/config';
import { runMigrations } from '@lib/database';
import { NotifyAppModule } from './app.module';
import { notifyProductionSchema } from './config';
import { notifyMigrationsFolder } from './database';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig(notifyProductionSchema);

  if (config.NOTIFY_MIGRATE_ON_BOOT) {
    if (!config.NOTIFY_MIGRATION_DATABASE_URL) throw new Error('NOTIFY_MIGRATE_ON_BOOT needs NOTIFY_MIGRATION_DATABASE_URL');
    await runMigrations(config.NOTIFY_MIGRATION_DATABASE_URL, notifyMigrationsFolder());
  }

  const app = await createHttpApp(NotifyAppModule.forRoot(config), {
    trustProxy: trustProxySetting(config.TRUST_PROXY),
    hsts: config.NODE_ENV === 'production',
  });
  installGatewayTrust(app.getHttpAdapter().getInstance(), config.INTERNAL_GATEWAY_TOKEN);

  if (swaggerEnabled(config)) {
    setupSwagger(app, {
      title: 'Dream Lab OS · Notifications service',
      description: `In-app notifications and email. Implements @dreamlab/contracts ${CONTRACTS_VERSION}. Clients should call it through the gateway.`,
      version: CONTRACTS_VERSION,
    });
  }
  await app.listen({ port: config.NOTIFY_PORT, host: '0.0.0.0' });
}

void bootstrap();
