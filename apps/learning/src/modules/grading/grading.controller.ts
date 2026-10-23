import { Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { GradeRequestDto, GradingQueueDto, GradingQueueQueryDto, SubmissionForGradingDto, SubmissionParamsDto } from './dto/grading.dto';
import { GradingService } from './grading.service';

const r = apiV1Contract.grading;

/**
 * Faculty grading. The guard admits anyone with submission.grade at any scope in the active
 * organisation (or platform admins); the service narrows each submission to the learner's course
 * run or cohort for scoped graders.
 */
@ApiTags('grading')
@Controller('v1/learning/grading')
export class GradingController {
  constructor(private readonly grading: GradingService) {}

  @Get('queue')
  @RequirePermission('submission.grade', { anyScope: true })
  @ApiOperation({ summary: r.queue.summary })
  @ZodResponse({ status: 200, type: GradingQueueDto })
  queue(@Query() q: GradingQueueQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.grading.queue(principal, q.status);
  }

  @Get('submissions/:submissionId')
  @RequirePermission('submission.grade', { anyScope: true })
  @ApiOperation({ summary: r.submission.summary })
  @ZodResponse({ status: 200, type: SubmissionForGradingDto })
  submission(@Param() p: SubmissionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.grading.submission(principal, p.submissionId);
  }

  @Put('submissions/:submissionId/grade')
  @RequirePermission('submission.grade', { anyScope: true })
  @ApiOperation({ summary: r.grade.summary })
  @ZodResponse({ status: 200, type: SubmissionForGradingDto })
  grade(@Param() p: SubmissionParamsDto, @Body() dto: GradeRequestDto, @CurrentPrincipal() principal: Principal, @Req() req: { id?: string }) {
    return this.grading.grade(principal, p.submissionId, dto, req.id);
  }
}
