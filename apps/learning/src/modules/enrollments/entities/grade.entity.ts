import { jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { submissions } from './submission.entity';

/**
 * A grade on a submission. A regrade inserts a new row that supersedes the old one. Quizzes are
 * graded automatically; assignments wait for a human, who releases the grade.
 */
export const grades = pgTable('grades', {
  id: uuid('id').primaryKey(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id),
  userId: uuid('user_id').notNull(),
  graderUserId: uuid('grader_user_id'),
  aiEvaluationId: uuid('ai_evaluation_id'),
  score: numeric('score', { mode: 'number' }).notNull(),
  rubricScores: jsonb('rubric_scores').$type<Record<string, number>>().notNull().default({}),
  feedback: text('feedback'),
  supersedesGradeId: uuid('supersedes_grade_id'),
  releasedAt: timestamp('released_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
