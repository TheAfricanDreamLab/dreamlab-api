import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { OptionalPrincipal, Principal, Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { CatalogReadService } from './catalog-read.service';
import { CourseDetailDto, CourseListDto, CourseListQueryDto, SlugParamsDto } from './dto/catalog.dto';

const r = apiV1Contract.catalog;

@ApiTags('catalog')
@Public()
@Controller('v1/catalog/courses')
export class CoursesController {
  constructor(private readonly catalog: CatalogReadService) {}

  @Get()
  @ApiOperation({ summary: r.listCourses.summary })
  @ZodResponse({ status: 200, type: CourseListDto })
  async list(@Query() query: CourseListQueryDto, @OptionalPrincipal() principal: Principal | null) {
    return { items: await this.catalog.listCourses(principal, query) };
  }

  @Get(':slug')
  @ApiOperation({ summary: r.getCourse.summary })
  @ZodResponse({ status: 200, type: CourseDetailDto })
  get(@Param() p: SlugParamsDto, @OptionalPrincipal() principal: Principal | null) {
    return this.catalog.getCourse(p.slug, principal);
  }
}
