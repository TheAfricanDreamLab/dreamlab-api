import { Injectable } from '@nestjs/common';
import { type CommentAnchor, type DraftComment, type Presence, PRESENCE_SECONDS } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, requestNotification, userActor } from '@lib/messaging';
import { and, asc, eq, gt, lt, ne, or } from 'drizzle-orm';
import { CatalogDatabase, schema } from '../../database';
import { AuthoringService } from './authoring.service';

const { draftComments, draftPresence } = schema;
type CommentRow = typeof draftComments.$inferSelect;

/** Presence rows older than this are cleared on the next heartbeat. */
const PRESENCE_KEEP_MINUTES = 10;

/**
 * Working on a draft together (CAT-6): review comments anchored to the course, a module, an item or
 * a block, and who else has the draft open. Anyone who may open the draft (its authors and
 * reviewers) may comment, reply and resolve; only a comment's author may edit or delete it.
 */
@Injectable()
export class CollabService {
  constructor(
    @InjectDatabase() private readonly db: CatalogDatabase,
    private readonly authoring: AuthoringService,
    @InjectOutbox() private readonly outbox: OutboxWriter,
  ) {}

  async comments(p: Principal, draftId: string): Promise<{ items: DraftComment[] }> {
    const { draft } = await this.authoring.visibleDraft(p, draftId);
    const rows = await this.db.sys.select().from(draftComments).where(eq(draftComments.draftId, draft.id)).orderBy(asc(draftComments.createdAt)).limit(2000);
    return { items: await this.views(p, rows) };
  }

  async add(p: Principal, draftId: string, input: { anchor: CommentAnchor; body: string; parentId?: string }): Promise<DraftComment> {
    const { draft } = await this.authoring.visibleDraft(p, draftId);
    let parent: CommentRow | undefined;
    if (input.parentId) {
      [parent] = await this.db.sys.select().from(draftComments).where(and(eq(draftComments.id, input.parentId), eq(draftComments.draftId, draft.id)));
      if (!parent) throw notFound('comment_not_found', 'That comment is no longer there.');
      // Replies hang off the thread's first comment, and share its place.
      if (parent.parentId) [parent] = await this.db.sys.select().from(draftComments).where(eq(draftComments.id, parent.parentId));
      if (!parent) throw notFound('comment_not_found', 'That comment is no longer there.');
    }
    const id = newId();
    const row = await this.db.system(async (tx) => {
      const [inserted] = await tx
        .insert(draftComments)
        .values({ id, draftId: draft.id, ownerOrgId: draft.ownerOrgId, parentId: parent?.id ?? null, anchor: parent?.anchor ?? input.anchor, body: input.body, authorUserId: p.userId })
        .returning();
      // A reply reopens a resolved thread: there is something new to read.
      if (parent?.resolvedAt) await tx.update(draftComments).set({ resolvedAt: null, resolvedByUserId: null }).where(eq(draftComments.id, parent.id));
      const thread = parent ? await tx.select({ by: draftComments.authorUserId }).from(draftComments).where(or(eq(draftComments.id, parent.id), eq(draftComments.parentId, parent.id))) : [];
      const [me] = (await this.authoring.namesOf([p.userId])).values();
      const where = (parent?.anchor ?? input.anchor).label;
      await requestNotification(
        this.outbox,
        tx,
        {
          to: { userIds: [...new Set([...this.authoring.peopleOf(draft), ...thread.map((t) => t.by)])] },
          exclude: [p.userId],
          category: 'authoring',
          title: parent ? `${me ?? 'Someone'} replied on “${draft.title}”` : `${me ?? 'Someone'} commented on “${draft.title}”`,
          body: `${where ? `${where}: ` : ''}${input.body.slice(0, 280)}`,
          link: `/app/authoring/${draft.id}?comment=${parent?.id ?? id}`,
          orgId: draft.ownerOrgId,
          key: `draft-comment:${id}`,
        },
        userActor(p.userId),
      );
      return inserted!;
    });
    const [view] = await this.views(p, [row]);
    return view!;
  }

  async update(p: Principal, draftId: string, commentId: string, input: { body?: string; resolved?: boolean }): Promise<DraftComment> {
    const { draft } = await this.authoring.visibleDraft(p, draftId);
    const [row] = await this.db.sys.select().from(draftComments).where(and(eq(draftComments.id, commentId), eq(draftComments.draftId, draft.id)));
    if (!row) throw notFound('comment_not_found', 'That comment is no longer there.');
    if (input.body !== undefined && row.authorUserId !== p.userId) throw forbidden('not_your_comment', 'Only the person who wrote a comment can change it.');
    if (input.resolved !== undefined && row.parentId) throw badRequest('resolve_thread', 'Resolve the thread from its first comment.');
    const [updated] = await this.db.sys
      .update(draftComments)
      .set({
        ...(input.body !== undefined ? { body: input.body, editedAt: new Date() } : {}),
        ...(input.resolved === true ? { resolvedAt: new Date(), resolvedByUserId: p.userId } : input.resolved === false ? { resolvedAt: null, resolvedByUserId: null } : {}),
      })
      .where(eq(draftComments.id, row.id))
      .returning();
    const [view] = await this.views(p, [updated!]);
    return view!;
  }

  async remove(p: Principal, draftId: string, commentId: string): Promise<void> {
    const { draft } = await this.authoring.visibleDraft(p, draftId);
    const [row] = await this.db.sys.select().from(draftComments).where(and(eq(draftComments.id, commentId), eq(draftComments.draftId, draft.id)));
    if (!row) return;
    if (row.authorUserId !== p.userId) throw forbidden('not_your_comment', 'Only the person who wrote a comment can delete it.');
    await this.db.sys.delete(draftComments).where(or(eq(draftComments.id, row.id), eq(draftComments.parentId, row.id)));
  }

  /** A heartbeat: I have the draft open here. Returns everyone else seen in the last PRESENCE_SECONDS. */
  async heartbeat(p: Principal, draftId: string, input: { where: { moduleKey: string | null; itemKey: string | null; label: string } | null; editing: boolean }): Promise<{ people: Presence[] }> {
    const { draft } = await this.authoring.visibleDraft(p, draftId);
    const now = new Date();
    await this.db.sys
      .insert(draftPresence)
      .values({ draftId: draft.id, userId: p.userId, ownerOrgId: draft.ownerOrgId, where: input.where, editingAt: input.editing ? now : null, seenAt: now })
      .onConflictDoUpdate({
        target: [draftPresence.draftId, draftPresence.userId],
        set: { where: input.where, seenAt: now, ...(input.editing ? { editingAt: now } : {}) },
      });
    await this.db.sys.delete(draftPresence).where(and(eq(draftPresence.draftId, draft.id), lt(draftPresence.seenAt, new Date(now.getTime() - PRESENCE_KEEP_MINUTES * 60_000))));
    const since = new Date(now.getTime() - PRESENCE_SECONDS * 1000);
    const rows = await this.db.sys
      .select()
      .from(draftPresence)
      .where(and(eq(draftPresence.draftId, draft.id), ne(draftPresence.userId, p.userId), gt(draftPresence.seenAt, since)))
      .orderBy(asc(draftPresence.seenAt));
    const names = await this.authoring.namesOf(rows.map((r) => r.userId));
    return {
      people: rows.map((r) => ({
        userId: r.userId,
        name: names.get(r.userId) ?? 'Someone',
        where: r.where ?? null,
        editing: !!r.editingAt && r.editingAt > since,
        seenAt: r.seenAt.toISOString(),
      })),
    };
  }

  private async views(p: Principal, rows: CommentRow[]): Promise<DraftComment[]> {
    const names = await this.authoring.namesOf(rows.flatMap((r) => [r.authorUserId, r.resolvedByUserId]));
    const person = (id: string | null) => (id ? { userId: id, name: names.get(id) ?? 'Someone' } : null);
    return rows.map((r) => ({
      id: r.id,
      parentId: r.parentId,
      anchor: r.anchor,
      body: r.body,
      author: person(r.authorUserId),
      mine: r.authorUserId === p.userId,
      createdAt: r.createdAt.toISOString(),
      editedAt: r.editedAt?.toISOString() ?? null,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      resolvedBy: person(r.resolvedByUserId),
    }));
  }
}
