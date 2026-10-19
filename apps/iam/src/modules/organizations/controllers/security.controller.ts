import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract, SecurityPolicySchema, UpdateSecurityPolicySchema } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { conflict, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { eq } from 'drizzle-orm';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { IamDatabase, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { OrgParamsDto } from '../dto/org-params.dto';

class SecurityPolicyDto extends createZodDto(SecurityPolicySchema) {}
class UpdateSecurityPolicyDto extends createZodDto(UpdateSecurityPolicySchema) {}

const r = apiV1Contract.enterprise;
const { organizations } = schema;

/** The organisation's security policy (IAM-19): whether admin actions need a second factor. */
@ApiTags('enterprise')
@Controller('v1/orgs/:orgId/security')
export class SecurityController {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
  ) {}

  @Get()
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.getSecurity.summary })
  @ZodResponse({ status: 200, type: SecurityPolicyDto })
  async get(@Param() p: OrgParamsDto) {
    const [org] = await this.db.sys.select({ requireAdminMfa: organizations.requireAdminMfa }).from(organizations).where(eq(organizations.id, p.orgId));
    if (!org) throw notFound('org_not_found', 'Organisation not found');
    return org;
  }

  @Patch()
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.updateSecurity.summary })
  @ZodResponse({ status: 200, type: SecurityPolicyDto })
  async update(@Param() p: OrgParamsDto, @Body() dto: UpdateSecurityPolicyDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    // Requiring a second factor you have not passed yourself would lock you out of these settings.
    if (dto.requireAdminMfa && !principal.amr.includes('mfa')) {
      throw conflict('mfa_needed_first', 'Add an authenticator app to your account and confirm a code first, then require it for admins.');
    }
    return this.db.system(async (tx) => {
      const [org] = await tx.update(organizations).set(dto).where(eq(organizations.id, p.orgId)).returning({ requireAdminMfa: organizations.requireAdminMfa });
      if (!org) throw notFound('org_not_found', 'Organisation not found');
      await this.outbox.add(tx, {
        type: IamEvents.SecurityPolicyChanged,
        orgId: p.orgId,
        actor: userActor(principal.userId),
        requestId: meta.requestId,
        payload: { orgId: p.orgId, ...dto },
      });
      return org;
    });
  }
}
