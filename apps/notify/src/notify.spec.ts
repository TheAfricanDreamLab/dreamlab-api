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
    expect(m.text).toContain('Open it: https://learn.test/learn/a/b');
    expect(m.text).toContain('https://learn.test/app/account#notifications');
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
