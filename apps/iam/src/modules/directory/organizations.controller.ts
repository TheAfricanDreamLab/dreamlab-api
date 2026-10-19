import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract, SlugSchema } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, Public, RequirePermission } from '@lib/auth';
import { notFound } from '@lib/common';
import { ZodResponse } from 'nestjs-zod';
import {
  CreateOrganizationDto,
  OrganizationDto,
  OrganizationPageDto,
  OrgListQueryDto,
  OrgParamsDto,
  PublicOrganizationDto,
  SlugParamsDto,
  UpdateOrganizationDto,
} from '../../common/dto';
import { Meta } from '../../common/request-meta';
import type { RequestMeta } from '../auth/sessions.service';
import { OrganizationsService } from './organizations.service';

const r = apiV1Contract.organizations;
export const ORG_RESOLVE_PATTERN = 'iam.orgs.resolve';

@ApiTags('organizations')
@Controller('v1/orgs')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  @RequirePermission('platform.orgs.create')
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: OrganizationDto })
  create(@Body() dto: CreateOrganizationDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.orgs.create(principal, dto, meta);
  }

  @Get()
  @RequirePermission('platform.orgs.read')
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: OrganizationPageDto })
  list(@Query() query: OrgListQueryDto) {
    return this.orgs.list(query);
  }

  @Get('resolve/:slug')
  @Public()
  @ApiOperation({ summary: r.resolve.summary })
  @ZodResponse({ status: 200, type: PublicOrganizationDto })
  async resolve(@Param() params: SlugParamsDto) {
    const org = await this.orgs.resolve(params.slug);
    if (!org) throw notFound('org_not_found', 'Organisation not found');
    return org;
  }

  @Get(':orgId')
  @RequirePermission('org.read')
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: OrganizationDto })
  get(@Param() params: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.orgs.get(principal, params.orgId);
  }

  @Patch(':orgId')
  @RequirePermission('org.settings.update')
  @ApiOperation({ summary: r.update.summary })
  @ZodResponse({ status: 200, type: OrganizationDto })
  update(
    @Param() params: OrgParamsDto,
    @Body() dto: UpdateOrganizationDto,
    @CurrentPrincipal() principal: Principal,
    @Meta() meta: RequestMeta,
  ) {
    return this.orgs.update(principal, params.orgId, dto, meta);
  }
}

/** RabbitMQ RPC: the gateway resolves tenant subdomains through this. */
@Controller()
export class OrganizationsRpcController {
  constructor(private readonly orgs: OrganizationsService) {}

  @MessagePattern(ORG_RESOLVE_PATTERN)
  async resolve(@Payload() payload: { slug?: unknown }) {
    const slug = SlugSchema.safeParse(payload?.slug);
    return slug.success ? this.orgs.resolve(slug.data) : null;
  }
}
