import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import {
  AddGroupMembersDto,
  CreateGroupDto,
  CreateOrgUnitDto,
  GroupDto,
  GroupListDto,
  GroupMemberParamsDto,
  GroupParamsDto,
  MembershipPageDto,
  OrgParamsDto,
  OrgUnitDto,
  OrgUnitListDto,
  PageQueryDto,
  UnitParamsDto,
  UpdateGroupDto,
  UpdateOrgUnitDto,
} from '../../common/dto';
import { Meta } from '../../common/request-meta';
import type { RequestMeta } from '../auth/sessions.service';
import { StructureService } from './structure.service';

const r = apiV1Contract.structure;

@ApiTags('org structure')
@Controller('v1/orgs/:orgId')
export class StructureController {
  constructor(private readonly structure: StructureService) {}

  @Get('units')
  @RequirePermission('org.read')
  @ApiOperation({ summary: r.listUnits.summary })
  @ZodResponse({ status: 200, type: OrgUnitListDto })
  listUnits(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.structure.listUnits(principal, p.orgId);
  }

  @Post('units')
  @RequirePermission('org.units.manage')
  @ApiOperation({ summary: r.createUnit.summary })
  @ZodResponse({ status: 201, type: OrgUnitDto })
  createUnit(@Param() p: OrgParamsDto, @Body() dto: CreateOrgUnitDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.structure.createUnit(principal, p.orgId, dto, meta);
  }

  @Patch('units/:unitId')
  @RequirePermission('org.units.manage')
  @ApiOperation({ summary: r.updateUnit.summary })
  @ZodResponse({ status: 200, type: OrgUnitDto })
  updateUnit(@Param() p: UnitParamsDto, @Body() dto: UpdateOrgUnitDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.structure.updateUnit(principal, p.orgId, p.unitId, dto, meta);
  }

  @Delete('units/:unitId')
  @RequirePermission('org.units.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.deleteUnit.summary })
  async deleteUnit(@Param() p: UnitParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.structure.deleteUnit(principal, p.orgId, p.unitId, meta);
  }

  @Get('groups')
  @RequirePermission('org.read')
  @ApiOperation({ summary: r.listGroups.summary })
  @ZodResponse({ status: 200, type: GroupListDto })
  listGroups(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.structure.listGroups(principal, p.orgId);
  }

  @Post('groups')
  @RequirePermission('org.groups.manage')
  @ApiOperation({ summary: r.createGroup.summary })
  @ZodResponse({ status: 201, type: GroupDto })
  createGroup(@Param() p: OrgParamsDto, @Body() dto: CreateGroupDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.structure.createGroup(principal, p.orgId, dto.name, meta);
  }

  @Patch('groups/:groupId')
  @RequirePermission('org.groups.manage')
  @ApiOperation({ summary: r.updateGroup.summary })
  @ZodResponse({ status: 200, type: GroupDto })
  updateGroup(@Param() p: GroupParamsDto, @Body() dto: UpdateGroupDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.structure.updateGroup(principal, p.orgId, p.groupId, dto.name, meta);
  }

  @Delete('groups/:groupId')
  @RequirePermission('org.groups.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.deleteGroup.summary })
  async deleteGroup(@Param() p: GroupParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.structure.deleteGroup(principal, p.orgId, p.groupId, meta);
  }

  @Get('groups/:groupId/members')
  @RequirePermission('org.members.read')
  @ApiOperation({ summary: r.listGroupMembers.summary })
  @ZodResponse({ status: 200, type: MembershipPageDto })
  listGroupMembers(@Param() p: GroupParamsDto, @Query() query: PageQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.structure.listGroupMembers(principal, p.orgId, p.groupId, query);
  }

  @Post('groups/:groupId/members')
  @RequirePermission('org.groups.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.addGroupMembers.summary })
  async addGroupMembers(@Param() p: GroupParamsDto, @Body() dto: AddGroupMembersDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.structure.addGroupMembers(principal, p.orgId, p.groupId, dto.membershipIds, meta);
  }

  @Delete('groups/:groupId/members/:membershipId')
  @RequirePermission('org.groups.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.removeGroupMember.summary })
  async removeGroupMember(@Param() p: GroupMemberParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.structure.removeGroupMember(principal, p.orgId, p.groupId, p.membershipId, meta);
  }
}
