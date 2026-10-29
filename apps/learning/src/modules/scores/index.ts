import type { Provider, Type } from '@nestjs/common';
import { DreamScoreService } from './dream-score.service';

/** The Dream Score (SCORE-1): wired into LearningModule. */
export const SCORES_CONTROLLERS: Type[] = [];
export const SCORES_PROVIDERS: Provider[] = [DreamScoreService];
export { DreamScoreService };
