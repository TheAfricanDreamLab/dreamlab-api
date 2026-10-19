import { Injectable } from '@nestjs/common';
import type { Membership } from '@dreamlab/contracts';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { IamTx, schema } from '../../database';
import { AssignmentView, toMembership } from './mappers';

const { memberships, users, roleAssignments, roles } = schema;

/** Loads memberships with their user and role assignments, in the caller's transaction. */
@Injectable()
export class MembershipLoader {
  async assignments(tx: IamTx, membershipIds: string[]): Promise<Map<string, AssignmentView[]>> {
    const byMembership = new Map<string, AssignmentView[]>();
    if (membershipIds.length === 0) return byMembership;
    const rows = await tx
      .select({
        id: roleAssignments.id,
        membershipId: roleAssignments.membershipId,
        roleKey: roles.key,
        scopeType: roleAssignments.scopeType,
        scopeId: roleAssignments.scopeId,
        startsAt: roleAssignments.startsAt,
        endsAt: roleAssignments.endsAt,
        createdAt: roleAssignments.createdAt,
      })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(inArray(roleAssignments.membershipId, membershipIds))
      .orderBy(asc(roleAssignments.createdAt));
    for (const row of rows) {
      const list = byMembership.get(row.membershipId) ?? [];
      list.push(row);
      byMembership.set(row.membershipId, list);
    }
    return byMembership;
  }

  async load(tx: IamTx, membershipIds: string[]): Promise<Membership[]> {
    if (membershipIds.length === 0) return [];
    const rows = await tx
      .select({ m: memberships, u: { id: users.id, fullName: users.fullName, email: users.email, phone: users.phone } })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(inArray(memberships.id, membershipIds));
    const assignments = await this.assignments(tx, membershipIds);
    const byId = new Map(rows.map((r) => [r.m.id, toMembership(r.m, r.u, assignments.get(r.m.id) ?? [])]));
    return membershipIds.map((id) => byId.get(id)).filter((m): m is Membership => Boolean(m));
  }

  async loadOne(tx: IamTx, orgId: string, membershipId: string): Promise<Membership | null> {
    const [row] = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(and(eq(memberships.id, membershipId), eq(memberships.orgId, orgId)));
    if (!row) return null;
    const [m] = await this.load(tx, [row.id]);
    return m ?? null;
  }
}
