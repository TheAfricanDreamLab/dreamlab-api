/** Every catalog table (one per entity file) plus the outbox/inbox tables from @lib/messaging. */
export * from '../modules/courses/entities/course.entity';
export * from '../modules/courses/entities/course-version.entity';
export * from '../modules/courses/entities/module.entity';
export * from '../modules/courses/entities/content-item.entity';
export * from '../modules/courses/entities/assessment.entity';
export * from '../modules/courses/entities/question.entity';
export * from '../modules/courses/entities/rubric.entity';
export * from '../modules/courses/entities/rubric-criterion.entity';
export * from '../modules/courses/entities/assignment-spec.entity';
export * from '../modules/courses/entities/catalog-listing.entity';
export * from '../modules/programs/entities/program.entity';
export * from '../modules/programs/entities/program-phase.entity';
export * from '../modules/programs/entities/elective-group.entity';
export * from '../modules/programs/entities/program-course.entity';
export * from '../modules/programs/entities/graduation-requirement.entity';
export * from '../modules/programs/entities/capstone-stage-def.entity';
export * from '../modules/programs/entities/program-calendar-week.entity';
export { inbox, outbox } from '@lib/messaging';
