import 'reflect-metadata';
import { CONTRACTS_VERSION } from '@dreamlab/contracts';
import { createHttpApp, installGatewayTrust, setupSwagger } from '@lib/common';
import { loadConfig, loadDotEnv, swaggerEnabled, trustProxySetting } from '@lib/config';
import { runMigrations } from '@lib/database';
import { AdmissionsAppModule } from './app.module';
import { admissionsProductionSchema } from './config';
import { admissionsMigrationsFolder } from './database';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig(admissionsProductionSchema);

  if (config.ADMISSIONS_MIGRATE_ON_BOOT) {
    if (!config.ADMISSIONS_MIGRATION_DATABASE_URL) throw new Error('ADMISSIONS_MIGRATE_ON_BOOT needs ADMISSIONS_MIGRATION_DATABASE_URL');
    await runMigrations(config.ADMISSIONS_MIGRATION_DATABASE_URL, admissionsMigrationsFolder());
  }

  const app = await createHttpApp(AdmissionsAppModule.forRoot(config), {
    trustProxy: trustProxySetting(config.TRUST_PROXY),
    hsts: config.NODE_ENV === 'production',
  });
  installGatewayTrust(app.getHttpAdapter().getInstance(), config.INTERNAL_GATEWAY_TOKEN);

  if (swaggerEnabled(config)) {
    setupSwagger(app, {
      title: 'Dream Lab OS · Admissions service',
      description: `Admission cycles, applications and their ten-stage pipeline. Implements @dreamlab/contracts ${CONTRACTS_VERSION}. Clients should call it through the gateway.`,
      version: CONTRACTS_VERSION,
    });
  }
  await app.listen({ port: config.ADMISSIONS_PORT, host: '0.0.0.0' });
}

void bootstrap();
