/** Every admissions table (one per entity file) plus the outbox/inbox tables from @lib/messaging. */
export * from '../modules/admissions/entities/admission-cycle.entity';
export * from '../modules/admissions/entities/application.entity';
export * from '../modules/admissions/entities/stage-transition.entity';
export * from '../modules/admissions/entities/application-review.entity';
export * from '../modules/admissions/entities/ai-evaluation.entity';
export { inbox, outbox } from '@lib/messaging';
