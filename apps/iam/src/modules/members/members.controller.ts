import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { OrgParamsDto } from '../organizations/dto/org-params.dto';
import { AssignRoleDto, RoleAssignmentDto } from './dto/assign-role.dto';
import { MemberListQueryDto } from './dto/member-list-query.dto';
import { AssignmentParamsDto, MemberParamsDto } from './dto/member-params.dto';
import { MembershipDto, MembershipPageDto } from './dto/membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembersService } from './members.service';

const r = apiV1Contract.members;

@ApiTags('members')
@Controller('v1/orgs/:orgId')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get('members')
  @RequirePermission('org.members.read', { anyScope: true })
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: MembershipPageDto })
  list(@Param() params: OrgParamsDto, @Query() query: MemberListQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.members.list(principal, params.orgId, query);
  }

  @Get('members/:membershipId')
  @RequirePermission('org.members.read', { anyScope: true })
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: MembershipDto })
  get(@Param() params: MemberParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.members.get(principal, params.orgId, params.membershipId);
  }

  @Patch('members/:membershipId')
  @RequirePermission('org.members.update', { anyScope: true })
  @ApiOperation({ summary: r.update.summary })
  @ZodResponse({ status: 200, type: MembershipDto })
  update(
    @Param() params: MemberParamsDto,
    @Body() dto: UpdateMembershipDto,
    @CurrentPrincipal() principal: Principal,
    @Meta() meta: RequestMeta,
  ) {
    return this.members.update(principal, params.orgId, params.membershipId, dto, meta);
  }

  @Delete('members/:membershipId')
  @RequirePermission('org.members.remove')
  @HttpCode(204)
  @ApiOperation({ summary: r.remove.summary })
  async remove(@Param() params: MemberParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.members.remove(principal, params.orgId, params.membershipId, meta);
  }

  @Post('members/:membershipId/roles')
  @RequirePermission('org.roles.assign')
  @ApiOperation({ summary: r.assignRole.summary })
  @ZodResponse({ status: 201, type: RoleAssignmentDto })
  assignRole(
    @Param() params: MemberParamsDto,
    @Body() dto: AssignRoleDto,
    @CurrentPrincipal() principal: Principal,
    @Meta() meta: RequestMeta,
  ) {
    return this.members.assignRole(principal, params.orgId, params.membershipId, dto, meta);
  }

  @Delete('role-assignments/:assignmentId')
  @RequirePermission('org.roles.revoke')
  @HttpCode(204)
  @ApiOperation({ summary: r.revokeRole.summary })
  async revokeRole(@Param() params: AssignmentParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.members.revokeRole(principal, params.orgId, params.assignmentId, meta);
  }
}
