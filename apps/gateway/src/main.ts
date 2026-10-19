import 'reflect-metadata';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiDocument, createHttpApp } from '@lib/common';
import { loadConfig, loadDotEnv, swaggerEnabled, trustProxySetting } from '@lib/config';
import { CONTRACTS_VERSION } from '@dreamlab/contracts';
import { GatewayAppModule } from './app.module';
import { gatewayProductionSchema } from './config';
import { originMatcher } from './cors';
import { DocsService } from './docs/docs.service';

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig(gatewayProductionSchema);
  const app = await createHttpApp(GatewayAppModule.forRoot(config), {
    trustProxy: trustProxySetting(config.TRUST_PROXY),
    hsts: config.NODE_ENV === 'production',
  });

  const allowed = originMatcher(config.CORS_ORIGINS);
  app.enableCors({
    origin: (origin, cb) => cb(null, !origin || allowed(origin)),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type', 'accept', 'accept-language', 'x-request-id', 'x-tenant'],
    exposedHeaders: ['x-request-id', 'retry-after'],
    maxAge: 600,
  });

  if (swaggerEnabled(config)) {
    const own = buildOpenApiDocument(app, {
      title: 'Dream Lab OS API',
      description:
        'The public API, served by the gateway. Tenant context comes from the request host or origin ' +
        '(<slug>.theafricandreamlab.com); in development an X-Tenant header can set it. ' +
        `Contracts: @dreamlab/contracts ${CONTRACTS_VERSION}.`,
      version: CONTRACTS_VERSION,
    });
    const docs = app.get(DocsService);
    docs.start(own);
    SwaggerModule.setup('docs', app, own, {
      jsonDocumentUrl: 'docs-json',
      patchDocumentOnRequest: () => docs.document(),
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
    });
  }
  await app.listen({ port: config.GATEWAY_PORT, host: '0.0.0.0' });
}

void bootstrap();
