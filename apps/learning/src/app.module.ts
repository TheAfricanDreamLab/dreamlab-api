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
import type { LearningConfig } from './config';
import { LearningDatabase, schema } from './database';
import { LearningModule } from './modules/learning.module';

export function learningInfrastructure(config: LearningConfig) {
  return [
    ConfigModule.forValue(config),
    LoggerModule.forRoot({ service: config.SERVICE_NAME, level: config.LOG_LEVEL, pretty: config.LOG_PRETTY }),
    RedisModule.forRoot(config.REDIS_URL),
    DatabaseModule.forRoot({ schema, appUrl: config.LEARNING_DATABASE_URL, systemUrl: config.LEARNING_SYSTEM_DATABASE_URL }),
  ];
}

@Module({})
export class LearningAppModule {
  static forRoot(config: LearningConfig): DynamicModule {
    return {
      module: LearningAppModule,
      imports: [
        ...learningInfrastructure(config),
        MessagingModule.forRoot({ url: config.RABBITMQ_URL, serviceName: config.SERVICE_NAME, relay: true }),
        AuthModule.forRoot({
          verifier: { useFactory: () => new JwtVerifier({ issuer: config.AUTH_ISSUER, audience: config.AUTH_AUDIENCE, keys: { jwksUrl: config.IAM_JWKS_URL } }) },
          authzChecker: { inject: [REDIS], useFactory: (redis: Redis) => new RpcAuthzChecker(config.RABBITMQ_URL, redis) },
        }),
        LearningModule,
        HealthModule.forRoot({
          inject: [DATABASE, REDIS, RABBIT],
          useFactory: (db: LearningDatabase, redis: Redis, rabbit: RabbitConnection) => [
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
