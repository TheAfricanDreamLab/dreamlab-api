import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract, ScimSettingsSchema, ScimTokenSchema } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { OrgParamsDto } from '../../organizations/dto/org-params.dto';
import { ScimSettingsService } from '../services/scim-settings.service';

class ScimSettingsDto extends createZodDto(ScimSettingsSchema) {}
class ScimTokenDto extends createZodDto(ScimTokenSchema) {}

const r = apiV1Contract.enterprise;

@ApiTags('enterprise')
@Controller('v1/orgs/:orgId/scim')
export class ScimAdminController {
  constructor(private readonly settings: ScimSettingsService) {}

  @Get()
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.getScim.summary })
  @ZodResponse({ status: 200, type: ScimSettingsDto })
  get(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.settings.get(principal, p.orgId);
  }

  @Post('token')
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.createScimToken.summary })
  @ZodResponse({ status: 201, type: ScimTokenDto })
  createToken(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.settings.createToken(principal, p.orgId, meta);
  }

  @Delete()
  @RequirePermission('org.security.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.disableScim.summary })
  async disable(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.settings.disable(principal, p.orgId, meta);
  }
}
