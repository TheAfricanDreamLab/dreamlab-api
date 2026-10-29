import { timestamps } from '@lib/database';
import { index, integer, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { courses } from '../../courses/entities/course.entity';

/** Someone who teaches for an organisation (INSTR-1), optionally linked to their account. */
export const instructorProfiles = pgTable(
  'instructor_profiles',
  {
    id: uuid('id').primaryKey(),
    ownerOrgId: uuid('owner_org_id').notNull(),
    name: text('name').notNull(),
    title: text('title').notNull().default(''),
    bio: text('bio').notNull().default(''),
    photoUrl: text('photo_url'),
    userId: uuid('user_id'),
    ...timestamps,
  },
  (t) => [index('instructor_profiles_owner').on(t.ownerOrgId)],
);

/** Who teaches a course, in order. A course with staff shows them instead of its file's instructors. */
export const courseStaff = pgTable(
  'course_staff',
  {
    courseId: uuid('course_id').notNull().references(() => courses.id),
    profileId: uuid('profile_id').notNull().references(() => instructorProfiles.id, { onDelete: 'cascade' }),
    ownerOrgId: uuid('owner_org_id').notNull(),
    role: text('role', { enum: ['lead', 'instructor', 'assistant'] }).notNull(),
    position: integer('position').notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.profileId] }), index('course_staff_profile').on(t.profileId)],
);
