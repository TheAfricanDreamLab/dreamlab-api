import { Injectable } from '@nestjs/common';
import { newId } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, SYSTEM_ACTOR } from '@lib/messaging';
import { and, asc, count, eq, inArray, ne, SQL, sql } from 'drizzle-orm';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { listResponse, paging, parseEqFilter, patchOperations, SCIM, scimBadRequest, scimConflict, scimNotFound } from '../utils/scim';
import { ScimUsersService } from './scim-users.service';

const { groups, groupMembers, memberships, users, scimDirectories } = schema;
type GroupRow = typeof groups.$inferSelect;

/** SCIM Groups (IAM-17), mapped onto the organisation's static groups. Members are SCIM user ids (membership ids). */
@Injectable()
export class ScimGroupsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly scimUsers: ScimUsersService,
  ) {}

  private async toScim(db: IamDatabase['sys'] | IamTx, g: GroupRow, withMembers = true) {
    const members = withMembers
      ? await db
          .select({ id: memberships.id, name: users.fullName })
          .from(groupMembers)
          .innerJoin(memberships, eq(memberships.id, groupMembers.membershipId))
          .innerJoin(users, eq(users.id, memberships.userId))
          .where(eq(groupMembers.groupId, g.id))
      : [];
    return {
      schemas: [SCIM.group],
      id: g.id,
      externalId: g.externalId ?? undefined,
      displayName: g.name,
      ...(withMembers ? { members: members.map((m) => ({ value: m.id, display: m.name, $ref: `${this.scimUsers.base()}/Users/${m.id}` })) } : {}),
      meta: { resourceType: 'Group', created: g.createdAt.toISOString(), lastModified: g.updatedAt.toISOString(), location: `${this.scimUsers.base()}/Groups/${g.id}` },
    };
  }

  async list(orgId: string, query: { filter?: string; startIndex?: string; count?: string; excludedAttributes?: string }) {
    const f = parseEqFilter(query.filter, ['displayName', 'externalId']);
    const { offset, limit, startIndex } = paging(query);
    let where: SQL | undefined = eq(groups.orgId, orgId);
    if (f?.attribute === 'displayName') where = and(where, eq(groups.name, f.value));
    if (f?.attribute === 'externalId') where = and(where, eq(groups.externalId, f.value));
    const withMembers = !(query.excludedAttributes ?? '').toLowerCase().split(',').includes('members');
    const [total] = await this.db.sys.select({ n: count() }).from(groups).where(where);
    const rows = await this.db.sys.select().from(groups).where(where).orderBy(asc(groups.createdAt)).limit(limit).offset(offset);
    const resources = [];
    for (const g of rows) resources.push(await this.toScim(this.db.sys, g, withMembers));
    return listResponse(resources, Number(total?.n ?? 0), startIndex);
  }

  async get(orgId: string, id: string) {
    return this.toScim(this.db.sys, await this.find(orgId, id));
  }

  async create(orgId: string, body: unknown) {
    const b = (body ?? {}) as { displayName?: unknown; externalId?: unknown; members?: unknown };
    if (typeof b.displayName !== 'string' || !b.displayName.trim()) throw scimBadRequest('displayName is required');
    const name = b.displayName.trim().slice(0, 160);
    const externalId = typeof b.externalId === 'string' && b.externalId ? b.externalId : null;
    return this.db.system(async (tx) => {
      const [clash] = await tx.select({ id: groups.id }).from(groups).where(and(eq(groups.orgId, orgId), eq(groups.name, name)));
      if (clash) throw scimConflict('A group with that displayName already exists');
      const [g] = await tx.insert(groups).values({ id: newId(), orgId, name, externalId }).returning();
      await this.setMembers(tx, orgId, g!.id, memberIds(b.members));
      await this.changed(tx, orgId, g!.id, 'created');
      return this.toScim(tx, g!);
    });
  }

  async replace(orgId: string, id: string, body: unknown) {
    const g = await this.find(orgId, id);
    const b = (body ?? {}) as { displayName?: unknown; externalId?: unknown; members?: unknown };
    return this.db.system(async (tx) => {
      const name = typeof b.displayName === 'string' && b.displayName.trim() ? b.displayName.trim().slice(0, 160) : g.name;
      await this.rename(tx, orgId, g.id, name);
      await tx.update(groups).set({ name, externalId: typeof b.externalId === 'string' ? b.externalId : g.externalId }).where(eq(groups.id, g.id));
      await this.setMembers(tx, orgId, g.id, memberIds(b.members));
      await this.changed(tx, orgId, g.id, 'updated');
      return this.toScim(tx, (await tx.select().from(groups).where(eq(groups.id, g.id)))[0]!);
    });
  }

  async patch(orgId: string, id: string, body: unknown) {
    const g = await this.find(orgId, id);
    const ops = patchOperations(body);
    return this.db.system(async (tx) => {
      for (const op of ops) {
        const path = (op.path ?? '').toLowerCase();
        if (path === 'displayname' || (!op.path && typeof (op.value as { displayName?: unknown })?.displayName === 'string')) {
          const name = String(path ? op.value : (op.value as { displayName: string }).displayName).trim().slice(0, 160);
          await this.rename(tx, orgId, g.id, name);
          await tx.update(groups).set({ name }).where(eq(groups.id, g.id));
        } else if (path === 'externalid') {
          await tx.update(groups).set({ externalId: op.op === 'remove' ? null : String(op.value) }).where(eq(groups.id, g.id));
        } else if (path === 'members' || path.startsWith('members[') || (!op.path && (op.value as { members?: unknown })?.members)) {
          const filtered = /^members\[value eq "([^"]+)"\]$/i.exec(op.path ?? '');
          const ids = filtered ? [filtered[1]!] : memberIds(op.path ? op.value : (op.value as { members: unknown }).members);
          if (op.op === 'add') await this.addMembers(tx, orgId, g.id, ids);
          else if (op.op === 'remove') {
            if (ids.length === 0) await tx.delete(groupMembers).where(eq(groupMembers.groupId, g.id));
            else await tx.delete(groupMembers).where(and(eq(groupMembers.groupId, g.id), inArray(groupMembers.membershipId, ids)));
          } else await this.setMembers(tx, orgId, g.id, ids);
        } else {
          throw scimBadRequest(`Unsupported path ${op.path}`, 'invalidPath');
        }
      }
      await this.changed(tx, orgId, g.id, 'updated');
      return this.toScim(tx, (await tx.select().from(groups).where(eq(groups.id, g.id)))[0]!);
    });
  }

  async remove(orgId: string, id: string): Promise<void> {
    const g = await this.find(orgId, id);
    await this.db.system(async (tx) => {
      await tx.delete(groups).where(eq(groups.id, g.id));
      await this.changed(tx, orgId, g.id, 'deleted');
    });
  }

  // ---------- helpers ----------

  private async find(orgId: string, id: string): Promise<GroupRow> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw scimNotFound();
    const [g] = await this.db.sys.select().from(groups).where(and(eq(groups.id, id), eq(groups.orgId, orgId)));
    if (!g) throw scimNotFound();
    return g;
  }

  private async rename(tx: IamTx, orgId: string, groupId: string, name: string): Promise<void> {
    const [clash] = await tx.select({ id: groups.id }).from(groups).where(and(eq(groups.orgId, orgId), eq(groups.name, name), ne(groups.id, groupId)));
    if (clash) throw scimConflict('A group with that displayName already exists');
  }

  private async setMembers(tx: IamTx, orgId: string, groupId: string, ids: string[]): Promise<void> {
    await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    await this.addMembers(tx, orgId, groupId, ids);
  }

  /** Only active members of this organisation can be put in its groups. */
  private async addMembers(tx: IamTx, orgId: string, groupId: string, ids: string[]): Promise<void> {
    const unique = [...new Set(ids)].filter((i) => /^[0-9a-f-]{36}$/i.test(i));
    if (unique.length === 0) return;
    const valid = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.orgId, orgId), inArray(memberships.id, unique), inArray(memberships.status, ['active', 'suspended'])));
    if (valid.length !== unique.length) throw scimBadRequest('Some members are not users of this organisation', 'invalidValue');
    await tx
      .insert(groupMembers)
      .values(valid.map((v) => ({ groupId, membershipId: v.id, orgId })))
      .onConflictDoNothing();
  }

  private async changed(tx: IamTx, orgId: string, groupId: string, change: string): Promise<void> {
    await tx.update(scimDirectories).set({ lastSyncAt: sql`now()` }).where(eq(scimDirectories.orgId, orgId));
    await this.outbox.add(tx, { type: IamEvents.GroupChanged, orgId, actor: SYSTEM_ACTOR, requestId: null, payload: { orgId, groupId, change, via: 'scim' } });
  }
}

function memberIds(members: unknown): string[] {
  if (!Array.isArray(members)) return [];
  return members.map((m) => (typeof m === 'string' ? m : String((m as { value?: unknown })?.value ?? ''))).filter(Boolean);
}
