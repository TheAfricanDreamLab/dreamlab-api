import { Injectable } from '@nestjs/common';
import { CUSTOM_ROLE_PERMISSIONS, isSystemRoleKey, Permission, ScopeType } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, count, eq, isNull, or } from 'drizzle-orm';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { IamDatabase, IamTx, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { AuthzService } from '../../authz/authz.service';
import { slugify } from '../../organizations/utils/slug';

const { roles, roleAssignments, memberships } = schema;
const MAX_CUSTOM_ROLES = 50;
type RoleRow = typeof roles.$inferSelect;

export const toRole = (r: RoleRow) => ({
  key: r.key,
  name: r.name,
  description: r.description,
  scopeTypes: r.scopeTypes as ScopeType[],
  permissions: r.permissions as Permission[],
  system: r.system,
});

/** Enterprise custom roles (IAM-18): bundles of permissions an organisation defines for itself. */
@Injectable()
export class OrgRolesService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly authz: AuthzService,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

  async list(principal: Principal, orgId: string) {
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const rows = await tx
        .select({ r: roles, n: count(roleAssignments.id) })
        .from(roles)
        .leftJoin(roleAssignments, and(eq(roleAssignments.roleId, roles.id), eq(roleAssignments.orgId, orgId)))
        .where(or(isNull(roles.orgId), eq(roles.orgId, orgId)))
        .groupBy(roles.id)
        .orderBy(asc(roles.system), asc(roles.name));
      return { items: rows.filter((x) => x.r.key !== 'platform_admin').map((x) => ({ ...toRole(x.r), assignedCount: Number(x.n) })) };
    });
  }

  async create(
    principal: Principal,
    orgId: string,
    dto: { key?: string; name: string; description: string; scopeTypes: ScopeType[]; permissions: Permission[] },
    meta: RequestMeta,
  ) {
    const key = dto.key ?? slugify(dto.name).replace(/-/g, '_').replace(/^[^a-z]+/, '').slice(0, 64);
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(key)) throw badRequest('role_key_invalid', 'Give the role a name that starts with a letter', { fields: ['key'] });
    if (isSystemRoleKey(key)) throw conflict('role_key_reserved', 'That name belongs to a built-in role. Choose another.');
    const permissions = this.checkPermissions(dto.permissions);
    await this.authz.assertMayGrant(principal.userId, orgId, permissions);
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const [n] = await tx.select({ n: count() }).from(roles).where(eq(roles.orgId, orgId));
      if (Number(n?.n ?? 0) >= MAX_CUSTOM_ROLES) throw conflict('role_limit', `An organisation can have up to ${MAX_CUSTOM_ROLES} custom roles.`);
      const rows = await tx
        .insert(roles)
        .values({ id: newId(), orgId, key, name: dto.name, description: dto.description, scopeTypes: [...new Set(dto.scopeTypes)], permissions, system: false })
        .onConflictDoNothing()
        .returning();
      if (rows.length === 0) throw conflict('role_exists', 'A role with that name already exists.');
      await this.event(tx, principal, orgId, meta, { roleKey: key, change: 'created' });
      return toRole(rows[0]!);
    });
  }

  async update(
    principal: Principal,
    orgId: string,
    key: string,
    dto: Partial<{ name: string; description: string; scopeTypes: ScopeType[]; permissions: Permission[] }>,
    meta: RequestMeta,
  ) {
    const patch: Partial<RoleRow> = { ...dto };
    if (dto.permissions) {
      patch.permissions = this.checkPermissions(dto.permissions);
      await this.authz.assertMayGrant(principal.userId, orgId, patch.permissions);
    }
    if (dto.scopeTypes) patch.scopeTypes = [...new Set(dto.scopeTypes)];
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const [row] = await tx.update(roles).set(patch).where(and(eq(roles.orgId, orgId), eq(roles.key, key))).returning();
      if (!row) throw notFound('role_not_found', 'Custom role not found');
      // Holders' cached grants and tokens must pick up the new permissions at once.
      if (dto.permissions || dto.scopeTypes) await this.authz.bumpVersion(tx, await this.holders(tx, row.id));
      await this.event(tx, principal, orgId, meta, { roleKey: key, change: 'updated' });
      return toRole(row);
    });
  }

  async remove(principal: Principal, orgId: string, key: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const [row] = await tx.select().from(roles).where(and(eq(roles.orgId, orgId), eq(roles.key, key)));
      if (!row) throw notFound('role_not_found', 'Custom role not found');
      const holders = await this.holders(tx, row.id);
      if (holders.length > 0) throw conflict('role_in_use', `${holders.length} ${holders.length === 1 ? 'person holds' : 'people hold'} this role. Take it away from them first.`);
      const [sso] = await tx.select({ id: schema.ssoConnections.id }).from(schema.ssoConnections).where(eq(schema.ssoConnections.defaultRoleKey, key));
      if (sso) throw conflict('role_in_use', 'Single sign-on gives this role to new people. Choose another default role first.');
      await tx.delete(roles).where(eq(roles.id, row.id));
      await this.event(tx, principal, orgId, meta, { roleKey: key, change: 'deleted' });
    });
  }

  private checkPermissions(permissions: Permission[]): Permission[] {
    const unique = [...new Set(permissions)];
    const bad = unique.filter((p) => !CUSTOM_ROLE_PERMISSIONS.includes(p));
    if (bad.length > 0) throw badRequest('permission_not_allowed', `Custom roles cannot include: ${bad.join(', ')}`, { fields: ['permissions'] });
    return unique.sort();
  }

  private async holders(tx: IamTx, roleId: string): Promise<string[]> {
    const rows = await tx
      .selectDistinct({ userId: memberships.userId })
      .from(roleAssignments)
      .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
      .where(eq(roleAssignments.roleId, roleId));
    return rows.map((r) => r.userId);
  }

  private async event(tx: IamTx, principal: Principal, orgId: string, meta: RequestMeta, payload: Record<string, unknown>) {
    await this.outbox.add(tx, { type: IamEvents.RoleChanged, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload: { orgId, ...payload } });
  }
}
