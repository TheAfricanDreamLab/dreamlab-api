import { DEFAULT_DREAM_SCORE_WEIGHTS, DREAM_SCORE_DIMENSIONS } from '@dreamlab/contracts';
import { assigneeStatus } from './modules/assigned/assignee-status';
import { ATTENDANCE_VALUES, changedEvidence, computeDreamScore, COURSE_DIMENSIONS, type Evidence, latestRevisions, RESIDENCY_DIMENSIONS } from './modules/scores/dream-score';

describe('Dream Score maths', () => {
  it('has no score before any evidence', () => {
    const c = computeDreamScore([], DEFAULT_DREAM_SCORE_WEIGHTS);
    expect(c).toMatchObject({ overall: null, learning: null, building: null });
    expect(c.dimensions.map((d) => d.key)).toEqual([...DREAM_SCORE_DIMENSIONS]);
    expect(c.dimensions.every((d) => d.score === null && d.evidence === 0)).toBe(true);
  });

  it('averages each dimension, then weights only the dimensions with evidence', () => {
    const events: Evidence[] = [
      { dimension: 'negotiation', value: 8, source: 'course_grade' },
      { dimension: 'execution', value: 9, source: 'attendance' },
      { dimension: 'execution', value: 6, source: 'attendance' },
    ];
    const c = computeDreamScore(events, DEFAULT_DREAM_SCORE_WEIGHTS);
    expect(c.dimensions.find((d) => d.key === 'execution')).toMatchObject({ score: 7.5, evidence: 2 });
    // Equal weights over the two dimensions with evidence: (8 + 7.5) / 2.
    expect(c.overall).toBe(7.8);
    expect(c.learning).toBe(8);
    expect(c.building).toBe(7.5);
  });

  it('follows the organisation’s weights, and ignores dimensions weighted zero', () => {
    const events: Evidence[] = [
      { dimension: 'vision', value: 10, source: 'residency_stage' },
      { dimension: 'financial', value: 4, source: 'course_grade' },
    ];
    const weights = { ...DEFAULT_DREAM_SCORE_WEIGHTS, vision: 30, financial: 10, digital: 0, collaboration: 0 };
    expect(computeDreamScore(events, weights).overall).toBe(8.5);
    expect(computeDreamScore(events, { ...weights, financial: 0, vision: 40 }).overall).toBe(10);
  });

  it('maps every programme course and every residency stage to known dimensions', () => {
    const known = new Set<string>(DREAM_SCORE_DIMENSIONS);
    expect(Object.keys(COURSE_DIMENSIONS)).toHaveLength(13);
    expect(Object.values(COURSE_DIMENSIONS).flat().every((d) => known.has(d))).toBe(true);
    expect(Object.keys(RESIDENCY_DIMENSIONS).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(Object.values(RESIDENCY_DIMENSIONS).flat().every((d) => known.has(d))).toBe(true);
    expect(ATTENDANCE_VALUES.present).toBeGreaterThan(ATTENDANCE_VALUES.late);
    expect(ATTENDANCE_VALUES.absent).toBeLessThan(ATTENDANCE_VALUES.excused);
  });
});

describe('assigned learning status', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  it('is completed once the course is, even after the due date', () => {
    expect(assigneeStatus({ status: 'completed', progressPct: 100 }, '2026-11-01', now)).toBe('completed');
  });
  it('is overdue after the due day, not on it', () => {
    expect(assigneeStatus({ status: 'active', progressPct: 40 }, '2026-11-09', now)).toBe('overdue');
    expect(assigneeStatus({ status: 'active', progressPct: 40 }, '2026-11-10', now)).toBe('in_progress');
  });
  it('has not started without progress or an enrolment', () => {
    expect(assigneeStatus({ status: 'active', progressPct: 0 }, null, now)).toBe('not_started');
    expect(assigneeStatus(null, null, now)).toBe('not_started');
  });
});

describe('Dream Score evidence revisions', () => {
  const grade = (value: number) => ({ source: 'course_grade' as const, sourceId: 'ce-1', dimension: 'negotiation', value });

  it('records a source once while its value stays the same', () => {
    expect(changedEvidence([grade(8.2)], [])).toEqual([{ ...grade(8.2), revision: 1 }]);
    expect(changedEvidence([grade(8.2)], [{ ...grade(8.2), revision: 1 }])).toEqual([]);
  });

  it('appends the next revision when a source changes, and counts only the latest', () => {
    const stored = [{ ...grade(8.2), revision: 1 }];
    const next = changedEvidence([grade(7.5)], stored);
    expect(next).toEqual([{ ...grade(7.5), revision: 2 }]);
    // Back to an earlier value is still a change from the latest revision.
    const third = changedEvidence([grade(8.2)], [...stored, ...next]);
    expect(third).toEqual([{ ...grade(8.2), revision: 3 }]);
    expect(latestRevisions([...stored, ...next, ...third]).map((e) => e.value)).toEqual([8.2]);
    expect(latestRevisions([...stored, ...next]).map((e) => e.value)).toEqual([7.5]);
  });
});
