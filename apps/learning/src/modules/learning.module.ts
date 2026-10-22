import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { CATALOG_RPC_QUEUE, CatalogClient, IAM_USERS_QUEUE, RpcClient } from '@lib/rpc';
import type { LearningConfig } from '../config';
import { LearningAdminController } from './admin/learning-admin.controller';
import { LearningStatsService } from './admin/learning-stats.service';
import { CohortsService } from './cohorts/cohorts.service';
import { EnrollmentsController } from './enrollments/enrollments.controller';
import { CATALOG, EnrollmentsService } from './enrollments/enrollments.service';
import { PlayerController } from './player/player.controller';
import { IAM_NAMES, PlayerService } from './player/player.service';

@Module({
  controllers: [EnrollmentsController, PlayerController, LearningAdminController],
  providers: [
    EnrollmentsService,
    CohortsService,
    PlayerService,
    LearningStatsService,
    { provide: CATALOG, inject: [CONFIG], useFactory: (c: LearningConfig) => new CatalogClient(new RpcClient(c.RABBITMQ_URL, CATALOG_RPC_QUEUE)) },
    { provide: IAM_NAMES, inject: [CONFIG], useFactory: (c: LearningConfig) => new RpcClient(c.RABBITMQ_URL, IAM_USERS_QUEUE, 3000) },
  ],
})
export class LearningModule {}
