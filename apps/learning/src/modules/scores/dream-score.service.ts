import { Injectable } from '@nestjs/common';
import { DEFAULT_DREAM_SCORE_WEIGHTS, DREAM_SCORE_DIMENSION_LABELS, DREAM_SCORE_DIMENSIONS, type DreamScore } from '@dreamlab/contracts';

/**
 * The Dream Score™ (SCORE-1). Placeholder with the final interface: other modules (the portfolio)
 * depend on forEnrollment only.
 */
@Injectable()
export class DreamScoreService {
  /** A programme enrolment's Dream Score as of now. Callers have already checked access. */
  async forEnrollment(programEnrollmentId: string): Promise<DreamScore> {
    return {
      programEnrollmentId,
      overall: null,
      dimensions: DREAM_SCORE_DIMENSIONS.map((key) => ({ key, label: DREAM_SCORE_DIMENSION_LABELS[key], weight: DEFAULT_DREAM_SCORE_WEIGHTS[key], score: null, evidence: 0 })),
      growth: [],
      recent: [],
    };
  }
}
