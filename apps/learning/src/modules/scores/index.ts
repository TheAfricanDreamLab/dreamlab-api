import type { Provider, Type } from '@nestjs/common';
import { DreamScoreController } from './dream-score.controller';
import { DreamScoreService } from './dream-score.service';

/** The Dream Score (SCORE-1): wired into LearningModule. */
export const SCORES_CONTROLLERS: Type[] = [DreamScoreController];
export const SCORES_PROVIDERS: Provider[] = [DreamScoreService];
export { DreamScoreService };
