import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract, CreateCustomRoleSchema, OrgRoleListSchema, RoleKeySchema, RoleSchema, UpdateCustomRoleSchema, UuidSchema } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { OrgParamsDto } from '../../organizations/dto/org-params.dto';
import { OrgRolesService } from '../services/org-roles.service';

class OrgRoleListDto extends createZodDto(OrgRoleListSchema) {}
class CustomRoleDto extends createZodDto(RoleSchema) {}
class CreateCustomRoleDto extends createZodDto(CreateCustomRoleSchema) {}
class UpdateCustomRoleDto extends createZodDto(UpdateCustomRoleSchema) {}
class RoleParamsDto extends createZodDto(z.object({ orgId: UuidSchema, roleKey: RoleKeySchema })) {}

const r = apiV1Contract.enterprise;

@ApiTags('enterprise')
@Controller('v1/orgs/:orgId/roles')
export class OrgRolesController {
  constructor(private readonly roles: OrgRolesService) {}

  @Get()
  @RequirePermission('org.members.read')
  @ApiOperation({ summary: r.listOrgRoles.summary })
  @ZodResponse({ status: 200, type: OrgRoleListDto })
  list(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.roles.list(principal, p.orgId);
  }

  @Post()
  @RequirePermission('org.roles.manage')
  @ApiOperation({ summary: r.createRole.summary })
  @ZodResponse({ status: 201, type: CustomRoleDto })
  create(@Param() p: OrgParamsDto, @Body() dto: CreateCustomRoleDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.roles.create(principal, p.orgId, dto, meta);
  }

  @Patch(':roleKey')
  @RequirePermission('org.roles.manage')
  @ApiOperation({ summary: r.updateRole.summary })
  @ZodResponse({ status: 200, type: CustomRoleDto })
  update(@Param() p: RoleParamsDto, @Body() dto: UpdateCustomRoleDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.roles.update(principal, p.orgId, p.roleKey, dto, meta);
  }

  @Delete(':roleKey')
  @RequirePermission('org.roles.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.deleteRole.summary })
  async remove(@Param() p: RoleParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.roles.remove(principal, p.orgId, p.roleKey, meta);
  }
}
