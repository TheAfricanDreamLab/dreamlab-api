import { timestamps } from '@lib/database';
import { boolean, integer, numeric, pgTable, uuid } from 'drizzle-orm/pg-core';
import { courses } from '../../courses/entities/course.entity';
import { electiveGroups } from './elective-group.entity';
import { programPhases } from './program-phase.entity';
import { programs } from './program.entity';

export const programCourses = pgTable('program_courses', {
  id: uuid('id').primaryKey(),
  programId: uuid('program_id').notNull().references(() => programs.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  phaseId: uuid('phase_id').references(() => programPhases.id),
  electiveGroupId: uuid('elective_group_id').references(() => electiveGroups.id),
  ownerOrgId: uuid('owner_org_id').notNull(),
  position: integer('position').notNull(),
  isRequired: boolean('is_required').notNull().default(true),
  creditHours: numeric('credit_hours', { mode: 'number' }).notNull(),
  ...timestamps,
});
