import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule, JwtVerifier } from '@lib/auth';
import { AllExceptionsFilter, REDIS, RedisModule } from '@lib/common';
import { ConfigModule } from '@lib/config';
import { HealthModule } from '@lib/health';
import { LoggerModule } from '@lib/logger';
import { MessagingModule, RABBIT, RabbitConnection } from '@lib/messaging';
import type Redis from 'ioredis';
import { ZodValidationPipe } from 'nestjs-zod';
import type { GatewayConfig } from './config';
import { DocsModule } from './modules/docs/docs.module';
import { ProxyModule } from './modules/proxy/proxy.module';

@Module({})
export class GatewayAppModule {
  static forRoot(config: GatewayConfig): DynamicModule {
    return {
      module: GatewayAppModule,
      imports: [
        ConfigModule.forValue(config),
        LoggerModule.forRoot({ service: config.SERVICE_NAME, level: config.LOG_LEVEL, pretty: config.LOG_PRETTY }),
        RedisModule.forRoot(config.REDIS_URL),
        MessagingModule.forRoot({ url: config.RABBITMQ_URL, serviceName: config.SERVICE_NAME }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: config.GATEWAY_RATE_LIMIT_PER_MINUTE }]),
        AuthModule.forRoot({
          verifier: {
            useFactory: () =>
              new JwtVerifier({ issuer: config.AUTH_ISSUER, audience: config.AUTH_AUDIENCE, keys: { jwksUrl: config.IAM_JWKS_URL } }),
          },
        }),
        HealthModule.forRoot({
          inject: [REDIS, RABBIT],
          useFactory: (redis: Redis, rabbit: RabbitConnection) => [
            { name: 'redis', check: () => redis.ping() },
            { name: 'rabbitmq', check: async () => { if (!rabbit.isConnected()) throw new Error('not connected'); } },
            ...(['iam', 'catalog', 'learning', 'notify'] as const).map((name) => ({
              name,
              check: async () => {
                const base = { iam: config.IAM_URL, catalog: config.CATALOG_URL, learning: config.LEARNING_URL, notify: config.NOTIFY_URL }[name];
                const res = await fetch(new URL('/health', base), { signal: AbortSignal.timeout(2500) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
              },
            })),
          ],
        }),
        ProxyModule,
        DocsModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    };
  }
}
