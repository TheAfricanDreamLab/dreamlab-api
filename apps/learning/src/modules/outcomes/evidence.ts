/** What the platform can see for each graduation requirement (GRAD-1). Faculty confirm; this informs them. */

export interface GraduationFacts {
  creditsEarned: number;
  creditsTotal: number;
  /** Courses of each phase with a passing final score, of how many the phase needs. */
  phases: { life: Count; builders: Count; elective: Count };
  stages: Count;
  finalStageApproved: boolean;
  attendance: { attended: number; held: number };
  portfolio: Count;
  planStatus: 'none' | 'draft' | 'submitted' | 'changes_requested' | 'approved';
}

export interface Count {
  done: number;
  total: number;
}

/** Attendance needed for "conduct and attendance" (the design's checklist: 80% of live sessions). */
export const ATTENDANCE_THRESHOLD = 0.8;

const of = (c: Count, noun: string) => `${c.done} of ${c.total} ${noun}`;
const counted = (c: Count) => c.total > 0 && c.done >= c.total;

export function requirementEvidence(key: string, f: GraduationFacts): { evidence: string; met: boolean } {
  switch (key) {
    case 'credits_earned':
      return { evidence: `${f.creditsEarned} of ${f.creditsTotal} credits`, met: f.creditsTotal > 0 && f.creditsEarned >= f.creditsTotal };
    case 'life_architecture_blueprint':
      return { evidence: of(f.phases.life, 'Life Architecture courses passed'), met: counted(f.phases.life) };
    case 'builders_outputs':
      return { evidence: of(f.phases.builders, 'Builder’s Architecture courses passed'), met: counted(f.phases.builders) };
    case 'approved_elective':
      return { evidence: of(f.phases.elective, 'electives passed'), met: counted(f.phases.elective) };
    case 'residency_completion':
      return { evidence: of(f.stages, 'residency stages approved'), met: counted(f.stages) };
    case 'conduct_and_attendance': {
      const { attended, held } = f.attendance;
      if (held === 0) return { evidence: 'No classes held yet', met: false };
      const share = attended / held;
      return { evidence: `${Math.round(share * 100)}% of classes attended (${attended} of ${held})`, met: share >= ATTENDANCE_THRESHOLD };
    }
    case 'complete_portfolio':
      return { evidence: of(f.portfolio, 'portfolio sections complete'), met: counted(f.portfolio) };
    case 'final_demonstration':
      return { evidence: f.finalStageApproved ? 'Final Demonstration approved' : 'Final Demonstration not yet approved', met: f.finalStageApproved };
    case 'post_lab_action_plan':
      return { evidence: PLAN_EVIDENCE[f.planStatus], met: f.planStatus === 'approved' };
    default:
      // final_assessment and anything a programme adds: only faculty can tell.
      return { evidence: 'Faculty confirm', met: false };
  }
}

const PLAN_EVIDENCE: Record<GraduationFacts['planStatus'], string> = {
  none: 'Not started',
  draft: 'Draft',
  submitted: 'Submitted for review',
  changes_requested: 'Changes asked',
  approved: 'Approved',
};
