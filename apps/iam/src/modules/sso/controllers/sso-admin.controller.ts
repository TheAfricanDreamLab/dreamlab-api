import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract, SaveSsoConnectionSchema } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod';
import type { z } from 'zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { OrgParamsDto } from '../../organizations/dto/org-params.dto';
import { SsoConnectionDto, SsoSettingsDto, UpdateSsoConnectionDto } from '../dto/sso.dto';
import { SsoConnectionsService } from '../services/sso-connections.service';

const r = apiV1Contract.enterprise;

@ApiTags('enterprise')
@Controller('v1/orgs/:orgId/sso')
export class SsoAdminController {
  constructor(private readonly connections: SsoConnectionsService) {}

  @Get()
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.getSso.summary })
  @ZodResponse({ status: 200, type: SsoSettingsDto })
  get(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.connections.get(principal, p.orgId);
  }

  @Put()
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.saveSso.summary })
  // A discriminated union (oidc | saml) cannot be a DTO class, so the body is validated by schema.
  @ApiBody({ description: 'OIDC: { protocol: "oidc", issuer, clientId, clientSecret? }. SAML: { protocol: "saml", idpEntityId, idpSsoUrl, certificate }.' })
  @ZodResponse({ status: 200, type: SsoConnectionDto })
  save(
    @Param() p: OrgParamsDto,
    @Body(new ZodValidationPipe(SaveSsoConnectionSchema)) dto: z.infer<typeof SaveSsoConnectionSchema>,
    @CurrentPrincipal() principal: Principal,
    @Meta() meta: RequestMeta,
  ) {
    return this.connections.save(principal, p.orgId, dto, meta);
  }

  @Patch()
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.updateSso.summary })
  @ZodResponse({ status: 200, type: SsoConnectionDto })
  update(@Param() p: OrgParamsDto, @Body() dto: UpdateSsoConnectionDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.connections.update(principal, p.orgId, dto, meta);
  }

  @Delete()
  @RequirePermission('org.security.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.deleteSso.summary })
  async remove(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.connections.remove(principal, p.orgId, meta);
  }
}
