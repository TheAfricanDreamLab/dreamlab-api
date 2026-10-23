/** Event types the learning service publishes on the `dreamlab.events` exchange (also the routing keys). */
export const LearningEvents = {
  EnrollmentCreated: 'enrollment.created',
  ItemCompleted: 'learning_item.completed',
  CourseCompleted: 'course_enrollment.completed',
  SubmissionCreated: 'submission.created',
  GradeReleased: 'grade.released',
} as const;
