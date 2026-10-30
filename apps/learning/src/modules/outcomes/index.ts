import type { Provider, Type } from '@nestjs/common';
import { ActionPlanService } from './action-plan.service';
import { CertificatesIntake } from './certificates-intake.service';
import { CredentialsService } from './credentials.service';
import { GraduationService } from './graduation.service';
import { CredentialsController, OutcomesController, PublicOutcomesController } from './outcomes.controller';
import { PortfolioService } from './portfolio.service';
import { ProgressService } from './progress.service';
import { ResidencyService } from './residency.service';

/** Dream Residency, action plans, graduation, portfolio and credentials (Slice 3): wired into LearningModule. */
export const OUTCOMES_CONTROLLERS: Type[] = [OutcomesController, PublicOutcomesController, CredentialsController];
export const OUTCOMES_PROVIDERS: Provider[] = [ProgressService, ResidencyService, ActionPlanService, CredentialsService, PortfolioService, GraduationService, CertificatesIntake];
export { CredentialsService };
