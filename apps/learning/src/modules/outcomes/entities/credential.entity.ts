import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * A credential (CRED-1): a programme graduation or a course certificate, checkable by anyone at
 * /verify/<code>. Recipient, title and issuer are copied at issue, so the record stands as issued.
 */
export const credentials = pgTable(
  'credentials',
  {
    id: uuid('id').primaryKey(),
    /** Public, unguessable, easy to read aloud: DL-XXXX-XXXX-XXXX. */
    code: text('code').notNull().unique(),
    kind: text('kind', { enum: ['programme_graduation', 'course_completion'] }).notNull(),
    userId: uuid('user_id').notNull(),
    /** The issuing organisation: the cohort's host, or the course enrolment's context (null when self-paced on the platform). */
    issuerOrgId: uuid('issuer_org_id'),
    programEnrollmentId: uuid('program_enrollment_id'),
    courseEnrollmentId: uuid('course_enrollment_id'),
    recipientName: text('recipient_name').notNull(),
    title: text('title').notNull(),
    issuerName: text('issuer_name').notNull(),
    scorePct: numeric('score_pct', { precision: 5, scale: 2, mode: 'number' }),
    creditHours: numeric('credit_hours', { precision: 6, scale: 2, mode: 'number' }),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: text('revoked_reason'),
    revokedByUserId: uuid('revoked_by_user_id'),
  },
  (t) => [
    // Issuing twice for the same achievement returns the first credential.
    uniqueIndex('credentials_programme_once').on(t.programEnrollmentId).where(sql`kind = 'programme_graduation'`),
    uniqueIndex('credentials_course_once').on(t.courseEnrollmentId).where(sql`kind = 'course_completion'`),
    index('credentials_user_idx').on(t.userId),
  ],
);
