import { type DynamicModule, Module } from '@nestjs/common';
import { CONFIG, ConfigModule } from '@lib/config';
import { DatabaseModule } from '@lib/database';
import { LoggerModule } from '@lib/logger';
import { BlobStorage } from '@lib/storage';
import type { CatalogConfig } from '../../config';
import { schema } from '../../database';
import { STORAGE } from '../authoring/authoring.service';
import { VideoWorker } from './video-worker';

/**
 * The video worker on its own (CATALOG_ROLE=video-worker): the database and storage, nothing that
 * serves requests or relays events.
 */
@Module({})
export class VideoWorkerModule {
  static forRoot(config: CatalogConfig): DynamicModule {
    return {
      module: VideoWorkerModule,
      imports: [
        ConfigModule.forValue(config),
        LoggerModule.forRoot({ service: `${config.SERVICE_NAME}-video-worker`, level: config.LOG_LEVEL, pretty: config.LOG_PRETTY }),
        DatabaseModule.forRoot({ schema, appUrl: config.CATALOG_DATABASE_URL, systemUrl: config.CATALOG_SYSTEM_DATABASE_URL }),
      ],
      providers: [{ provide: STORAGE, inject: [CONFIG], useFactory: (c: CatalogConfig) => new BlobStorage(c) }, VideoWorker],
    };
  }
}
