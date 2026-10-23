import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Principal } from '@lib/auth';
import { AppException, badRequest, conflict, forbidden, newId, notFound, randomToken } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { and, asc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import { toPublicOrganization } from '../../common/mappers/organization.mapper';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { IamDatabase, IamTx, schema } from '../../database';
import { IamEvents } from '../../events';
import { emailDomain, PUBLIC_EMAIL_DOMAINS } from '../auth/utils/email-domain';
import { AuthzService } from '../authz/authz.service';
import { lockUserRow, UsersRepository } from '../users/users.repository';
import { hasVerificationRecord, TRUST_ALL_DOMAINS, TxtLookup, verificationRecordName, verificationRecordValue } from './utils/dns-txt';

export const TXT_LOOKUP = Symbol('TXT_LOOKUP');
const MAX_DOMAINS = 20;
const { orgDomains, organizations, memberships, roleAssignments, roles } = schema;
type DomainRow = typeof orgDomains.$inferSelect;

export function toDomain(row: DomainRow) {
  return {
    id: row.id,
    domain: row.domain,
    verified: row.verifiedAt !== null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    joinPolicy: row.joinPolicy,
    verification: { recordType: 'TXT' as const, recordName: verificationRecordName(row.domain), recordValue: verificationRecordValue(row.verificationToken) },
    createdAt: row.createdAt.toISOString(),
  };
}

/** Email domains (IAM-14): claim, verify through DNS, and let people with that address join. */
@Injectable()
export class DomainsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    @Inject(TXT_LOOKUP) private readonly lookup: TxtLookup | typeof TRUST_ALL_DOMAINS,
    private readonly users: UsersRepository,
    private readonly authz: AuthzService,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

  async list(principal: Principal, orgId: string) {
    const rows = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select().from(orgDomains).orderBy(asc(orgDomains.domain)));
    return { items: rows.map(toDomain) };
  }

  async add(principal: Principal, orgId: string, domain: string) {
    if (PUBLIC_EMAIL_DOMAINS.has(domain)) {
      throw badRequest('domain_public', 'That is a public email provider. Add a domain your organisation owns.', { fields: ['domain'] });
    }
    const taken = await this.db.sys
      .select({ id: orgDomains.id })
      .from(orgDomains)
      .where(and(eq(orgDomains.domain, domain), isNotNull(orgDomains.verifiedAt), ne(orgDomains.orgId, orgId)));
    if (taken.length > 0) throw conflict('domain_taken', 'Another organisation has already verified this domain.');
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const existing = await tx.select({ id: orgDomains.id }).from(orgDomains);
      if (existing.length >= MAX_DOMAINS) throw conflict('domain_limit', `An organisation can have up to ${MAX_DOMAINS} domains.`);
      const rows = await tx
        .insert(orgDomains)
        .values({ id: newId(), orgId, domain, verificationToken: randomToken(24) })
        .onConflictDoNothing()
        .returning();
      if (rows.length === 0) throw conflict('domain_exists', 'You have already added this domain.');
      return toDomain(rows[0]!);
    });
  }

  /** Look the TXT record up through public resolvers; only one organisation can hold a domain verified. */
  async verify(principal: Principal, orgId: string, domainId: string, meta: RequestMeta) {
    const row = await this.find(principal, orgId, domainId);
    if (row.verifiedAt) return toDomain(row);
    const found = this.lookup === TRUST_ALL_DOMAINS || (await hasVerificationRecord(this.lookup, row.domain, row.verificationToken));
    if (!found) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'domain_record_missing',
        `We couldn’t find the TXT record yet. Add it at ${verificationRecordName(row.domain)} and try again; DNS changes can take a few minutes.`,
      );
    }
    try {
      return await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
        const [updated] = await tx.update(orgDomains).set({ verifiedAt: new Date() }).where(eq(orgDomains.id, domainId)).returning();
        await this.event(tx, principal, orgId, meta, IamEvents.DomainVerified, { orgId, domainId, domain: row.domain });
        return toDomain(updated!);
      });
    } catch (err) {
      if (String((err as { code?: string }).code) === '23505') throw conflict('domain_taken', 'Another organisation has already verified this domain.');
      throw err;
    }
  }

  async update(principal: Principal, orgId: string, domainId: string, joinPolicy: DomainRow['joinPolicy']) {
    const row = await this.find(principal, orgId, domainId);
    if (joinPolicy !== 'none' && !row.verifiedAt) throw conflict('domain_unverified', 'Verify the domain before letting people join with it.');
    return this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const [updated] = await tx.update(orgDomains).set({ joinPolicy }).where(eq(orgDomains.id, domainId)).returning();
      return toDomain(updated!);
    });
  }

  async remove(principal: Principal, orgId: string, domainId: string): Promise<void> {
    await this.find(principal, orgId, domainId);
    await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.delete(orgDomains).where(eq(orgDomains.id, domainId)));
  }

  /** Organisations the user may join because their verified email is at one of the organisation's verified domains. */
  async joinable(principal: Principal) {
    const user = await this.users.findById(principal.userId);
    const domain = user?.email && user.emailVerifiedAt ? emailDomain(user.email) : null;
    if (!domain) return { items: [] };
    const rows = await this.db.sys
      .select({ o: organizations, policy: orgDomains.joinPolicy, domain: orgDomains.domain })
      .from(orgDomains)
      .innerJoin(organizations, eq(organizations.id, orgDomains.orgId))
      .where(and(eq(orgDomains.domain, domain), isNotNull(orgDomains.verifiedAt), inArray(orgDomains.joinPolicy, ['request', 'auto']), eq(organizations.status, 'active')));
    const mine = await this.db.sys
      .select({ orgId: memberships.orgId })
      .from(memberships)
      .where(and(eq(memberships.userId, principal.userId), inArray(memberships.status, ['active', 'requested', 'invited', 'suspended'])));
    const already = new Set(mine.map((m) => m.orgId));
    return {
      items: rows
        .filter((r) => !already.has(r.o.id))
        .map((r) => ({ org: toPublicOrganization(r.o), joinPolicy: r.policy as 'request' | 'auto', domain: r.domain })),
    };
  }

  /** auto: join as a learner at once. request: an admin approves from the People page. */
  async join(principal: Principal, orgId: string, meta: RequestMeta) {
    const offer = (await this.joinable(principal)).items.find((i) => i.org.id === orgId);
    if (!offer) throw forbidden('join_not_allowed', 'Your email address doesn’t let you join this organisation.');
    const status = offer.joinPolicy === 'auto' ? ('active' as const) : ('requested' as const);
    return this.db.system(async (tx) => {
      await lockUserRow(tx, principal.userId);
      const membershipId = newId();
      const inserted = await tx
        .insert(memberships)
        .values({ id: membershipId, userId: principal.userId, orgId, status, source: 'domain', joinedAt: status === 'active' ? new Date() : null })
        .onConflictDoNothing()
        .returning({ id: memberships.id });
      if (inserted.length === 0) throw conflict('already_member', 'You are already in this organisation.');
      if (status === 'active') {
        const [learner] = await tx.select({ id: roles.id }).from(roles).where(and(eq(roles.key, 'learner'), eq(roles.system, true)));
        await tx.insert(roleAssignments).values({ id: newId(), orgId, membershipId, roleId: learner!.id, scopeType: 'org', grantedByUserId: principal.userId });
        await this.authz.bumpVersion(tx, [principal.userId]);
      }
      await this.outbox.add(tx, {
        type: status === 'active' ? IamEvents.MemberJoined : IamEvents.MemberUpdated,
        orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId, membershipId, userId: principal.userId, via: 'domain', status },
      });
      return { status, membershipId };
    });
  }

  private async find(principal: Principal, orgId: string, domainId: string): Promise<DomainRow> {
    const [row] = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select().from(orgDomains).where(eq(orgDomains.id, domainId)));
    if (!row) throw notFound('domain_not_found', 'Domain not found');
    return row;
  }

  private async event(tx: IamTx, principal: Principal, orgId: string, meta: RequestMeta, type: string, payload: Record<string, unknown>) {
    await this.outbox.add(tx, { type, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload });
  }
}
