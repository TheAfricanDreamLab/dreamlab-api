import 'reflect-metadata';
import { CONTRACTS_VERSION } from '@dreamlab/contracts';
import { createHttpApp, installGatewayTrust, setupSwagger } from '@lib/common';
import { loadConfig, loadDotEnv, swaggerEnabled, trustProxySetting } from '@lib/config';
import { runMigrations } from '@lib/database';
import { LearningAppModule } from './app.module';
import { learningProductionSchema } from './config';
import { learningMigrationsFolder } from './database';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig(learningProductionSchema);

  if (config.LEARNING_MIGRATE_ON_BOOT) {
    if (!config.LEARNING_MIGRATION_DATABASE_URL) throw new Error('LEARNING_MIGRATE_ON_BOOT needs LEARNING_MIGRATION_DATABASE_URL');
    await runMigrations(config.LEARNING_MIGRATION_DATABASE_URL, learningMigrationsFolder());
  }

  const app = await createHttpApp(LearningAppModule.forRoot(config), {
    trustProxy: trustProxySetting(config.TRUST_PROXY),
    hsts: config.NODE_ENV === 'production',
  });
  installGatewayTrust(app.getHttpAdapter().getInstance(), config.INTERNAL_GATEWAY_TOKEN);

  if (swaggerEnabled(config)) {
    setupSwagger(app, {
      title: 'Dream Lab OS · Learning service',
      description: `Enrolments, progress, checks, quizzes, submissions and discussions. Implements @dreamlab/contracts ${CONTRACTS_VERSION}. Clients should call it through the gateway.`,
      version: CONTRACTS_VERSION,
    });
  }
  await app.listen({ port: config.LEARNING_PORT, host: '0.0.0.0' });
}

void bootstrap();
