import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { IAM_USERS_QUEUE, RpcClient } from '@lib/rpc';
import type { CatalogConfig } from '../../config';
import { CatalogSeedService, IAM_RPC } from './catalog-seed.service';

@Module({
  providers: [
    CatalogSeedService,
    { provide: IAM_RPC, inject: [CONFIG], useFactory: (config: CatalogConfig) => new RpcClient(config.RABBITMQ_URL, IAM_USERS_QUEUE) },
  ],
  exports: [CatalogSeedService, IAM_RPC],
})
export class SeedModule {}
