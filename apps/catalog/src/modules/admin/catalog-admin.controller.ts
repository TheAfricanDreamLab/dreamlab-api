import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { InjectConfig } from '@lib/config';
import { ZodResponse } from 'nestjs-zod';
import type { CatalogConfig } from '../../config';
import {
  AdminCourseDto,
  AdminCourseListDto,
  CourseIdParamsDto,
  ImportCourseDto,
  ImportProgramDto,
  ImportResultDto,
  ProgramImportResultDto,
  UpdateAdminCourseDto,
} from '../courses/dto/catalog.dto';
import { CatalogSeedService } from '../seed/catalog-seed.service';
import { CatalogAdminService } from './catalog-admin.service';

const r = apiV1Contract.catalog;

@ApiTags('platform')
@Controller('v1/catalog/admin')
export class CatalogAdminController {
  constructor(
    private readonly admin: CatalogAdminService,
    private readonly importer: CatalogSeedService,
    @InjectConfig() private readonly config: CatalogConfig,
  ) {}

  /** Imported content belongs to the admin's active organisation, or else to the platform organisation. */
  private async owner(principal: Principal): Promise<string> {
    return principal.orgId ?? (await this.importer.resolveOwner(this.config.CATALOG_SEED_OWNER_SLUG));
  }

  @Get('courses')
  @RequirePermission('platform.catalog.manage')
  @ApiOperation({ summary: r.adminListCourses.summary })
  @ZodResponse({ status: 200, type: AdminCourseListDto })
  list() {
    return this.admin.list();
  }

  @Patch('courses/:courseId')
  @RequirePermission('platform.catalog.manage')
  @ApiOperation({ summary: r.adminUpdateCourse.summary })
  @ZodResponse({ status: 200, type: AdminCourseDto })
  update(@Param() p: CourseIdParamsDto, @Body() dto: UpdateAdminCourseDto, @CurrentPrincipal() principal: Principal) {
    return this.admin.update(principal, p.courseId, dto);
  }

  @Post('courses/import')
  @HttpCode(200)
  @RequirePermission('platform.catalog.manage')
  @ApiOperation({ summary: r.adminImportCourse.summary })
  @ZodResponse({ status: 200, type: ImportResultDto })
  async importCourse(@Body() dto: ImportCourseDto, @CurrentPrincipal() principal: Principal) {
    return this.importer.importCourse(dto, await this.owner(principal));
  }

  @Post('programs/import')
  @HttpCode(200)
  @RequirePermission('platform.catalog.manage')
  @ApiOperation({ summary: r.adminImportProgram.summary })
  @ZodResponse({ status: 200, type: ProgramImportResultDto })
  async importProgram(@Body() dto: ImportProgramDto, @CurrentPrincipal() principal: Principal) {
    await this.importer.importProgram(dto, await this.owner(principal));
    return { slug: dto.slug };
  }
}
