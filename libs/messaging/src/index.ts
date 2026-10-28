import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import { DATABASE, DatabaseService } from '@lib/database';
import { OutboxRelay, OutboxWriter, RelayOptions } from './outbox';
import { RabbitConnection } from './rabbit';

export * from './envelope';
export * from './notifications';
export * from './outbox';
export * from './rabbit';
export * from './schema';

export const RABBIT = Symbol('RABBIT');
export const OUTBOX = Symbol('OUTBOX');
export const OUTBOX_RELAY = Symbol('OUTBOX_RELAY');
export const InjectRabbit = (): ParameterDecorator & PropertyDecorator => Inject(RABBIT);
export const InjectOutbox = (): ParameterDecorator & PropertyDecorator => Inject(OUTBOX);

export interface MessagingOptions {
  url: string;
  serviceName: string;
  /** Run the outbox relay in this process (requires DatabaseModule with the outbox table). */
  relay?: boolean | RelayOptions;
}

@Injectable()
class MessagingLifecycle implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    @Inject(RABBIT) private readonly rabbit: RabbitConnection,
    @Optional() @Inject(OUTBOX_RELAY) private readonly relay: OutboxRelay | null,
  ) {}

  onApplicationBootstrap(): void {
    this.relay?.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.relay?.stop();
    await this.rabbit.close();
  }
}

@Global()
@Module({})
export class MessagingModule {
  static forRoot(options: MessagingOptions): DynamicModule {
    const providers: DynamicModule['providers'] = [
      { provide: RABBIT, useFactory: () => new RabbitConnection(options.url, options.serviceName) },
      { provide: OUTBOX, useValue: new OutboxWriter(options.serviceName) },
      MessagingLifecycle,
    ];
    if (options.relay) {
      const relayOptions = typeof options.relay === 'object' ? options.relay : {};
      providers.push({
        provide: OUTBOX_RELAY,
        inject: [DATABASE, RABBIT],
        useFactory: (db: DatabaseService<Record<string, unknown>>, rabbit: RabbitConnection) =>
          new OutboxRelay(db, rabbit, relayOptions),
      });
    }
    return {
      module: MessagingModule,
      providers,
      exports: [RABBIT, OUTBOX, ...(options.relay ? [OUTBOX_RELAY] : [])],
    };
  }
}
