import { Injectable } from '@nestjs/common';
import type { Membership, Permission } from '@dreamlab/contracts';
import type { AssignRoleSchema, MemberListQuerySchema, UpdateMembershipSchema } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, likeContains, newId, notFound } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, count, eq, gt, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { toAssignment } from '../../common/mappers/membership.mapper';
import { pageResult } from '../../common/mappers/pagination';
import type { IamConfig } from '../../config';
import { IamDatabase, IamTx, schema } from '../../database';
import { IamEvents } from '../../events';
import { activeAssignment, AuthzService } from '../authz/authz.service';
import { MembershipLoader } from './services/membership-loader.service';

const { memberships, users, roleAssignments, roles, orgUnits, groups, organizations } = schema;
type ListQuery = z.infer<typeof MemberListQuerySchema>;
type UpdateMembership = z.infer<typeof UpdateMembershipSchema>;
type AssignRole = z.infer<typeof AssignRoleSchema>;

@Injectable()
export class MembersService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly authz: AuthzService,
    private readonly loader: MembershipLoader,
  ) {}

  /** Org-wide readers see everyone; unit admins see their units and every unit below. */
  async list(principal: Principal, orgId: string, query: ListQuery) {
    const reach = await this.authz.unitReach(principal.userId, orgId, 'org.members.read');
    if (reach !== 'all' && reach.length === 0) throw forbidden('permission_denied', 'Missing permission: org.members.read');
    return this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const rows = await tx
        .select({ id: memberships.id })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(
            eq(memberships.orgId, orgId),
            query.status ? eq(memberships.status, query.status) : ne(memberships.status, 'left'),
            query.orgUnitId ? eq(memberships.orgUnitId, query.orgUnitId) : undefined,
            query.cursor ? gt(memberships.id, query.cursor) : undefined,
            query.q ? or(ilike(users.fullName, likeContains(query.q)), ilike(users.email, likeContains(query.q)), ilike(users.phone, likeContains(query.q))) : undefined,
            reach === 'all' ? undefined : this.withinUnits(reach),
          ),
        )
        .orderBy(asc(memberships.id))
        .limit(query.limit + 1);
      const page = pageResult(rows, query.limit);
      return { items: await this.loader.load(tx, page.items.map((r) => r.id)), nextCursor: page.nextCursor };
    });
  }

  async get(principal: Principal, orgId: string, membershipId: string): Promise<Membership> {
    return this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const member = await this.loader.loadOne(tx, orgId, membershipId);
      if (!member) throw notFound('member_not_found', 'Member not found');
      await this.assertUnitPermission(principal, orgId, 'org.members.read', member.orgUnitId);
      return member;
    });
  }

  async update(principal: Principal, orgId: string, membershipId: string, dto: UpdateMembership, meta: RequestMeta) {
    return this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [current] = await tx.select().from(memberships).where(eq(memberships.id, membershipId));
      if (!current || current.status === 'left') throw notFound('member_not_found', 'Member not found');
      await this.assertUnitPermission(principal, orgId, 'org.members.update', current.orgUnitId);
      if (dto.orgUnitId) {
        const [unit] = await tx.select({ id: orgUnits.id }).from(orgUnits).where(eq(orgUnits.id, dto.orgUnitId));
        if (!unit) throw badRequest('unit_not_found', 'Org unit not found');
        await this.assertUnitPermission(principal, orgId, 'org.members.update', dto.orgUnitId);
      }
      if (dto.status !== undefined || dto.orgUnitId !== undefined) await this.assertOutranks(tx, principal, orgId, membershipId);
      if (dto.status === 'suspended' && current.userId === principal.userId) {
        throw badRequest('cannot_suspend_self', 'You cannot suspend yourself');
      }
      if (dto.status === 'suspended') await this.assertNotLastAdmin(tx, orgId, membershipId);
      await tx.update(memberships).set(dto).where(eq(memberships.id, membershipId));
      if (dto.status !== undefined || dto.orgUnitId !== undefined) await this.authz.bumpVersion(tx, [current.userId]);
      await this.outbox.add(tx, {
        type: IamEvents.MemberUpdated,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, membershipId, userId: current.userId, changed: Object.keys(dto) },
      });
      return (await this.loader.loadOne(tx, orgId, membershipId))!;
    });
  }

  /** Learning records stay with the person; only the membership ends. */
  async remove(principal: Principal, orgId: string, membershipId: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [current] = await tx.select().from(memberships).where(eq(memberships.id, membershipId));
      if (!current || current.status === 'left') throw notFound('member_not_found', 'Member not found');
      await this.assertOutranks(tx, principal, orgId, membershipId);
      await this.assertNotLastAdmin(tx, orgId, membershipId);
      await tx.update(memberships).set({ status: 'left' }).where(eq(memberships.id, membershipId));
      await tx.delete(roleAssignments).where(eq(roleAssignments.membershipId, membershipId));
      await tx.delete(schema.groupMembers).where(eq(schema.groupMembers.membershipId, membershipId));
      await this.authz.bumpVersion(tx, [current.userId]);
      await this.outbox.add(tx, {
        type: IamEvents.MemberRemoved,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, membershipId, userId: current.userId },
      });
    });
  }

  /** Suspending, moving or removing someone needs every permission they hold (no acting on people above you). */
  private async assertOutranks(tx: IamTx, principal: Principal, orgId: string, membershipId: string): Promise<void> {
    const held = await tx
      .select({ permissions: roles.permissions })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(and(eq(roleAssignments.membershipId, membershipId), activeAssignment()));
    await this.authz.assertMayGrant(principal.userId, orgId, held.flatMap((h) => h.permissions));
  }

  async assignRole(principal: Principal, orgId: string, membershipId: string, dto: AssignRole, meta: RequestMeta) {
    return this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [member] = await tx.select().from(memberships).where(eq(memberships.id, membershipId));
      if (!member || member.status !== 'active') throw notFound('member_not_found', 'Active member not found');
      const [role] = await tx
        .select()
        .from(roles)
        .where(and(eq(roles.key, dto.roleKey), or(isNull(roles.orgId), eq(roles.orgId, orgId))));
      if (!role) throw badRequest('role_not_found', `Unknown role: ${dto.roleKey}`);
      if (!role.scopeTypes.includes(dto.scopeType)) {
        throw badRequest('scope_not_allowed', `Role ${role.key} can be assigned at: ${role.scopeTypes.join(', ')}`);
      }
      if (role.key === 'platform_admin') await this.assertPlatformOrg(tx, orgId, principal);
      else await this.authz.assertMayGrant(principal.userId, orgId, role.permissions);
      const scopeId = dto.scopeType === 'org' ? null : dto.scopeId;
      if (dto.scopeType !== 'org' && !scopeId) throw badRequest('scope_id_required', 'scopeId is required for this scope');
      if (dto.scopeType === 'org_unit') {
        const [unit] = await tx.select({ id: orgUnits.id }).from(orgUnits).where(eq(orgUnits.id, scopeId!));
        if (!unit) throw badRequest('unit_not_found', 'Org unit not found');
      }
      if (dto.scopeType === 'group') {
        const [group] = await tx.select({ id: groups.id }).from(groups).where(eq(groups.id, scopeId!));
        if (!group) throw badRequest('group_not_found', 'Group not found');
      }
      const inserted = await tx
        .insert(roleAssignments)
        .values({
          id: newId(),
          orgId,
          membershipId,
          roleId: role.id,
          scopeType: dto.scopeType,
          scopeId,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          grantedByUserId: principal.userId,
        })
        .onConflictDoNothing()
        .returning();
      if (inserted.length === 0) throw conflict('role_already_assigned', 'This role is already assigned at that scope');
      await this.authz.bumpVersion(tx, [member.userId]);
      await this.outbox.add(tx, {
        type: IamEvents.RoleGranted,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, membershipId, userId: member.userId, roleKey: role.key, scopeType: dto.scopeType, scopeId },
      });
      const a = inserted[0]!;
      return toAssignment({ ...a, roleKey: role.key });
    });
  }

  async revokeRole(principal: Principal, orgId: string, assignmentId: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [row] = await tx
        .select({ a: roleAssignments, roleKey: roles.key, userId: memberships.userId })
        .from(roleAssignments)
        .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
        .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
        .where(eq(roleAssignments.id, assignmentId));
      if (!row) throw notFound('assignment_not_found', 'Role assignment not found');
      if (row.roleKey === 'org_admin' && row.a.scopeType === 'org') await this.assertNotLastAdmin(tx, orgId, row.a.membershipId);
      await tx.delete(roleAssignments).where(eq(roleAssignments.id, assignmentId));
      await this.authz.bumpVersion(tx, [row.userId]);
      await this.outbox.add(tx, {
        type: IamEvents.RoleRevoked,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, membershipId: row.a.membershipId, userId: row.userId, roleKey: row.roleKey, scopeType: row.a.scopeType, scopeId: row.a.scopeId },
      });
    });
  }

  async listRoles(principal: Principal) {
    const rows = await this.db.sys
      .select()
      .from(roles)
      .where(principal.orgId ? or(isNull(roles.orgId), eq(roles.orgId, principal.orgId)) : isNull(roles.orgId))
      .orderBy(asc(roles.key));
    return {
      items: rows.map((r) => ({
        key: r.key,
        name: r.name,
        description: r.description,
        scopeTypes: r.scopeTypes as never,
        permissions: r.permissions as never,
        system: r.system,
      })),
    };
  }

  /** Org-wide holders pass; unit-scoped holders pass only for members in their subtree. */
  async assertUnitPermission(principal: Principal, orgId: string, permission: Permission, unitId: string | null): Promise<void> {
    if (await this.authz.can(principal.userId, orgId, permission)) return;
    if (unitId && (await this.authz.can(principal.userId, orgId, permission, { type: 'org_unit', id: unitId }))) return;
    throw forbidden('permission_denied', `Missing permission: ${permission}`);
  }

  /** Every organisation keeps at least one active org admin. */
  private async assertNotLastAdmin(tx: IamTx, orgId: string, membershipId: string): Promise<void> {
    const admins = await tx
      .select({ membershipId: roleAssignments.membershipId })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .innerJoin(memberships, eq(memberships.id, roleAssignments.membershipId))
      .where(and(eq(roleAssignments.orgId, orgId), eq(roles.key, 'org_admin'), eq(roleAssignments.scopeType, 'org'), eq(memberships.status, 'active')));
    const ids = new Set(admins.map((a) => a.membershipId));
    if (ids.has(membershipId) && ids.size === 1) {
      throw conflict('last_admin', 'An organisation must keep at least one admin. Make someone else an admin first.');
    }
  }

  private async assertPlatformOrg(tx: IamTx, orgId: string, principal: Principal): Promise<void> {
    const [org] = await tx.select({ slug: organizations.slug }).from(organizations).where(eq(organizations.id, orgId));
    if (org?.slug !== this.config.PLATFORM_ORG_SLUG || !principal.platformAdmin) {
      throw forbidden('permission_denied', 'platform_admin can only be granted in the platform organisation, by a platform admin');
    }
  }

  private withinUnits(paths: string[]) {
    return inArray(
      memberships.orgUnitId,
      sql`(select ${orgUnits.id} from ${orgUnits} where ${orgUnits.path} <@ array[${sql.join(
        paths.map((p) => sql`${p}::ltree`),
        sql`, `,
      )}])`,
    );
  }

  async countActiveMembers(tx: IamTx, orgId: string): Promise<number> {
    const [row] = await tx.select({ n: count() }).from(memberships).where(and(eq(memberships.orgId, orgId), eq(memberships.status, 'active')));
    return row?.n ?? 0;
  }
}
