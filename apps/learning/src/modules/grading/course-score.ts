import type { ReleasedGrade } from '@dreamlab/contracts';
import type { CourseContent } from '@lib/rpc';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { LearningTx, schema } from '../../database';
import { flatItems } from '../enrollments/enrollments.service';

const { submissions, grades } = schema;
type GradeRow = typeof grades.$inferSelect;

/**
 * A course's final score (0–100, one decimal): its weighted quizzes and assignments, each weighted by
 * gradeWeight. Null until every weighted item has a score, so a course never shows a score that
 * would drop or rise once faculty grade the rest.
 */
export function courseFinalScore(content: CourseContent, scores: Map<string, number>): number | null {
  const weighted = flatItems(content).filter((i) => (i.type === 'quiz' || i.type === 'assignment') && i.gradeWeight > 0);
  if (weighted.length === 0 || weighted.some((i) => !scores.has(i.id))) return null;
  const total = weighted.reduce((n, i) => n + i.gradeWeight, 0);
  const score = weighted.reduce((n, i) => n + scores.get(i.id)! * i.gradeWeight, 0) / total;
  return Math.round(score * 10) / 10;
}

/** Each scored item's score for one enrolment: the best quiz attempt, the latest released assignment grade. */
export async function itemScores(tx: LearningTx, enrollmentId: string): Promise<Map<string, number>> {
  const [quizzes, assignments] = await Promise.all([
    tx
      .select({ item: submissions.contentItemId, score: sql<number>`max(${grades.score})::float` })
      .from(grades)
      .innerJoin(submissions, eq(submissions.id, grades.submissionId))
      .where(and(eq(submissions.courseEnrollmentId, enrollmentId), eq(submissions.kind, 'quiz')))
      .groupBy(submissions.contentItemId),
    tx
      .select({ item: submissions.contentItemId, score: grades.score })
      .from(grades)
      .innerJoin(submissions, eq(submissions.id, grades.submissionId))
      .where(and(eq(submissions.courseEnrollmentId, enrollmentId), eq(submissions.kind, 'assignment'), isNotNull(grades.releasedAt)))
      .orderBy(desc(grades.releasedAt)),
  ]);
  const out = new Map(quizzes.map((q) => [q.item, q.score]));
  for (const a of assignments) if (!out.has(a.item)) out.set(a.item, a.score);
  return out;
}

/** The latest released grade on each submission (what the learner sees). */
export async function releasedGrades(tx: LearningTx, submissionIds: string[]): Promise<Map<string, ReleasedGrade>> {
  if (submissionIds.length === 0) return new Map();
  const rows = await tx
    .select()
    .from(grades)
    .where(and(inArray(grades.submissionId, submissionIds), isNotNull(grades.releasedAt)))
    .orderBy(desc(grades.releasedAt));
  const out = new Map<string, ReleasedGrade>();
  for (const g of rows) if (!out.has(g.submissionId)) out.set(g.submissionId, toReleasedGrade(g));
  return out;
}

export function toReleasedGrade(g: GradeRow): ReleasedGrade {
  return { scorePct: Math.round(g.score), rubricScores: g.rubricScores, feedback: g.feedback, releasedAt: g.releasedAt!.toISOString() };
}

/**
 * The Programme Score: course final scores weighted by credit hours, over the courses that have one
 * (ERD §9: program_courses.credit_hours × course scores). Null until a course has a final score.
 */
export function programmeScore(courses: Array<{ credits: number; score: number | null }>) {
  const scored = courses.filter((c) => c.score !== null);
  const scoredCredits = scored.reduce((n, c) => n + c.credits, 0);
  const totalCredits = courses.reduce((n, c) => n + c.credits, 0);
  const score = scoredCredits > 0 ? Math.round((scored.reduce((n, c) => n + c.score! * c.credits, 0) / scoredCredits) * 10) / 10 : null;
  return { programmeScore: score, scoredCredits, totalCredits };
}
