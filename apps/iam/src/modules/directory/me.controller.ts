import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ZodResponse } from 'nestjs-zod';
import { MeDto } from '../../common/dto';
import { IamDatabase, schema } from '../../database';
import { AuthzService } from '../authz/authz.service';
import { toAssignment, toPublicOrganization } from './mappers';
import { MembershipLoader } from './membership-loader';

const { users, memberships, organizations } = schema;

@ApiTags('me')
@Controller('v1/me')
export class MeController {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    private readonly loader: MembershipLoader,
  ) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: apiV1Contract.me.me.summary })
  @ZodResponse({ status: 200, type: MeDto })
  async me(@CurrentPrincipal() principal: Principal) {
    // A person's own memberships span organisations, so this read is deliberately cross-tenant.
    return this.db.system(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, principal.userId));
      if (!user) throw notFound('user_not_found', 'User not found');
      const rows = await tx
        .select({ m: memberships, o: organizations })
        .from(memberships)
        .innerJoin(organizations, eq(organizations.id, memberships.orgId))
        .where(and(eq(memberships.userId, user.id), inArray(memberships.status, ['active', 'suspended', 'invited'])))
        .orderBy(asc(organizations.name));
      const assignments = await this.loader.assignments(tx, rows.map((r) => r.m.id));
      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerifiedAt !== null,
          phoneVerified: user.phoneVerifiedAt !== null,
          locale: user.locale,
          createdAt: user.createdAt.toISOString(),
        },
        context: { orgId: principal.orgId, membershipId: principal.membershipId },
        platformAdmin: principal.platformAdmin,
        permissions: AuthzService.effectivePermissions(principal),
        memberships: rows.map((r) => ({
          membershipId: r.m.id,
          status: r.m.status,
          org: toPublicOrganization(r.o),
          roles: (assignments.get(r.m.id) ?? []).map(toAssignment),
        })),
      };
    });
  }
}
