import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { OptionalPrincipal, Principal, Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { ProgramDetailDto, ProgramListDto, ProgramSlugParamsDto } from '../courses/dto/catalog.dto';
import { ProgramsService } from './programs.service';

const r = apiV1Contract.catalog;

@ApiTags('catalog')
@Public()
@Controller('v1/catalog/programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: r.listPrograms.summary })
  @ZodResponse({ status: 200, type: ProgramListDto })
  async list(@OptionalPrincipal() principal: Principal | null) {
    return { items: await this.programs.list(principal) };
  }

  @Get(':slug')
  @ApiOperation({ summary: r.getProgram.summary })
  @ZodResponse({ status: 200, type: ProgramDetailDto })
  get(@Param() p: ProgramSlugParamsDto, @OptionalPrincipal() principal: Principal | null) {
    return this.programs.get(p.slug, principal);
  }
}
