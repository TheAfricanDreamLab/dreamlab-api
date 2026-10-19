import { Inject, Injectable } from '@nestjs/common';
import type { CreateInvitationSchema, Membership } from '@dreamlab/contracts';
import type { Principal } from '@lib/auth';
import { badRequest, conflict, forbidden, newId, notFound, randomToken, sha256 } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { toInvitation } from '../../common/mappers/invitation.mapper';
import { pageResult } from '../../common/mappers/pagination';
import type { IamConfig } from '../../config';
import { IamDatabase, schema } from '../../database';
import { IamEvents } from '../../events';
import { AuthzService } from '../authz/authz.service';
import { MembershipLoader } from '../members/services/membership-loader.service';
import type { Notifier } from '../notifications/interfaces/notifier.interface';
import { NOTIFIER } from '../notifications/notifier.service';
import { UsersRepository } from '../users/users.repository';

type CreateInvitation = z.infer<typeof CreateInvitationSchema>;
const { invitations, memberships, roles, roleAssignments, orgUnits, organizations, users } = schema;

@Injectable()
export class InvitationsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(NOTIFIER) private readonly notifier: Notifier,
    private readonly authz: AuthzService,
    private readonly loader: MembershipLoader,
    private readonly users: UsersRepository,
  ) {}

  async create(principal: Principal, orgId: string, dto: CreateInvitation, meta: RequestMeta) {
    // Unit admins may invite into their own units; everyone else needs the permission org-wide.
    const canOrgWide = await this.authz.can(principal.userId, orgId, 'org.members.invite');
    if (!canOrgWide) {
      const inUnit =
        dto.orgUnitId && (await this.authz.can(principal.userId, orgId, 'org.members.invite', { type: 'org_unit', id: dto.orgUnitId }));
      if (!inUnit) throw forbidden('permission_denied', 'You can only invite into org units you manage');
    }
    const roleKeys = [...new Set(dto.roleKeys)];
    // Granting anything beyond plain learner access needs the right to assign roles.
    if (roleKeys.some((k) => k !== 'learner') && !(await this.authz.can(principal.userId, orgId, 'org.roles.assign'))) {
      throw forbidden('permission_denied', 'Inviting with roles other than learner needs org.roles.assign');
    }
    if (roleKeys.includes('platform_admin')) throw badRequest('role_not_allowed', 'platform_admin cannot be granted by invitation');

    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + this.config.INVITATION_TTL_HOURS * 3600_000);
    const result = await this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const [current] = await tx.select({ status: organizations.status }).from(organizations).where(eq(organizations.id, orgId));
      if (current?.status === 'pending' && roleKeys.some((k) => k !== 'org_admin')) {
        throw conflict('org_pending', 'Your organisation is awaiting approval. Until then you can only invite co-admins.');
      }
      const found = await tx
        .select({ key: roles.key, scopeTypes: roles.scopeTypes })
        .from(roles)
        .where(and(inArray(roles.key, roleKeys), or(isNull(roles.orgId), eq(roles.orgId, orgId))));
      const unknown = roleKeys.filter((k) => !found.some((f) => f.key === k && f.scopeTypes.includes('org')));
      if (unknown.length) throw badRequest('role_not_found', `Roles not assignable org-wide: ${unknown.join(', ')}`);
      if (dto.orgUnitId) {
        const [unit] = await tx.select({ id: orgUnits.id }).from(orgUnits).where(eq(orgUnits.id, dto.orgUnitId));
        if (!unit) throw badRequest('unit_not_found', 'Org unit not found');
      }
      const existingUser = await this.users.findByEmailOrPhone(dto.email ?? null, dto.phone ?? null);
      if (existingUser) {
        const [m] = await tx
          .select({ status: memberships.status })
          .from(memberships)
          .where(and(eq(memberships.userId, existingUser.id), eq(memberships.orgId, orgId)));
        if (m?.status === 'active' || m?.status === 'suspended') throw conflict('already_member', 'That person is already a member');
      }
      // A newer invitation for the same person replaces any pending one.
      await tx
        .update(invitations)
        .set({ status: 'revoked' })
        .where(
          and(
            eq(invitations.status, 'pending'),
            dto.email ? eq(invitations.email, dto.email) : eq(invitations.phone, dto.phone!),
          ),
        );
      const [row] = await tx
        .insert(invitations)
        .values({
          id: newId(),
          orgId,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          roleKeys,
          orgUnitId: dto.orgUnitId ?? null,
          jobTitle: dto.jobTitle ?? null,
          tokenHash: sha256(token),
          invitedByUserId: principal.userId,
          expiresAt,
        })
        .returning();
      await this.outbox.add(tx, {
        type: IamEvents.MemberInvited,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, invitationId: row!.id, roleKeys },
      });
      const [org] = await tx.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId));
      const [inviter] = await tx.select({ name: users.fullName }).from(users).where(eq(users.id, principal.userId));
      return { row: row!, orgName: org?.name ?? '', inviterName: inviter?.name ?? null };
    });

    await this.notifier.sendInvitation({
      channel: dto.email ? 'email' : 'sms',
      destination: (dto.email ?? dto.phone)!,
      orgName: result.orgName,
      inviterName: result.inviterName,
      acceptUrl: `${this.config.PUBLIC_APP_URL}/invitations/accept?token=${token}`,
      expiresAt,
    });
    return toInvitation(result.row);
  }

  async list(principal: Principal, orgId: string, query: { limit: number; cursor?: string; status?: string }) {
    return this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const rows = await tx
        .select()
        .from(invitations)
        .where(
          and(
            this.statusFilter(query.status),
            query.cursor ? gt(invitations.id, query.cursor) : undefined,
          ),
        )
        .orderBy(asc(invitations.id))
        .limit(query.limit + 1);
      return pageResult(rows.map(toInvitation), query.limit);
    });
  }

  /** `expired` is derived: a pending invitation past its expiry. */
  private statusFilter(status?: string) {
    switch (status) {
      case 'pending':
        return and(eq(invitations.status, 'pending'), gt(invitations.expiresAt, sql`now()`));
      case 'expired':
        return and(eq(invitations.status, 'pending'), lte(invitations.expiresAt, sql`now()`));
      case 'accepted':
      case 'revoked':
        return eq(invitations.status, status);
      default:
        return undefined;
    }
  }

  async revoke(principal: Principal, orgId: string, invitationId: string): Promise<void> {
    await this.db.tenant({ orgId, userId: principal.userId }, async (tx) => {
      const updated = await tx
        .update(invitations)
        .set({ status: 'revoked' })
        .where(and(eq(invitations.id, invitationId), eq(invitations.status, 'pending')))
        .returning({ id: invitations.id });
      if (updated.length === 0) throw notFound('invitation_not_found', 'Pending invitation not found');
    });
  }

  /** The signed-in user's verified email or phone must match the invitation. */
  async accept(principal: Principal, token: string, meta: RequestMeta): Promise<Membership> {
    const user = await this.users.findById(principal.userId);
    if (!user) throw notFound('user_not_found', 'User not found');
    return this.db.system(async (tx) => {
      const [inv] = await tx.select().from(invitations).where(eq(invitations.tokenHash, sha256(token))).for('update');
      if (!inv || inv.status === 'revoked') throw notFound('invitation_not_found', 'Invitation not found');
      if (inv.status === 'accepted') throw conflict('invitation_used', 'This invitation has already been used');
      if (inv.expiresAt.getTime() < Date.now()) throw conflict('invitation_expired', 'This invitation has expired; ask for a new one');
      const emailMatch = inv.email !== null && user.email !== null && inv.email.toLowerCase() === user.email.toLowerCase() && user.emailVerifiedAt !== null;
      const phoneMatch = inv.phone !== null && inv.phone === user.phone && user.phoneVerifiedAt !== null;
      if (!emailMatch && !phoneMatch) {
        throw forbidden('invitation_identity_mismatch', 'This invitation was sent to a different, or unverified, email or phone');
      }

      const [existing] = await tx
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, user.id), eq(memberships.orgId, inv.orgId)));
      if (existing && (existing.status === 'active' || existing.status === 'suspended')) {
        throw conflict('already_member', 'You are already a member of this organisation');
      }
      const membershipId = existing?.id ?? newId();
      const values = { status: 'active' as const, source: 'invite' as const, orgUnitId: inv.orgUnitId, jobTitle: inv.jobTitle, joinedAt: new Date() };
      if (existing) await tx.update(memberships).set(values).where(eq(memberships.id, membershipId));
      else await tx.insert(memberships).values({ id: membershipId, userId: user.id, orgId: inv.orgId, ...values });

      const roleRows = await tx
        .select({ id: roles.id, key: roles.key })
        .from(roles)
        .where(and(inArray(roles.key, inv.roleKeys), or(isNull(roles.orgId), eq(roles.orgId, inv.orgId))));
      if (roleRows.length) {
        await tx
          .insert(roleAssignments)
          .values(
            roleRows.map((r) => ({
              id: newId(),
              orgId: inv.orgId,
              membershipId,
              roleId: r.id,
              scopeType: 'org' as const,
              grantedByUserId: inv.invitedByUserId,
            })),
          )
          .onConflictDoNothing();
      }
      await tx.update(invitations).set({ status: 'accepted', acceptedMembershipId: membershipId }).where(eq(invitations.id, inv.id));
      await this.authz.bumpVersion(tx, [user.id]);
      await this.outbox.add(
        tx,
        {
          type: IamEvents.MemberJoined,
          orgId: inv.orgId,
          actor: userActor(user.id),
          requestId: meta.requestId,
          payload: { orgId: inv.orgId, membershipId, userId: user.id, invitationId: inv.id },
        },
        ...roleRows.map((r) => ({
          type: IamEvents.RoleGranted,
          orgId: inv.orgId,
          actor: userActor(inv.invitedByUserId),
          requestId: meta.requestId,
          payload: { orgId: inv.orgId, membershipId, userId: user.id, roleKey: r.key, scopeType: 'org' },
        })),
      );
      return (await this.loader.loadOne(tx, inv.orgId, membershipId))!;
    });
  }
}
