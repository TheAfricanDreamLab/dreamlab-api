import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, Public, RequirePermission } from '@lib/auth';
import { notFound } from '@lib/common';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrgListQueryDto } from './dto/org-list-query.dto';
import { OrgParamsDto, SlugParamsDto } from './dto/org-params.dto';
import { OrganizationDto, OrganizationPageDto, PublicOrganizationDto } from './dto/organization.dto';
import { SignUpOrganizationDto } from './dto/sign-up-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

const r = apiV1Contract.organizations;

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

  @Post('signup')
  @Authenticated()
  @ApiOperation({ summary: r.signUp.summary })
  @ZodResponse({ status: 201, type: OrganizationDto })
  signUp(@Body() dto: SignUpOrganizationDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.orgs.signUp(principal, dto, meta);
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
