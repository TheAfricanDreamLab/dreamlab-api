import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NotificationCategorySchema } from '@dreamlab/contracts';
import { newId } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import type { EmailSender } from '@lib/email';
import { EventEnvelope, InjectRabbit, NOTIFICATION_REQUESTED, RabbitConnection } from '@lib/messaging';
import { IamRpc, RpcClient, UserContact } from '@lib/rpc';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { NotifyConfig } from '../../config';
import { NotifyDatabase, schema } from '../../database';
import { notificationEmail } from './email-template';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export const IAM = Symbol('IAM');

const { notifications, notificationPreferences } = schema;

export const NotificationRequestSchema = z.object({
  to: z.object({
    userIds: z.array(z.string().uuid()).max(500).optional(),
    permission: z.object({ orgId: z.string().uuid(), permission: z.string() }).optional(),
  }),
  exclude: z.array(z.string().uuid()).optional(),
  category: NotificationCategorySchema,
  title: z.string().min(1).max(200),
  body: z.string().max(2000),
  // App paths only, so an emailed link can never point at another site. No whitespace or control
  // characters either: URL parsing drops tabs and newlines, so "/\t/evil.example" would become //evil.example.
  link: z
    .string()
    .max(500)
    .regex(/^\/(?![/\\])[^\s\\]*$/)
    .refine((l) => ![...l].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127), 'No control characters')
    .nullable(),
  orgId: z.string().uuid().nullable(),
  key: z.string().min(1).max(200),
});
type Request = z.infer<typeof NotificationRequestSchema>;

/**
 * Turns `notification.requested` events into one notification per recipient, then emails the
 * people whose preferences allow it. Redelivered events add nothing: (user, key) is unique.
 */
@Injectable()
export class NotificationIntake implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationIntake.name);

  constructor(
    @InjectDatabase() private readonly db: NotifyDatabase,
    @InjectRabbit() private readonly rabbit: RabbitConnection,
    @InjectConfig() private readonly config: NotifyConfig,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(IAM) private readonly iam: RpcClient,
  ) {}

  onApplicationBootstrap(): void {
    this.rabbit.subscribe({ queue: 'notify.requests', bindings: [NOTIFICATION_REQUESTED], handler: async (e) => void (await this.deliver(e)) });
  }

  /** Returns how many people were newly notified. */
  async deliver(event: EventEnvelope): Promise<number> {
    const parsed = NotificationRequestSchema.safeParse(event.payload);
    if (!parsed.success) {
      this.logger.warn(`Ignoring malformed ${event.type} ${event.id} from ${event.source}`);
      return 0;
    }
    const r = parsed.data;
    const recipients = new Set(r.to.userIds ?? []);
    if (r.to.permission) for (const id of await this.iam.send<string[]>(IamRpc.PermissionHolders, r.to.permission)) recipients.add(id);
    for (const id of r.exclude ?? []) recipients.delete(id);
    if (recipients.size === 0) return 0;

    const created = await this.db.system((tx) =>
      tx
        .insert(notifications)
        .values([...recipients].map((userId) => ({ id: newId(), userId, orgId: r.orgId, category: r.category, title: r.title, body: r.body, link: r.link, dedupeKey: r.key })))
        .onConflictDoNothing()
        .returning({ id: notifications.id, userId: notifications.userId }),
    );
    if (created.length > 0) await this.sendEmails(r, created);
    return created.length;
  }

  /** Email is best effort: the notification is already in the app, so a failed send is logged, not retried. */
  private async sendEmails(r: Request, created: { id: string; userId: string }[]): Promise<void> {
    try {
      const userIds = created.map((c) => c.userId);
      const prefs = await this.db.system((tx) => tx.select().from(notificationPreferences).where(inArray(notificationPreferences.userId, userIds)));
      const optedOut = new Set(prefs.filter((p) => p.email[r.category] === false).map((p) => p.userId));
      const wanted = userIds.filter((id) => !optedOut.has(id));
      if (wanted.length === 0) return;
      const contacts = await this.iam.send<UserContact[]>(IamRpc.UserContacts, { userIds: wanted });
      const notificationOf = new Map(created.map((c) => [c.userId, c.id]));
      for (const c of contacts) {
        if (!c.email) continue;
        try {
          await this.email.send(notificationEmail(c.email, c.name, r, this.config.PUBLIC_APP_URL));
          await this.db.system((tx) => tx.update(notifications).set({ emailedAt: new Date() }).where(eq(notifications.id, notificationOf.get(c.id)!)));
        } catch (err) {
          this.logger.error(`Email via ${this.email.name} failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      this.logger.error(`Notification emails for ${r.key} skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
