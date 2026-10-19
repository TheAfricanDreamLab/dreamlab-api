import { DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule, JwtVerifier } from '@lib/auth';
import { AllExceptionsFilter, REDIS, RedisModule } from '@lib/common';
import { ConfigModule } from '@lib/config';
import { DATABASE, DatabaseModule } from '@lib/database';
import { HealthModule } from '@lib/health';
import { LoggerModule } from '@lib/logger';
import { MessagingModule, RABBIT, RabbitConnection } from '@lib/messaging';
import type Redis from 'ioredis';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import type { IamConfig } from './config';
import { IamDatabase, schema } from './database';
import { AuthenticationModule } from './modules/auth/auth.module';
import { AuthzModule } from './modules/authz/authz.module';
import { DomainsModule } from './modules/domains/domains.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { KeysModule } from './modules/keys/keys.module';
import { SigningKeysService } from './modules/keys/signing-keys.service';
import { MeModule } from './modules/me/me.module';
import { MembersModule } from './modules/members/members.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrgStructureModule } from './modules/org-structure/org-structure.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PlatformModule } from './modules/platform/platform.module';
import { ScimModule } from './modules/scim/scim.module';
import { SeedModule } from './modules/seed/seed.module';
import { SsoModule } from './modules/sso/sso.module';

/** Infrastructure shared by the HTTP app and the CLI. */
export function iamInfrastructure(config: IamConfig) {
  return [
    ConfigModule.forValue(config),
    LoggerModule.forRoot({ service: config.SERVICE_NAME, level: config.LOG_LEVEL, pretty: config.LOG_PRETTY }),
    RedisModule.forRoot(config.REDIS_URL),
    DatabaseModule.forRoot({ schema, appUrl: config.IAM_DATABASE_URL, systemUrl: config.IAM_SYSTEM_DATABASE_URL }),
  ];
}

@Module({})
export class IamAppModule {
  static forRoot(config: IamConfig): DynamicModule {
    return {
      module: IamAppModule,
      imports: [
        ...iamInfrastructure(config),
        MessagingModule.forRoot({ url: config.RABBITMQ_URL, serviceName: config.SERVICE_NAME, relay: true }),
        KeysModule,
        NotificationsModule,
        AuthzModule,
        AuthModule.forRoot({
          // IAM verifies its own tokens in-process; other services fetch the JWKS.
          verifier: {
            inject: [SigningKeysService],
            useFactory: (keys: SigningKeysService) =>
              new JwtVerifier({ issuer: config.AUTH_ISSUER, audience: config.AUTH_AUDIENCE, keys: { resolver: keys.resolveKey } }),
          },
        }),
        AuthenticationModule,
        MeModule,
        OrganizationsModule,
        MembersModule,
        InvitationsModule,
        OrgStructureModule,
        DomainsModule,
        SsoModule,
        ScimModule,
        PlatformModule,
        SeedModule,
        HealthModule.forRoot({
          inject: [DATABASE, REDIS, RABBIT],
          useFactory: (db: IamDatabase, redis: Redis, rabbit: RabbitConnection) => [
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
