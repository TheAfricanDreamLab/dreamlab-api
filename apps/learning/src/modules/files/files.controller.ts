import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { FileLinkDto, FileParamsDto } from '../enrollments/dto/learning.dto';
import { GradingService } from '../grading/grading.service';
import { FilesService } from './files.service';

const r = apiV1Contract.learning;

@ApiTags('learning')
@Authenticated()
@Controller('v1/learning/files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly grading: GradingService,
  ) {}

  @Get(':fileId')
  @ApiOperation({ summary: r.fileLink.summary })
  @ZodResponse({ status: 200, type: FileLinkDto })
  link(@Param() params: FileParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.files.link(principal, params.fileId, (submissionId) => this.grading.mayGrade(principal, submissionId));
  }
}
