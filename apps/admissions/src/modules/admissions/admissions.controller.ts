import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AdmissionCycleSchema,
  AdmissionStageSchema,
  AdvanceRequestSchema,
  apiV1Contract,
  ApplicationSchema,
  ApplicationStatusSchema,
  ApplicationSummarySchema,
  CreateCycleSchema,
  DecisionRequestSchema,
  InterviewRequestSchema,
  PipelineSchema,
  ReviewRequestSchema,
  ScholarshipRequestSchema,
  UpdateCycleSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, Public, RequirePermission } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { AdmissionsService } from './admissions.service';

const r = apiV1Contract.admissions;

class AppParamsDto extends createZodDto(z.object({ applicationId: UuidSchema })) {}
class StageParamsDto extends createZodDto(z.object({ applicationId: UuidSchema, stage: AdmissionStageSchema })) {}
class CycleParamsDto extends createZodDto(z.object({ cycleId: UuidSchema })) {}
class OpenCyclesQueryDto extends createZodDto(z.object({ programSlug: z.string().max(80).optional() })) {}
class PipelineQueryDto extends createZodDto(z.object({ stage: AdmissionStageSchema.optional(), status: ApplicationStatusSchema.optional() })) {}
class StartDto extends createZodDto(z.object({ cycleId: UuidSchema })) {}
class SaveStageDto extends createZodDto(z.object({ answers: z.record(z.unknown()) })) {}
class CycleDto extends createZodDto(AdmissionCycleSchema) {}
class CycleListDto extends createZodDto(z.object({ items: z.array(AdmissionCycleSchema) })) {}
class CreateCycleDto extends createZodDto(CreateCycleSchema) {}
class UpdateCycleDto extends createZodDto(UpdateCycleSchema) {}
class ApplicationDto extends createZodDto(ApplicationSchema) {}
class ApplicationListDto extends createZodDto(z.object({ items: z.array(ApplicationSummarySchema) })) {}
class PipelineDto extends createZodDto(PipelineSchema) {}
class ReviewDto extends createZodDto(ReviewRequestSchema) {}
class AdvanceDto extends createZodDto(AdvanceRequestSchema) {}
class InterviewDto extends createZodDto(InterviewRequestSchema) {}
class ScholarshipDto extends createZodDto(ScholarshipRequestSchema) {}
class DecisionDto extends createZodDto(DecisionRequestSchema) {}

/** Applying: open cycles, my applications and their applicant stages. */
@ApiTags('admissions')
@Authenticated()
@Controller('v1/admissions')
export class ApplicationsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get('cycles')
  @Public()
  @ApiOperation({ summary: r.openCycles.summary })
  @ZodResponse({ status: 200, type: CycleListDto })
  openCycles(@Query() q: OpenCyclesQueryDto) {
    return this.admissions.openCycles(q.programSlug);
  }

  @Post('applications')
  @ApiOperation({ summary: r.start.summary })
  @ZodResponse({ status: 201, type: ApplicationDto })
  start(@Body() dto: StartDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.start(principal, dto.cycleId);
  }

  @Get('applications/mine')
  @ApiOperation({ summary: r.mine.summary })
  @ZodResponse({ status: 200, type: ApplicationListDto })
  mine(@CurrentPrincipal() principal: Principal) {
    return this.admissions.mine(principal);
  }

  @Get('applications/:applicationId')
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  get(@Param() p: AppParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.get(principal, p.applicationId);
  }

  @Put('applications/:applicationId/stages/:stage')
  @ApiOperation({ summary: r.saveStage.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  save(@Param() p: StageParamsDto, @Body() dto: SaveStageDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.saveStage(principal, p.applicationId, p.stage, dto.answers);
  }

  @Post('applications/:applicationId/stages/:stage/submit')
  @HttpCode(200)
  @ApiOperation({ summary: r.submitStage.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  submit(@Param() p: StageParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.submitStage(principal, p.applicationId, p.stage);
  }

  @Post('applications/:applicationId/withdraw')
  @HttpCode(200)
  @ApiOperation({ summary: r.withdraw.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  withdraw(@Param() p: AppParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.withdraw(principal, p.applicationId);
  }
}

/** Running admissions: cycles, the pipeline, reviews and decisions. */
@ApiTags('admissions-admin')
@Authenticated()
@Controller('v1/admissions/admin')
export class AdmissionsAdminController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get('cycles')
  @RequirePermission('admissions.review')
  @ApiOperation({ summary: r.cycles.summary })
  @ZodResponse({ status: 200, type: CycleListDto })
  cycles(@CurrentPrincipal() principal: Principal) {
    return this.admissions.cycles(principal);
  }

  @Post('cycles')
  @RequirePermission('admissions.manage')
  @ApiOperation({ summary: r.createCycle.summary })
  @ZodResponse({ status: 201, type: CycleDto })
  createCycle(@Body() dto: CreateCycleDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.createCycle(principal, dto);
  }

  @Patch('cycles/:cycleId')
  @RequirePermission('admissions.manage')
  @ApiOperation({ summary: r.updateCycle.summary })
  @ZodResponse({ status: 200, type: CycleDto })
  updateCycle(@Param() p: CycleParamsDto, @Body() dto: UpdateCycleDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.updateCycle(principal, p.cycleId, dto);
  }

  @Get('cycles/:cycleId/pipeline')
  @RequirePermission('admissions.review')
  @ApiOperation({ summary: r.pipeline.summary })
  @ZodResponse({ status: 200, type: PipelineDto })
  pipeline(@Param() p: CycleParamsDto, @Query() q: PipelineQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.pipeline(principal, p.cycleId, q);
  }

  @Post('applications/:applicationId/reviews')
  @RequirePermission('admissions.review')
  @ApiOperation({ summary: r.review.summary })
  @ZodResponse({ status: 201, type: ApplicationDto })
  review(@Param() p: AppParamsDto, @Body() dto: ReviewDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.review(principal, p.applicationId, dto);
  }

  @Post('applications/:applicationId/ai-evaluations')
  @RequirePermission('admissions.review')
  @ApiOperation({ summary: r.aiEvaluate.summary })
  @ZodResponse({ status: 201, type: ApplicationDto })
  aiEvaluate(@Param() p: AppParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.aiEvaluate(principal, p.applicationId);
  }

  @Post('applications/:applicationId/advance')
  @HttpCode(200)
  @RequirePermission('admissions.review')
  @ApiOperation({ summary: r.advance.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  advance(@Param() p: AppParamsDto, @Body() dto: AdvanceDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.advance(principal, p.applicationId, dto.note);
  }

  @Put('applications/:applicationId/interview')
  @RequirePermission('admissions.review')
  @ApiOperation({ summary: r.interview.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  interview(@Param() p: AppParamsDto, @Body() dto: InterviewDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.interview(principal, p.applicationId, dto);
  }

  @Put('applications/:applicationId/scholarship')
  @RequirePermission('admissions.decide')
  @ApiOperation({ summary: r.scholarship.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  scholarship(@Param() p: AppParamsDto, @Body() dto: ScholarshipDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.scholarship(principal, p.applicationId, dto);
  }

  @Post('applications/:applicationId/decision')
  @HttpCode(200)
  @RequirePermission('admissions.decide')
  @ApiOperation({ summary: r.decide.summary })
  @ZodResponse({ status: 200, type: ApplicationDto })
  decide(@Param() p: AppParamsDto, @Body() dto: DecisionDto, @CurrentPrincipal() principal: Principal) {
    return this.admissions.decide(principal, p.applicationId, dto);
  }
}
