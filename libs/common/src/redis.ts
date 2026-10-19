import { DynamicModule, Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');
export const InjectRedis = (): ParameterDecorator & PropertyDecorator => Inject(REDIS);

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit().catch(() => this.redis.disconnect());
  }
}

@Global()
@Module({})
export class RedisModule {
  static forRoot(url: string, keyPrefix?: string): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS,
          useFactory: () => new Redis(url, { keyPrefix, maxRetriesPerRequest: 3, lazyConnect: false }),
        },
        RedisShutdown,
      ],
      exports: [REDIS],
    };
  }
}

export type { Redis };
