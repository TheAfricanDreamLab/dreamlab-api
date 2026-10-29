import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import type { FastifyInstance } from 'fastify';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { newId } from './ids';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Create a Fastify-backed Nest app with request ids, the pino logger and trusted proxy headers. */
export interface HttpAppOptions {
  trustProxy: boolean | number | string[];
  /** Send Strict-Transport-Security (production, behind TLS). */
  hsts?: boolean;
}

export async function createHttpApp(module: unknown, options: HttpAppOptions): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    // Fastify accepts a hop count here; Nest's adapter type omits `number`.
    trustProxy: options.trustProxy as boolean | string[],
    bodyLimit: 1024 * 1024,
    genReqId: (req: { headers: Record<string, string | string[] | undefined> }) => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      return typeof incoming === 'string' && /^[\w-]{8,128}$/.test(incoming) ? incoming : newId();
    },
  });
  // SCIM clients send application/scim+json; parse it like JSON.
  adapter.getInstance().addContentTypeParser(['application/scim+json'], { parseAs: 'string' }, (_req, body, done) => {
    try {
      done(null, body === '' ? {} : JSON.parse(body as string));
    } catch (err) {
      (err as { statusCode?: number }).statusCode = 400;
      done(err as Error, undefined);
    }
  });
  installWebhookBodyParser(adapter.getInstance());
  const app = await NestFactory.create<NestFastifyApplication>(module as never, adapter, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (req, reply) => {
      void reply.header(REQUEST_ID_HEADER, req.id);
      void reply.header('x-content-type-options', 'nosniff');
      void reply.header('referrer-policy', 'no-referrer');
      void reply.header('cross-origin-resource-policy', 'same-site');
      if (!req.url.startsWith('/docs')) {
        void reply.header('x-frame-options', 'DENY');
        void reply.header('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
      }
      // Token responses must never be cached by browsers or proxies.
      if (req.url.startsWith('/v1/auth/')) void reply.header('cache-control', 'no-store');
      if (options.hsts) void reply.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
    });
  return app;
}

/** Meeting-provider webhooks are signed over the exact body: keep application/webhook+json as the raw string. */
export function installWebhookBodyParser(fastify: FastifyInstance): void {
  fastify.addContentTypeParser(['application/webhook+json'], { parseAs: 'string' }, (_req, body, done) => done(null, body));
}

export interface SwaggerOptions {
  title: string;
  description: string;
  version: string;
  path?: string;
}

export function buildOpenApiDocument(app: INestApplication, options: SwaggerOptions): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version)
    .setLicense('Apache-2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}

/** Serve Swagger UI at /docs and the raw document at /docs-json. */
export function setupSwagger(app: INestApplication, options: SwaggerOptions): OpenAPIObject {
  const document = buildOpenApiDocument(app, options);
  SwaggerModule.setup(options.path ?? 'docs', app, document, {
    jsonDocumentUrl: `${options.path ?? 'docs'}-json`,
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  });
  return document;
}

