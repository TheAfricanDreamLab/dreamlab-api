import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  apiV1Contract,
  CircleProgressSchema,
  CohortEngagementSchema,
  CompletionFunnelSchema,
  CourseSlugSchema,
  GoalScopeSchema,
  LearningGoalSchema,
  OnTrackSchema,
  ProgramOnTrackSchema,
  RiskLevelSchema,
  SaveLearningGoalSchema,
  SendCheckInSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { EngagementService } from './engagement.service';

const r = apiV1Contract.engagement;

class GoalParamsDto extends createZodDto(z.object({ scope: GoalScopeSchema, enrollmentId: UuidSchema })) {}
class OnTrackParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema })) {}
class EngagementCohortParamsDto extends createZodDto(z.object({ cohortId: UuidSchema })) {}
class FunnelCourseParamsDto extends createZodDto(z.object({ slug: CourseSlugSchema })) {}
class CircleProgressParamsDto extends createZodDto(z.object({ circleId: UuidSchema })) {}
class EngagementQueryDto extends createZodDto(z.object({ risk: RiskLevelSchema.optional() })) {}
class SaveLearningGoalDto extends createZodDto(SaveLearningGoalSchema) {}
class SendCheckInDto extends createZodDto(SendCheckInSchema) {}
class SetCircleSharingDto extends createZodDto(z.object({ share: z.boolean() })) {}
class GoalResponseDto extends createZodDto(z.object({ goal: LearningGoalSchema.nullable() })) {}
class LearningGoalDto extends createZodDto(LearningGoalSchema) {}
class OnTrackDto extends createZodDto(OnTrackSchema) {}
class ProgramOnTrackDto extends createZodDto(ProgramOnTrackSchema) {}
class CohortEngagementDto extends createZodDto(CohortEngagementSchema) {}
class CheckInsSentDto extends createZodDto(z.object({ sent: z.number().int() })) {}
class CompletionFunnelDto extends createZodDto(CompletionFunnelSchema) {}
class CircleProgressDto extends createZodDto(CircleProgressSchema) {}

/** Staying on track (LRN-9): goals, pace and catch-up, at-risk learners, check-ins, funnels and circle progress. */
@ApiTags('engagement')
@Authenticated()
@Controller('v1/learning')
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('me/goals/:scope/:enrollmentId')
  @ApiOperation({ summary: r.getGoal.summary })
  @ZodResponse({ status: 200, type: GoalResponseDto })
  getGoal(@Param() p: GoalParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.getGoal(principal, p.scope, p.enrollmentId);
  }

  @Put('me/goals/:scope/:enrollmentId')
  @ApiOperation({ summary: r.saveGoal.summary })
  @ZodResponse({ status: 200, type: LearningGoalDto })
  saveGoal(@Param() p: GoalParamsDto, @Body() dto: SaveLearningGoalDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.saveGoal(principal, p.scope, p.enrollmentId, dto);
  }

  @Get('enrollments/:enrollmentId/on-track')
  @ApiOperation({ summary: r.courseOnTrack.summary })
  @ZodResponse({ status: 200, type: OnTrackDto })
  courseOnTrack(@Param() p: OnTrackParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.courseOnTrack(principal, p.enrollmentId);
  }

  @Get('me/programs/:enrollmentId/on-track')
  @ApiOperation({ summary: r.programOnTrack.summary })
  @ZodResponse({ status: 200, type: ProgramOnTrackDto })
  programOnTrack(@Param() p: OnTrackParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.programOnTrack(principal, p.enrollmentId);
  }

  /** Teachers see it too, so the service decides (cohort.manage or course_run.teach). */
  @Get('cohorts/:cohortId/engagement')
  @ApiOperation({ summary: r.cohortEngagement.summary })
  @ZodResponse({ status: 200, type: CohortEngagementDto })
  cohortEngagement(@Param() p: EngagementCohortParamsDto, @Query() q: EngagementQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.cohortEngagement(principal, p.cohortId, q.risk);
  }

  @Post('cohorts/:cohortId/check-ins')
  @HttpCode(200)
  @ApiOperation({ summary: r.sendCheckIn.summary })
  @ZodResponse({ status: 200, type: CheckInsSentDto })
  sendCheckIn(@Param() p: EngagementCohortParamsDto, @Body() dto: SendCheckInDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.sendCheckIn(principal, p.cohortId, dto);
  }

  @Get('cohorts/:cohortId/funnel')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.cohortFunnel.summary })
  @ZodResponse({ status: 200, type: CompletionFunnelDto })
  cohortFunnel(@Param() p: EngagementCohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.cohortFunnel(principal, p.cohortId);
  }

  @Get('admin/courses/:slug/funnel')
  @RequirePermission('platform.users.read')
  @ApiOperation({ summary: r.courseFunnel.summary })
  @ZodResponse({ status: 200, type: CompletionFunnelDto })
  courseFunnel(@Param() p: FunnelCourseParamsDto) {
    return this.engagement.courseFunnel(p.slug);
  }

  @Get('circles/:circleId/progress')
  @ApiOperation({ summary: r.circleProgress.summary })
  @ZodResponse({ status: 200, type: CircleProgressDto })
  circleProgress(@Param() p: CircleProgressParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.circleProgress(principal, p.circleId);
  }

  @Put('circles/:circleId/progress/sharing')
  @ApiOperation({ summary: r.setCircleSharing.summary })
  @ZodResponse({ status: 200, type: CircleProgressDto })
  setCircleSharing(@Param() p: CircleProgressParamsDto, @Body() dto: SetCircleSharingDto, @CurrentPrincipal() principal: Principal) {
    return this.engagement.setCircleSharing(principal, p.circleId, dto.share);
  }
}
