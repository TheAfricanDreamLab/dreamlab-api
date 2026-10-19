import { Injectable } from '@nestjs/common';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, newId, notFound } from '@lib/common';
import { idToLabel, InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { toUnit } from '../../../common/mappers/org-unit.mapper';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { AuthzService } from '../../authz/authz.service';

const { orgUnits, memberships, roleAssignments } = schema;

@Injectable()
export class OrgUnitsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly authz: AuthzService,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

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

  // ---------- helpers ----------

  private async unit(tx: IamTx, unitId: string) {
    const [row] = await tx.select().from(orgUnits).where(eq(orgUnits.id, unitId));
    return row ?? null;
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
