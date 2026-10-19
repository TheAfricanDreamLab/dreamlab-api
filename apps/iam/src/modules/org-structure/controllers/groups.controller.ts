import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { MembershipPageDto } from '../../members/dto/membership.dto';
import { OrgParamsDto } from '../../organizations/dto/org-params.dto';
import {
  AddGroupMembersDto,
  CreateGroupDto,
  GroupDto,
  GroupListDto,
  GroupMemberParamsDto,
  GroupParamsDto,
  UpdateGroupDto,
} from '../dto/group.dto';
import { GroupsService } from '../services/groups.service';

const r = apiV1Contract.structure;

@ApiTags('org structure')
@Controller('v1/orgs/:orgId')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get('groups')
  @RequirePermission('org.read')
  @ApiOperation({ summary: r.listGroups.summary })
  @ZodResponse({ status: 200, type: GroupListDto })
  listGroups(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.groups.listGroups(principal, p.orgId);
  }

  @Post('groups')
  @RequirePermission('org.groups.manage')
  @ApiOperation({ summary: r.createGroup.summary })
  @ZodResponse({ status: 201, type: GroupDto })
  createGroup(@Param() p: OrgParamsDto, @Body() dto: CreateGroupDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.groups.createGroup(principal, p.orgId, dto.name, meta);
  }

  @Patch('groups/:groupId')
  @RequirePermission('org.groups.manage')
  @ApiOperation({ summary: r.updateGroup.summary })
  @ZodResponse({ status: 200, type: GroupDto })
  updateGroup(@Param() p: GroupParamsDto, @Body() dto: UpdateGroupDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.groups.updateGroup(principal, p.orgId, p.groupId, dto.name, meta);
  }

  @Delete('groups/:groupId')
  @RequirePermission('org.groups.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.deleteGroup.summary })
  async deleteGroup(@Param() p: GroupParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.groups.deleteGroup(principal, p.orgId, p.groupId, meta);
  }

  @Get('groups/:groupId/members')
  @RequirePermission('org.members.read')
  @ApiOperation({ summary: r.listGroupMembers.summary })
  @ZodResponse({ status: 200, type: MembershipPageDto })
  listGroupMembers(@Param() p: GroupParamsDto, @Query() query: PageQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.groups.listGroupMembers(principal, p.orgId, p.groupId, query);
  }

  @Post('groups/:groupId/members')
  @RequirePermission('org.groups.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.addGroupMembers.summary })
  async addGroupMembers(@Param() p: GroupParamsDto, @Body() dto: AddGroupMembersDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.groups.addGroupMembers(principal, p.orgId, p.groupId, dto.membershipIds, meta);
  }

  @Delete('groups/:groupId/members/:membershipId')
  @RequirePermission('org.groups.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.removeGroupMember.summary })
  async removeGroupMember(@Param() p: GroupMemberParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.groups.removeGroupMember(principal, p.orgId, p.groupId, p.membershipId, meta);
  }
}
