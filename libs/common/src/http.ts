import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { newId } from './ids';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Create a Fastify-backed Nest app with request ids, the pino logger and trusted proxy headers. */
export async function createHttpApp(module: unknown): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    trustProxy: true,
    bodyLimit: 1024 * 1024,
    genReqId: (req: { headers: Record<string, string | string[] | undefined> }) => {
      const incoming = req.headers[REQUEST_ID_HEADER];
      return typeof incoming === 'string' && /^[\w-]{8,128}$/.test(incoming) ? incoming : newId();
    },
  });
  const app = await NestFactory.create<NestFastifyApplication>(module as never, adapter, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (req, reply) => {
      void reply.header(REQUEST_ID_HEADER, req.id);
    });
  return app;
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

