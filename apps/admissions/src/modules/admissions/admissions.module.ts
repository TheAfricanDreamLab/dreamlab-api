import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { CATALOG_RPC_QUEUE, CatalogClient, IAM_USERS_QUEUE, RpcClient } from '@lib/rpc';
import type { AdmissionsConfig } from '../../config';
import { AdmissionsAdminController, ApplicationsController } from './admissions.controller';
import { AI_EVALUATOR, AdmissionsService, CATALOG, IAM } from './admissions.service';
import { AiEvaluator } from './ai-evaluator';

@Module({
  controllers: [ApplicationsController, AdmissionsAdminController],
  providers: [
    AdmissionsService,
    { provide: IAM, inject: [CONFIG], useFactory: (c: AdmissionsConfig) => new RpcClient(c.RABBITMQ_URL, IAM_USERS_QUEUE, 4000) },
    { provide: CATALOG, inject: [CONFIG], useFactory: (c: AdmissionsConfig) => new CatalogClient(new RpcClient(c.RABBITMQ_URL, CATALOG_RPC_QUEUE)) },
    { provide: AI_EVALUATOR, inject: [CONFIG], useFactory: (c: AdmissionsConfig) => new AiEvaluator(c.ANTHROPIC_API_KEY, c.ADMISSIONS_AI_MODEL) },
  ],
})
export class AdmissionsModule {}
