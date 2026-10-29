import { CODE_ALPHABET, credentialCode } from './modules/outcomes/credentials.service';
import { type GraduationFacts, requirementEvidence } from './modules/outcomes/evidence';
import { isPhase } from './modules/outcomes/portfolio.service';
import { creditsEarned, programmeScore, residencyItems } from './modules/grading/course-score';

const RESIDENCY = [5, 5, 7, 10, 6, 5, 7].map((creditHours, i) => ({ position: i + 1, creditHours }));

describe('residency in the Programme Score', () => {
  it('weighs each approved stage by its credit hours, beside the courses', () => {
    const stages = residencyItems(RESIDENCY, new Map([[1, 80], [4, 90]]));
    expect(stages.reduce((n, s) => n + s.credits, 0)).toBe(45);
    const score = programmeScore([{ credits: 5, score: 70 }, ...stages]);
    // (70×5 + 80×5 + 90×10) / 20
    expect(score).toMatchObject({ programmeScore: 82.5, scoredCredits: 20, totalCredits: 50 });
  });

  it('earns credits for passed courses and approved stages only', () => {
    const courses = [
      { credits: 5, score: 72 },
      { credits: 5, score: 49 },
      { credits: 4, score: null },
    ];
    expect(creditsEarned(courses, residencyItems(RESIDENCY, new Map([[2, 60]])))).toBe(10);
  });
});

describe('graduation evidence', () => {
  const facts: GraduationFacts = {
    creditsEarned: 100,
    creditsTotal: 100,
    phases: { life: { done: 5, total: 5 }, builders: { done: 4, total: 5 }, elective: { done: 1, total: 1 } },
    stages: { done: 7, total: 7 },
    finalStageApproved: true,
    attendance: { attended: 36, held: 45 },
    portfolio: { done: 6, total: 8 },
    planStatus: 'submitted',
  };

  it('reads what the platform can see', () => {
    expect(requirementEvidence('credits_earned', facts)).toEqual({ evidence: '100 of 100 credits', met: true });
    expect(requirementEvidence('builders_outputs', facts).met).toBe(false);
    expect(requirementEvidence('approved_elective', facts).met).toBe(true);
    expect(requirementEvidence('residency_completion', facts).met).toBe(true);
    expect(requirementEvidence('conduct_and_attendance', facts)).toEqual({ evidence: '80% of classes attended (36 of 45)', met: true });
    expect(requirementEvidence('complete_portfolio', facts)).toEqual({ evidence: '6 of 8 portfolio sections complete', met: false });
    expect(requirementEvidence('post_lab_action_plan', facts)).toEqual({ evidence: 'Submitted for review', met: false });
  });

  it('leaves what it cannot see to faculty', () => {
    expect(requirementEvidence('final_assessment', facts)).toEqual({ evidence: 'Faculty confirm', met: false });
    expect(requirementEvidence('something_new', facts).met).toBe(false);
  });

  it('does not count attendance before any class is held', () => {
    expect(requirementEvidence('conduct_and_attendance', { ...facts, attendance: { attended: 0, held: 0 } }).met).toBe(false);
  });
});

describe('credential codes', () => {
  it('read DL-XXXX-XXXX-XXXX without 0, O, 1 or I', () => {
    for (let i = 0; i < 200; i++) {
      const code = credentialCode();
      expect(code).toMatch(/^DL-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    }
    expect(CODE_ALPHABET).not.toMatch(/[01OI]/);
  });

  it('use every random draw', () => {
    let n = 0;
    expect(credentialCode(() => n++ % CODE_ALPHABET.length)).toBe('DL-2345-6789-ABCD');
  });
});

describe('programme phases', () => {
  it('are recognised by name, whichever apostrophe the programme uses', () => {
    expect(isPhase('Builder’s Architecture', 'builder')).toBe(true);
    expect(isPhase("Builder's Architecture", 'builder')).toBe(true);
    expect(isPhase('Life Architecture', 'life')).toBe(true);
    expect(isPhase('Dream Residency', 'elective')).toBe(false);
  });
});
