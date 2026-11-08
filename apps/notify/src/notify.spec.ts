import { safeFileName } from '@lib/storage';
import { notificationEmail } from './modules/notifications/email-template';
import { NotificationRequestSchema } from './modules/notifications/notification-intake.service';
import { withDefaults } from './modules/notifications/notifications.service';

const request = {
  to: { userIds: ['0b5c8a52-3f1e-4c2a-9d7e-1a2b3c4d5e6f'] },
  category: 'grades',
  title: 'Graded',
  body: 'You scored 80%.',
  link: '/learn/a/b',
  orgId: null,
  key: 'grade:1',
};

describe('notification requests', () => {
  it('accept app paths only as links', () => {
    expect(NotificationRequestSchema.safeParse(request).success).toBe(true);
    expect(NotificationRequestSchema.safeParse({ ...request, link: null }).success).toBe(true);
    for (const link of ['https://evil.example/x', '//evil.example/x', '/\\evil.example', 'javascript:alert(1)', '/\t/evil.example', '/\n/evil.example', '/a b']) {
      expect(NotificationRequestSchema.safeParse({ ...request, link }).success).toBe(false);
    }
  });

  it('refuse unknown categories', () => {
    expect(NotificationRequestSchema.safeParse({ ...request, category: 'marketing' }).success).toBe(false);
  });
});

describe('email preferences', () => {
  it('email every category unless it is turned off', () => {
    const prefs = withDefaults({ grades: false, spam: false });
    expect(prefs.grades).toBe(false);
    expect(prefs.sessions).toBe(true);
    expect(prefs.progress).toBe(true);
    expect(Object.keys(prefs)).not.toContain('spam');
  });
});

describe('notification email', () => {
  it('escapes what people wrote and links back to the app', () => {
    const m = notificationEmail('sade@example.com', 'Sade <b>Student</b>', { title: 'Feedback', body: 'Use <script> tags & see\nnext line', link: '/learn/a/b' }, 'https://learn.test');
    expect(m.subject).toBe('Feedback');
    expect(m.html).not.toContain('<script>');
    expect(m.html).toContain('&lt;script&gt; tags &amp; see<br>next line');
    expect(m.html).toContain('href="https://learn.test/learn/a/b"');
    expect(m.text).toContain('See your result: https://learn.test/learn/a/b');
    expect(m.text).toContain('https://learn.test/app/account#notifications');
  });

  it('names the button for where it leads and labels the category', () => {
    const grade = notificationEmail('t@example.com', 'Tunde', { category: 'submissions', title: 'New work', body: 'v2', link: '/app/grading/x' }, 'https://learn.test');
    expect(grade.html).toContain('>Grade the work</a>');
    expect(grade.html).toContain('Work to review');
    const plain = notificationEmail('t@example.com', 'Tunde', { title: 'Hello', body: 'No link', link: null }, 'https://learn.test');
    expect(plain.html).not.toContain('href="https://learn.test/app/grading');
    expect(plain.text).toContain('Hi Tunde,');
  });

  it('sends reminders back to the lesson, without changing other emails that link there', () => {
    const reminder = notificationEmail('a@example.com', 'Amara Okafor', { category: 'progress', title: 'Your next lesson is waiting', body: 'Twenty minutes today keeps you on track.', link: '/learn/e1/i2' }, 'https://learn.test');
    expect(reminder.html).toContain('Staying on track');
    expect(reminder.html).toContain('>Pick up where you left off</a>');
    expect(reminder.text).toContain('Hi Amara,');
    expect(reminder.text).toContain('https://learn.test/app/account#notifications');
    const programme = notificationEmail('a@example.com', 'Amara', { category: 'progress', title: 'A note from your facilitator', body: 'How is it going?', link: '/app/programme' }, 'https://learn.test');
    expect(programme.html).toContain('>Open My programme</a>');
    const grade = notificationEmail('a@example.com', 'Amara', { category: 'grades', title: 'Graded', body: '80%', link: '/learn/e1/i2' }, 'https://learn.test');
    expect(grade.html).toContain('>See your result</a>');
  });
});

describe('stored file names', () => {
  it('keep letters, digits, dots and dashes only', () => {
    expect(safeFileName('Problem canvas (final).pdf')).toBe('Problem-canvas-final-.pdf');
    expect(safeFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(safeFileName('???')).toBe('file');
    expect(safeFileName(`${'a'.repeat(300)}.pdf`)).toHaveLength(120);
  });
});
