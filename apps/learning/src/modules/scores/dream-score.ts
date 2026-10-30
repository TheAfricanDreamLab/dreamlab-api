import { DREAM_SCORE_DIMENSION_LABELS, DREAM_SCORE_DIMENSIONS, type DreamScoreDimension, type DreamScoreWeights } from '@dreamlab/contracts';

/*
 * The Dream Score™ maths (SCORE-1), pure so it can be tested and explained: which evidence feeds which
 * dimension, and how dimensions add up. Values are 0–10.
 */

export type Source = 'course_grade' | 'residency_stage' | 'mentor_meeting' | 'attendance';
export interface Evidence {
  dimension: string;
  value: number;
  source: Source;
}

/** Courses of The African Dream Lab and the dimension each one shows. Courses not listed add no evidence. */
export const COURSE_DIMENSIONS: Record<string, DreamScoreDimension[]> = {
  'problem-solving': ['problem_solving'],
  'critical-thinking': ['problem_solving'],
  'systems-thinking': ['problem_solving'],
  'emotional-intelligence': ['character'],
  'character-and-ethics': ['character'],
  communication: ['communication'],
  'personal-branding': ['communication'],
  negotiation: ['negotiation'],
  'financial-intelligence': ['financial'],
  collaboration: ['collaboration'],
  'content-creation': ['digital'],
  'artificial-intelligence': ['digital'],
  'digital-marketing': ['digital'],
};

/** Dream Residency stages by position (1–7) and the dimensions their approval shows. */
export const RESIDENCY_DIMENSIONS: Record<number, DreamScoreDimension[]> = {
  1: ['vision'],
  2: ['problem_solving'],
  3: ['problem_solving', 'vision'],
  4: ['execution'],
  5: ['execution', 'resilience'],
  6: ['financial', 'vision'],
  7: ['communication', 'execution'],
};

/** A held mentor meeting: evidence of resilience. */
export const MENTOR_MEETING_EVIDENCE = { dimension: 'resilience' as DreamScoreDimension, value: 8 };

/** Attendance at a class: evidence of execution, by how the learner turned up. */
export const ATTENDANCE_VALUES: Record<'present' | 'late' | 'excused' | 'absent', number> = { present: 9, late: 6, excused: 7, absent: 2 };

const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export interface Computed {
  overall: number | null;
  learning: number | null;
  building: number | null;
  dimensions: Array<{ key: DreamScoreDimension; label: string; weight: number; score: number | null; evidence: number }>;
}

/**
 * Each dimension is the mean of its evidence; the Dream Score is the weighted mean of the dimensions
 * that have evidence (weights renormalised over them). Learning is the mean of course evidence;
 * Building the mean of residency, attendance and mentoring evidence.
 */
export function computeDreamScore(events: Evidence[], weights: DreamScoreWeights): Computed {
  const dimensions = DREAM_SCORE_DIMENSIONS.map((key) => {
    const values = events.filter((e) => e.dimension === key).map((e) => e.value);
    const m = mean(values);
    return { key, label: DREAM_SCORE_DIMENSION_LABELS[key], weight: weights[key] ?? 0, score: m === null ? null : round1(m), evidence: values.length };
  });
  const scored = dimensions.filter((d) => d.score !== null && d.weight > 0);
  const totalWeight = scored.reduce((n, d) => n + d.weight, 0);
  const overall = totalWeight > 0 ? round1(scored.reduce((n, d) => n + d.score! * d.weight, 0) / totalWeight) : null;
  const learning = mean(events.filter((e) => e.source === 'course_grade').map((e) => e.value));
  const building = mean(events.filter((e) => e.source !== 'course_grade').map((e) => e.value));
  return { overall, learning: learning === null ? null : round1(learning), building: building === null ? null : round1(building), dimensions };
}

/** "82%" for whole numbers, "82.5%" otherwise. */
export const pct = (n: number) => `${Math.round(n * 10) / 10}%`;

/** Evidence as stored: which source record it came from, and its revision. */
export interface RevisedEvidence extends Evidence {
  sourceId: string;
  revision: number;
}

const evidenceKey = (e: { source: string; sourceId: string; dimension: string }) => `${e.source}:${e.sourceId}:${e.dimension}`;

/** Each source's latest revision: what the score counts (earlier revisions stay as history). */
export function latestRevisions<T extends RevisedEvidence>(events: T[]): T[] {
  const latest = new Map<string, T>();
  for (const e of events) {
    const k = evidenceKey(e);
    const seen = latest.get(k);
    if (!seen || e.revision > seen.revision) latest.set(k, e);
  }
  return [...latest.values()];
}

/**
 * The evidence to append: sources not yet recorded (revision 1), and sources whose value changed
 * since their latest revision (the next revision). Unchanged sources add nothing.
 */
export function changedEvidence<T extends { source: string; sourceId: string; dimension: string; value: number }>(
  candidates: T[],
  stored: RevisedEvidence[],
): Array<T & { revision: number }> {
  const latest = new Map(latestRevisions(stored).map((e) => [evidenceKey(e), e]));
  const out: Array<T & { revision: number }> = [];
  for (const c of candidates) {
    const prev = latest.get(evidenceKey(c));
    if (!prev) out.push({ ...c, revision: 1 });
    else if (Math.abs(prev.value - c.value) > 1e-9) out.push({ ...c, revision: prev.revision + 1 });
  }
  return out;
}
