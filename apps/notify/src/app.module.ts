import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule, JwtVerifier, RpcAuthzChecker } from '@lib/auth';
import { AllExceptionsFilter, REDIS, RedisModule } from '@lib/common';
import { ConfigModule } from '@lib/config';
import { DATABASE, DatabaseModule } from '@lib/database';
import { HealthModule } from '@lib/health';
import { LoggerModule } from '@lib/logger';
import { MessagingModule, RABBIT, RabbitConnection } from '@lib/messaging';
import type Redis from 'ioredis';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import type { NotifyConfig } from './config';
import { NotifyDatabase, schema } from './database';
import { NotificationsModule } from './modules/notifications/notifications.module';

/** Infrastructure for the notifications service. It consumes events and publishes none, so no outbox relay. */
export function notifyInfrastructure(config: NotifyConfig) {
  return [
    ConfigModule.forValue(config),
    LoggerModule.forRoot({ service: config.SERVICE_NAME, level: config.LOG_LEVEL, pretty: config.LOG_PRETTY }),
    RedisModule.forRoot(config.REDIS_URL),
    DatabaseModule.forRoot({ schema, appUrl: config.NOTIFY_DATABASE_URL, systemUrl: config.NOTIFY_SYSTEM_DATABASE_URL }),
    MessagingModule.forRoot({ url: config.RABBITMQ_URL, serviceName: config.SERVICE_NAME, relay: false }),
  ];
}

@Module({})
export class NotifyAppModule {
  static forRoot(config: NotifyConfig): DynamicModule {
    return {
      module: NotifyAppModule,
      imports: [
        ...notifyInfrastructure(config),
        AuthModule.forRoot({
          verifier: { useFactory: () => new JwtVerifier({ issuer: config.AUTH_ISSUER, audience: config.AUTH_AUDIENCE, keys: { jwksUrl: config.IAM_JWKS_URL } }) },
          authzChecker: { inject: [REDIS], useFactory: (redis: Redis) => new RpcAuthzChecker(config.RABBITMQ_URL, redis) },
        }),
        NotificationsModule,
        HealthModule.forRoot({
          inject: [DATABASE, REDIS, RABBIT],
          useFactory: (db: NotifyDatabase, redis: Redis, rabbit: RabbitConnection) => [
            { name: 'database', check: () => db.ping() },
            { name: 'redis', check: () => redis.ping() },
            { name: 'rabbitmq', check: async () => { if (!rabbit.isConnected()) throw new Error('not connected'); } },
          ],
        }),
      ],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    };
  }
}
