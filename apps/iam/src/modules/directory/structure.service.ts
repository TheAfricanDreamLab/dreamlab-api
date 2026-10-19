import { Injectable } from '@nestjs/common';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, newId, notFound } from '@lib/common';
import { idToLabel, InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, count, eq, gt, inArray, sql } from 'drizzle-orm';
import { IamDatabase, IamTx, schema } from '../../database';
import { IamEvents } from '../../events';
import type { RequestMeta } from '../auth/sessions.service';
import { AuthzService } from '../authz/authz.service';
import { pageResult, toGroup, toUnit } from './mappers';
import { MembershipLoader } from './membership-loader';

const { orgUnits, groups, groupMembers, memberships, roleAssignments } = schema;

@Injectable()
export class StructureService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly authz: AuthzService,
    private readonly loader: MembershipLoader,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

  // ---------- org units ----------

  async listUnits(principal: Principal, orgId: string) {
    const rows = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select().from(orgUnits).orderBy(asc(orgUnits.path)));
    return { items: rows.map(toUnit) };
  }

  async createUnit(principal: Principal, orgId: string, dto: { name: string; parentUnitId?: string }, meta: RequestMeta) {
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const id = newId();
      let path = idToLabel(id);
      if (dto.parentUnitId) {
        const parent = await this.unit(tx, dto.parentUnitId);
        if (!parent) throw badRequest('unit_not_found', 'Parent unit not found');
        path = `${parent.path}.${path}`;
      }
      const [row] = await tx.insert(orgUnits).values({ id, orgId, name: dto.name, parentUnitId: dto.parentUnitId ?? null, path }).returning();
      await this.event(tx, principal, orgId, meta, IamEvents.UnitChanged, { orgId, unitId: id, change: 'created' });
      return toUnit(row!);
    });
  }

  /** Rename and/or move. Moving rewrites the path of the whole subtree in one statement. */
  async updateUnit(principal: Principal, orgId: string, unitId: string, dto: { name?: string; parentUnitId?: string | null }, meta: RequestMeta) {
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const unit = await this.unit(tx, unitId);
      if (!unit) throw notFound('unit_not_found', 'Org unit not found');
      if (dto.name) await tx.update(orgUnits).set({ name: dto.name }).where(eq(orgUnits.id, unitId));
      if (dto.parentUnitId !== undefined && dto.parentUnitId !== unit.parentUnitId) {
        let prefix = '';
        if (dto.parentUnitId) {
          const parent = await this.unit(tx, dto.parentUnitId);
          if (!parent) throw badRequest('unit_not_found', 'Parent unit not found');
          if (parent.path === unit.path || parent.path.startsWith(`${unit.path}.`)) {
            throw conflict('unit_cycle', 'A unit cannot move under itself or one of its own sub-units');
          }
          prefix = `${parent.path}.`;
        }
        const newPath = `${prefix}${idToLabel(unitId)}`;
        await tx.execute(sql`
          update ${orgUnits}
          set path = ${newPath}::ltree || subpath(path, nlevel(${unit.path}::ltree)), updated_at = now()
          where path <@ ${unit.path}::ltree`);
        await tx.update(orgUnits).set({ parentUnitId: dto.parentUnitId }).where(eq(orgUnits.id, unitId));
        await this.bumpUnitScopedUsers(tx, orgId);
      }
      await this.event(tx, principal, orgId, meta, IamEvents.UnitChanged, { orgId, unitId, change: 'updated' });
      return toUnit((await this.unit(tx, unitId))!);
    });
  }

  async deleteUnit(principal: Principal, orgId: string, unitId: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const unit = await this.unit(tx, unitId);
      if (!unit) throw notFound('unit_not_found', 'Org unit not found');
      const [children] = await tx.select({ n: count() }).from(orgUnits).where(eq(orgUnits.parentUnitId, unitId));
      const [members] = await tx.select({ n: count() }).from(memberships).where(eq(memberships.orgUnitId, unitId));
      if ((children?.n ?? 0) > 0 || (members?.n ?? 0) > 0) {
        throw conflict('unit_not_empty', 'Move or remove the unit’s sub-units and members first');
      }
      await this.bumpUnitScopedUsers(tx, orgId);
      await tx.delete(roleAssignments).where(and(eq(roleAssignments.scopeType, 'org_unit'), eq(roleAssignments.scopeId, unitId)));
      await tx.delete(orgUnits).where(eq(orgUnits.id, unitId));
      await this.event(tx, principal, orgId, meta, IamEvents.UnitChanged, { orgId, unitId, change: 'deleted' });
    });
  }

  // ---------- groups ----------

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

  private async unit(tx: IamTx, unitId: string) {
    const [row] = await tx.select().from(orgUnits).where(eq(orgUnits.id, unitId));
    return row ?? null;
  }

  private async requireGroup(tx: IamTx, groupId: string): Promise<void> {
    const [row] = await tx.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
    if (!row) throw notFound('group_not_found', 'Group not found');
  }

  /** Unit-scoped grants are cached with their paths; restructuring invalidates them. */
  private async bumpUnitScopedUsers(tx: IamTx, orgId: string): Promise<void> {
    const rows = await tx
      .select({ userId: memberships.userId })
      .from(roleAssignments)
      .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
      .where(and(eq(roleAssignments.orgId, orgId), eq(roleAssignments.scopeType, 'org_unit')));
    await this.authz.bumpVersion(tx, rows.map((r) => r.userId));
  }

  private async event(tx: IamTx, principal: Principal, orgId: string, meta: RequestMeta, type: string, payload: Record<string, unknown>) {
    await this.outbox.add(tx, { type, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload });
  }
}
