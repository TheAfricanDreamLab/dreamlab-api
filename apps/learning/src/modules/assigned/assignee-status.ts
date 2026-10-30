import type { AssigneeStatus } from '@dreamlab/contracts';

/**
 * Where an assignee stands (ASSIGN-1): completed once the course is; overdue when the due date
 * (a UTC calendar day, inclusive) has passed without completion; in progress once they have started.
 */
export function assigneeStatus(enrollment: { status: string; progressPct: number } | null, dueOn: string | null, now = new Date()): AssigneeStatus {
  if (enrollment?.status === 'completed') return 'completed';
  if (dueOn && now.toISOString().slice(0, 10) > dueOn) return 'overdue';
  if (enrollment && enrollment.progressPct > 0) return 'in_progress';
  return 'not_started';
}

export const emptyCounts = (): Record<AssigneeStatus, number> => ({ not_started: 0, in_progress: 0, completed: 0, overdue: 0 });
