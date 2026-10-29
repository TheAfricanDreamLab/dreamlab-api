import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { CATALOG_RPC_QUEUE, CatalogClient, IAM_USERS_QUEUE, RpcClient } from '@lib/rpc';
import { MeetKit } from '@lib/meet-kit';
import { BlobStorage } from '@lib/storage';
import { CommunityController, LiveController, MeetingWebhookController } from './community/community.controller';
import { CommunityService } from './community/community.service';
import { LiveService, MEET_KIT } from './community/live.service';
import type { LearningConfig } from '../config';
import { LearningAdminController } from './admin/learning-admin.controller';
import { LearningStatsService } from './admin/learning-stats.service';
import { CohortsController, ProgramsController } from './cohorts/cohorts.controller';
import { CohortsService } from './cohorts/cohorts.service';
import { AdmissionsIntake } from './cohorts/admissions-intake.service';
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
import { ASSIGNED_CONTROLLERS, ASSIGNED_PROVIDERS } from './assigned';
import { OUTCOMES_CONTROLLERS, OUTCOMES_PROVIDERS } from './outcomes';
import { SCORES_CONTROLLERS, SCORES_PROVIDERS } from './scores';

@Module({
  controllers: [EnrollmentsController, PlayerController, LearningAdminController, CohortsController, ProgramsController, GradingController, FilesController, LiveController, MeetingWebhookController, CommunityController, ...OUTCOMES_CONTROLLERS, ...SCORES_CONTROLLERS, ...ASSIGNED_CONTROLLERS],
  providers: [
    EnrollmentsService,
    CohortsService,
    ProgramsService,
    GradingService,
    PlayerService,
    LearningStatsService,
    SessionRemindersService,
    AdmissionsIntake,
    LiveService,
    CommunityService,
    { provide: MEET_KIT, inject: [CONFIG], useFactory: (c: LearningConfig) => new MeetKit(c) },
    FilesService,
    { provide: STORAGE, inject: [CONFIG], useFactory: (c: LearningConfig) => new BlobStorage(c) },
    { provide: CATALOG, inject: [CONFIG], useFactory: (c: LearningConfig) => new CatalogClient(new RpcClient(c.RABBITMQ_URL, CATALOG_RPC_QUEUE)) },
    { provide: IAM_NAMES, inject: [CONFIG], useFactory: (c: LearningConfig) => new RpcClient(c.RABBITMQ_URL, IAM_USERS_QUEUE, 3000) },
    ...OUTCOMES_PROVIDERS,
    ...SCORES_PROVIDERS,
    ...ASSIGNED_PROVIDERS,
  ],
})
export class LearningModule {}
