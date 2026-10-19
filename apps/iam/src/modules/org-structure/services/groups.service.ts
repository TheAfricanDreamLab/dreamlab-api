import { Injectable } from '@nestjs/common';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, count, eq, gt, inArray, sql } from 'drizzle-orm';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { toGroup } from '../../../common/mappers/group.mapper';
import { pageResult } from '../../../common/mappers/pagination';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { MembershipLoader } from '../../members/services/membership-loader.service';

const { groups, groupMembers, memberships, roleAssignments } = schema;

@Injectable()
export class GroupsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly loader: MembershipLoader,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

  async listGroups(principal: Principal, orgId: string) {
    const rows = await this.db.tenant(this.ctx(principal, orgId), (tx) =>
      tx
        .select({ g: groups, n: count(groupMembers.membershipId) })
        .from(groups)
        .leftJoin(groupMembers, eq(groupMembers.groupId, groups.id))
        .groupBy(groups.id)
        .orderBy(asc(groups.name)),
    );
    return { items: rows.map((r) => toGroup(r.g, r.n)) };
  }

  async createGroup(principal: Principal, orgId: string, name: string, meta: RequestMeta) {
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const rows = await tx.insert(groups).values({ id: newId(), orgId, name }).onConflictDoNothing().returning();
      if (rows.length === 0) throw conflict('group_name_taken', 'A group with that name already exists');
      await this.event(tx, principal, orgId, meta, IamEvents.GroupChanged, { orgId, groupId: rows[0]!.id, change: 'created' });
      return toGroup(rows[0]!, 0);
    });
  }

  async updateGroup(principal: Principal, orgId: string, groupId: string, name: string, meta: RequestMeta) {
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const [clash] = await tx.select({ id: groups.id }).from(groups).where(and(eq(groups.name, name), sql`${groups.id} <> ${groupId}`));
      if (clash) throw conflict('group_name_taken', 'A group with that name already exists');
      const [row] = await tx.update(groups).set({ name }).where(eq(groups.id, groupId)).returning();
      if (!row) throw notFound('group_not_found', 'Group not found');
      const [n] = await tx.select({ n: count() }).from(groupMembers).where(eq(groupMembers.groupId, groupId));
      await this.event(tx, principal, orgId, meta, IamEvents.GroupChanged, { orgId, groupId, change: 'updated' });
      return toGroup(row, n?.n ?? 0);
    });
  }

  async deleteGroup(principal: Principal, orgId: string, groupId: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const deleted = await tx.delete(groups).where(eq(groups.id, groupId)).returning({ id: groups.id });
      if (deleted.length === 0) throw notFound('group_not_found', 'Group not found');
      await tx.delete(roleAssignments).where(and(eq(roleAssignments.scopeType, 'group'), eq(roleAssignments.scopeId, groupId)));
      await this.event(tx, principal, orgId, meta, IamEvents.GroupChanged, { orgId, groupId, change: 'deleted' });
    });
  }

  async listGroupMembers(principal: Principal, orgId: string, groupId: string, query: { limit: number; cursor?: string }) {
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      await this.requireGroup(tx, groupId);
      const rows = await tx
        .select({ id: groupMembers.membershipId })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), query.cursor ? gt(groupMembers.membershipId, query.cursor) : undefined))
        .orderBy(asc(groupMembers.membershipId))
        .limit(query.limit + 1);
      const page = pageResult(rows, query.limit);
      return { items: await this.loader.load(tx, page.items.map((r) => r.id)), nextCursor: page.nextCursor };
    });
  }

  async addGroupMembers(principal: Principal, orgId: string, groupId: string, membershipIds: string[], meta: RequestMeta): Promise<void> {
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      await this.requireGroup(tx, groupId);
      const ids = [...new Set(membershipIds)];
      const found = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .where(and(inArray(memberships.id, ids), inArray(memberships.status, ['active', 'invited', 'suspended'])));
      if (found.length !== ids.length) throw badRequest('member_not_found', 'Some memberships do not belong to this organisation');
      await tx.insert(groupMembers).values(ids.map((membershipId) => ({ groupId, membershipId, orgId }))).onConflictDoNothing();
      await this.event(tx, principal, orgId, meta, IamEvents.GroupChanged, { orgId, groupId, change: 'members_added', membershipIds: ids });
    });
  }

  async removeGroupMember(principal: Principal, orgId: string, groupId: string, membershipId: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const removed = await tx
        .delete(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.membershipId, membershipId)))
        .returning({ id: groupMembers.membershipId });
      if (removed.length === 0) throw notFound('member_not_found', 'That member is not in the group');
      await this.event(tx, principal, orgId, meta, IamEvents.GroupChanged, { orgId, groupId, change: 'member_removed', membershipIds: [membershipId] });
    });
  }

  // ---------- helpers ----------

  private async requireGroup(tx: IamTx, groupId: string): Promise<void> {
    const [row] = await tx.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
    if (!row) throw notFound('group_not_found', 'Group not found');
  }

  private async event(tx: IamTx, principal: Principal, orgId: string, meta: RequestMeta, type: string, payload: Record<string, unknown>) {
    await this.outbox.add(tx, { type, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload });
  }
}
