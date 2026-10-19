import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { OrgParamsDto } from '../organizations/dto/org-params.dto';
import { DomainsService } from './domains.service';
import { AddDomainDto, DomainParamsDto, JoinableOrgListDto, JoinResultDto, OrgDomainDto, OrgDomainListDto, UpdateDomainDto } from './dto/domain.dto';

const r = apiV1Contract.enterprise;

@ApiTags('enterprise')
@Controller('v1')
export class DomainsController {
  constructor(private readonly domains: DomainsService) {}

  @Get('orgs/:orgId/domains')
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.listDomains.summary })
  @ZodResponse({ status: 200, type: OrgDomainListDto })
  list(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.domains.list(principal, p.orgId);
  }

  @Post('orgs/:orgId/domains')
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.addDomain.summary })
  @ZodResponse({ status: 201, type: OrgDomainDto })
  add(@Param() p: OrgParamsDto, @Body() dto: AddDomainDto, @CurrentPrincipal() principal: Principal) {
    return this.domains.add(principal, p.orgId, dto.domain);
  }

  @Post('orgs/:orgId/domains/:domainId/verify')
  @RequirePermission('org.security.manage')
  @HttpCode(200)
  @ApiOperation({ summary: r.verifyDomain.summary })
  @ZodResponse({ status: 200, type: OrgDomainDto })
  verify(@Param() p: DomainParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.domains.verify(principal, p.orgId, p.domainId, meta);
  }

  @Patch('orgs/:orgId/domains/:domainId')
  @RequirePermission('org.security.manage')
  @ApiOperation({ summary: r.updateDomain.summary })
  @ZodResponse({ status: 200, type: OrgDomainDto })
  update(@Param() p: DomainParamsDto, @Body() dto: UpdateDomainDto, @CurrentPrincipal() principal: Principal) {
    return this.domains.update(principal, p.orgId, p.domainId, dto.joinPolicy);
  }

  @Delete('orgs/:orgId/domains/:domainId')
  @RequirePermission('org.security.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.removeDomain.summary })
  async remove(@Param() p: DomainParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.domains.remove(principal, p.orgId, p.domainId);
  }

  @Get('me/joinable-orgs')
  @Authenticated()
  @ApiOperation({ summary: r.joinableOrgs.summary })
  @ZodResponse({ status: 200, type: JoinableOrgListDto })
  joinable(@CurrentPrincipal() principal: Principal) {
    return this.domains.joinable(principal);
  }

  @Post('orgs/:orgId/join')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.joinOrg.summary })
  @ZodResponse({ status: 200, type: JoinResultDto })
  join(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.domains.join(principal, p.orgId, meta);
  }
}
