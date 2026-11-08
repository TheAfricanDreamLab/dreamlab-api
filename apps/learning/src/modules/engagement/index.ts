import type { Provider, Type } from '@nestjs/common';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';
import { ProgressRemindersService } from './progress-reminders.service';

/** Staying on track (LRN-9): wired into LearningModule. */
export const ENGAGEMENT_CONTROLLERS: Type[] = [EngagementController];
export const ENGAGEMENT_PROVIDERS: Provider[] = [EngagementService, ProgressRemindersService];
export { EngagementService, ProgressRemindersService };
