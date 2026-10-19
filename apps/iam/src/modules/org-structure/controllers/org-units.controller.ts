import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { OrgParamsDto } from '../../organizations/dto/org-params.dto';
import { CreateOrgUnitDto, OrgUnitDto, OrgUnitListDto, UnitParamsDto, UpdateOrgUnitDto } from '../dto/org-unit.dto';
import { OrgUnitsService } from '../services/org-units.service';

const r = apiV1Contract.structure;

@ApiTags('org structure')
@Controller('v1/orgs/:orgId')
export class OrgUnitsController {
  constructor(private readonly units: OrgUnitsService) {}

  @Get('units')
  @RequirePermission('org.read')
  @ApiOperation({ summary: r.listUnits.summary })
  @ZodResponse({ status: 200, type: OrgUnitListDto })
  listUnits(@Param() p: OrgParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.units.listUnits(principal, p.orgId);
  }

  @Post('units')
  @RequirePermission('org.units.manage')
  @ApiOperation({ summary: r.createUnit.summary })
  @ZodResponse({ status: 201, type: OrgUnitDto })
  createUnit(@Param() p: OrgParamsDto, @Body() dto: CreateOrgUnitDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.units.createUnit(principal, p.orgId, dto, meta);
  }

  @Patch('units/:unitId')
  @RequirePermission('org.units.manage')
  @ApiOperation({ summary: r.updateUnit.summary })
  @ZodResponse({ status: 200, type: OrgUnitDto })
  updateUnit(@Param() p: UnitParamsDto, @Body() dto: UpdateOrgUnitDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.units.updateUnit(principal, p.orgId, p.unitId, dto, meta);
  }

  @Delete('units/:unitId')
  @RequirePermission('org.units.manage')
  @HttpCode(204)
  @ApiOperation({ summary: r.deleteUnit.summary })
  async deleteUnit(@Param() p: UnitParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.units.deleteUnit(principal, p.orgId, p.unitId, meta);
  }
}
