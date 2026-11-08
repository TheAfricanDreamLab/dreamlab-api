import type { NotificationCategory } from '@dreamlab/contracts';
import { type EmailMessage, renderEmail } from '@lib/email';

/** The label above the headline, by category. */
const EYEBROW: Record<NotificationCategory, string> = {
  grades: 'Grades and feedback',
  submissions: 'Work to review',
  sessions: 'Classes and meetings',
  cohorts: 'Your programme',
  authoring: 'Course authoring',
  admissions: 'Admissions',
  community: 'Mentors and circles',
  circles: 'Your Dream Circle',
  progress: 'Staying on track',
  account: 'Your account',
};

/** What the button does, from where it leads; the most specific path first. */
const ACTIONS: [RegExp, string][] = [
  [/^\/app\/grading\//, 'Grade the work'],
  [/^\/app\/admissions\//, 'Review the application'],
  [/^\/app\/apply\//, 'See your application'],
  [/^\/app\/authoring\//, 'Open the course'],
  [/^\/courses\//, 'See the course'],
  [/^\/learn\//, 'See your result'],
  [/^\/app\/learning/, 'Go to My learning'],
  [/^\/app\/programme\/[^/]+\/(action-plan|residency)/, 'Open it'],
  [/^\/app\/programme/, 'Open My programme'],
  [/^\/app\/mentoring/, 'Open Mentoring'],
  [/^\/app\/circles\/[^/]+\/call/, 'Join the call'],
  [/^\/app\/circles\//, 'Open the circle'],
  [/^\/app\/credentials/, 'See your credential'],
];

/**
 * Labels that depend on why the email was sent, tried before ACTIONS: a reminder that links to a
 * lesson takes the learner back into it, where a grade email linking there shows the result.
 */
const CATEGORY_ACTIONS: Partial<Record<NotificationCategory, [RegExp, string][]>> = {
  progress: [[/^\/learn\//, 'Pick up where you left off']],
};

function actionLabel(link: string, category?: NotificationCategory): string {
  const path = link.startsWith('/') ? link : new URL(link).pathname;
  const rules = [...((category && CATEGORY_ACTIONS[category]) || []), ...ACTIONS];
  return rules.find(([re]) => re.test(path))?.[1] ?? 'Open The African Dream Lab';
}

/** One notification as a designed email, linking back to the app. */
export function notificationEmail(
  to: string,
  name: string,
  n: { title: string; body: string; link: string | null; category?: NotificationCategory },
  appUrl: string,
): EmailMessage {
  const url = n.link ? new URL(n.link, appUrl).href : null;
  const first = name.split(' ')[0] || name;
  const body = renderEmail({
    appUrl,
    preview: n.body.split('\n')[0]!.slice(0, 140),
    eyebrow: n.category ? EYEBROW[n.category] : undefined,
    heading: n.title,
    paragraphs: [`Hi ${first},`, n.body],
    button: url ? { label: actionLabel(n.link!, n.category), url } : undefined,
    reason: 'You’re getting this because of your email settings on The African Dream Lab.',
    manageUrl: new URL('/app/account#notifications', appUrl).href,
  });
  return { to, subject: n.title, ...body };
}
