import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { CATALOG_RPC_QUEUE, CatalogClient, IAM_USERS_QUEUE, RpcClient } from '@lib/rpc';
import { BlobStorage } from '@lib/storage';
import type { LearningConfig } from '../config';
import { LearningAdminController } from './admin/learning-admin.controller';
import { LearningStatsService } from './admin/learning-stats.service';
import { CohortsController, ProgramsController } from './cohorts/cohorts.controller';
import { CohortsService } from './cohorts/cohorts.service';
import { ProgramsService } from './cohorts/programs.service';
import { SessionRemindersService } from './cohorts/session-reminders.service';
import { GradingController } from './grading/grading.controller';
import { GradingService } from './grading/grading.service';
import { EnrollmentsController } from './enrollments/enrollments.controller';
import { FilesController } from './files/files.controller';
import { FilesService, STORAGE } from './files/files.service';
import { CATALOG, EnrollmentsService } from './enrollments/enrollments.service';
import { PlayerController } from './player/player.controller';
import { IAM_NAMES, PlayerService } from './player/player.service';

@Module({
  controllers: [EnrollmentsController, PlayerController, LearningAdminController, CohortsController, ProgramsController, GradingController, FilesController],
  providers: [
    EnrollmentsService,
    CohortsService,
    ProgramsService,
    GradingService,
    PlayerService,
    LearningStatsService,
    SessionRemindersService,
    FilesService,
    { provide: STORAGE, inject: [CONFIG], useFactory: (c: LearningConfig) => new BlobStorage(c) },
    { provide: CATALOG, inject: [CONFIG], useFactory: (c: LearningConfig) => new CatalogClient(new RpcClient(c.RABBITMQ_URL, CATALOG_RPC_QUEUE)) },
    { provide: IAM_NAMES, inject: [CONFIG], useFactory: (c: LearningConfig) => new RpcClient(c.RABBITMQ_URL, IAM_USERS_QUEUE, 3000) },
  ],
})
export class LearningModule {}
