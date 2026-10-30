import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ActionPlanBodySchema,
  ActionPlanSchema,
  apiV1Contract,
  ConfirmRequirementSchema,
  CredentialSchema,
  GraduationBoardSchema,
  GraduationSchema,
  PortfolioSchema,
  ResidencyBoardSchema,
  ResidencySchema,
  ReviewActionPlanSchema,
  ReviewResidencyStageSchema,
  RevokeCredentialSchema,
  SaveResidencyStageSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, Public } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { ActionPlanService } from './action-plan.service';
import { CredentialsService } from './credentials.service';
import { GraduationService } from './graduation.service';
import { PortfolioService } from './portfolio.service';
import { ResidencyService } from './residency.service';

const r = apiV1Contract.outcomes;

class EnrollmentParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema })) {}
class StageParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema, position: z.coerce.number().int().min(1).max(20) })) {}
class RequirementParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema, key: z.string().regex(/^[a-z0-9_]{2,60}$/) })) {}
class CohortParamsDto extends createZodDto(z.object({ cohortId: UuidSchema })) {}
class TokenParamsDto extends createZodDto(z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/) })) {}
class CodeParamsDto extends createZodDto(z.object({ code: z.string().regex(/^[A-Z0-9-]{8,32}$/) })) {}
class ResidencyDto extends createZodDto(ResidencySchema) {}
class ResidencyBoardDto extends createZodDto(ResidencyBoardSchema) {}
class SaveStageDto extends createZodDto(SaveResidencyStageSchema) {}
class ReviewStageDto extends createZodDto(ReviewResidencyStageSchema) {}
class ActionPlanDto extends createZodDto(ActionPlanSchema) {}
class ActionPlanBodyDto extends createZodDto(ActionPlanBodySchema) {}
class ReviewActionPlanDto extends createZodDto(ReviewActionPlanSchema) {}
class GraduationDto extends createZodDto(GraduationSchema) {}
class GraduationBoardDto extends createZodDto(GraduationBoardSchema) {}
class ConfirmRequirementDto extends createZodDto(ConfirmRequirementSchema) {}
class PortfolioDto extends createZodDto(PortfolioSchema) {}
class ShareDto extends createZodDto(z.object({ shared: z.boolean() })) {}
class CredentialDto extends createZodDto(CredentialSchema) {}
class CredentialListDto extends createZodDto(z.object({ items: z.array(CredentialSchema) })) {}
class RevokeDto extends createZodDto(RevokeCredentialSchema) {}

/** Dream Residency, action plan, graduation and portfolio of one programme enrolment (Slice 3). */
@ApiTags('outcomes')
@Authenticated()
@Controller('v1/learning')
export class OutcomesController {
  constructor(
    private readonly residency: ResidencyService,
    private readonly plans: ActionPlanService,
    private readonly graduation: GraduationService,
    private readonly portfolio: PortfolioService,
  ) {}

  // ---------- residency ----------

  @Get('programs/enrollments/:enrollmentId/residency')
  @ApiOperation({ summary: r.residency.summary })
  @ZodResponse({ status: 200, type: ResidencyDto })
  getResidency(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.residency.get(principal, p.enrollmentId);
  }

  @Put('programs/enrollments/:enrollmentId/residency/:position')
  @ApiOperation({ summary: r.saveResidencyStage.summary })
  @ZodResponse({ status: 200, type: ResidencyDto })
  saveStage(@Param() p: StageParamsDto, @Body() dto: SaveStageDto, @CurrentPrincipal() principal: Principal) {
    return this.residency.save(principal, p.enrollmentId, p.position, dto);
  }

  @Post('programs/enrollments/:enrollmentId/residency/:position/submit')
  @HttpCode(200)
  @ApiOperation({ summary: r.submitResidencyStage.summary })
  @ZodResponse({ status: 200, type: ResidencyDto })
  submitStage(@Param() p: StageParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.residency.submit(principal, p.enrollmentId, p.position);
  }

  @Post('programs/enrollments/:enrollmentId/residency/:position/review')
  @HttpCode(200)
  @ApiOperation({ summary: r.reviewResidencyStage.summary })
  @ZodResponse({ status: 200, type: ResidencyDto })
  reviewStage(@Param() p: StageParamsDto, @Body() dto: ReviewStageDto, @CurrentPrincipal() principal: Principal) {
    return this.residency.review(principal, p.enrollmentId, p.position, dto);
  }

  @Get('cohorts/:cohortId/residency')
  @ApiOperation({ summary: r.residencyBoard.summary })
  @ZodResponse({ status: 200, type: ResidencyBoardDto })
  residencyBoard(@Param() p: CohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.residency.board(principal, p.cohortId);
  }

  // ---------- action plan ----------

  @Get('programs/enrollments/:enrollmentId/action-plan')
  @ApiOperation({ summary: r.actionPlan.summary })
  @ZodResponse({ status: 200, type: ActionPlanDto })
  getPlan(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.plans.get(principal, p.enrollmentId);
  }

  @Put('programs/enrollments/:enrollmentId/action-plan')
  @ApiOperation({ summary: r.saveActionPlan.summary })
  @ZodResponse({ status: 200, type: ActionPlanDto })
  savePlan(@Param() p: EnrollmentParamsDto, @Body() dto: ActionPlanBodyDto, @CurrentPrincipal() principal: Principal) {
    return this.plans.save(principal, p.enrollmentId, dto);
  }

  @Post('programs/enrollments/:enrollmentId/action-plan/submit')
  @HttpCode(200)
  @ApiOperation({ summary: r.submitActionPlan.summary })
  @ZodResponse({ status: 200, type: ActionPlanDto })
  submitPlan(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.plans.submit(principal, p.enrollmentId);
  }

  @Post('programs/enrollments/:enrollmentId/action-plan/review')
  @HttpCode(200)
  @ApiOperation({ summary: r.reviewActionPlan.summary })
  @ZodResponse({ status: 200, type: ActionPlanDto })
  reviewPlan(@Param() p: EnrollmentParamsDto, @Body() dto: ReviewActionPlanDto, @CurrentPrincipal() principal: Principal) {
    return this.plans.review(principal, p.enrollmentId, dto);
  }

  // ---------- graduation ----------

  @Get('programs/enrollments/:enrollmentId/graduation')
  @ApiOperation({ summary: r.graduation.summary })
  @ZodResponse({ status: 200, type: GraduationDto })
  getGraduation(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.graduation.get(principal, p.enrollmentId);
  }

  @Put('programs/enrollments/:enrollmentId/graduation/:key')
  @ApiOperation({ summary: r.confirmRequirement.summary })
  @ZodResponse({ status: 200, type: GraduationDto })
  confirm(@Param() p: RequirementParamsDto, @Body() dto: ConfirmRequirementDto, @CurrentPrincipal() principal: Principal) {
    return this.graduation.confirm(principal, p.enrollmentId, p.key, dto);
  }

  @Post('programs/enrollments/:enrollmentId/graduate')
  @HttpCode(200)
  @ApiOperation({ summary: r.graduate.summary })
  @ZodResponse({ status: 200, type: GraduationDto })
  graduate(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.graduation.graduate(principal, p.enrollmentId);
  }

  @Get('cohorts/:cohortId/graduation')
  @ApiOperation({ summary: r.graduationBoard.summary })
  @ZodResponse({ status: 200, type: GraduationBoardDto })
  graduationBoard(@Param() p: CohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.graduation.board(principal, p.cohortId);
  }

  // ---------- portfolio ----------

  @Get('programs/enrollments/:enrollmentId/portfolio')
  @ApiOperation({ summary: r.portfolio.summary })
  @ZodResponse({ status: 200, type: PortfolioDto })
  getPortfolio(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.portfolio.get(principal, p.enrollmentId);
  }

  @Post('programs/enrollments/:enrollmentId/portfolio/share')
  @HttpCode(200)
  @ApiOperation({ summary: r.sharePortfolio.summary })
  @ZodResponse({ status: 200, type: PortfolioDto })
  share(@Param() p: EnrollmentParamsDto, @Body() dto: ShareDto, @CurrentPrincipal() principal: Principal) {
    return this.portfolio.share(principal, p.enrollmentId, dto.shared);
  }
}

/** Published portfolios and credential checks: anyone with the link or the code. */
@ApiTags('outcomes')
@Controller('v1/learning')
export class PublicOutcomesController {
  constructor(
    private readonly portfolio: PortfolioService,
    private readonly credentials: CredentialsService,
  ) {}

  @Get('portfolios/:token')
  @Public()
  @ApiOperation({ summary: r.publicPortfolio.summary })
  @ZodResponse({ status: 200, type: PortfolioDto })
  published(@Param() p: TokenParamsDto) {
    return this.portfolio.published(p.token);
  }

  @Get('credentials/:code')
  @Public()
  @ApiOperation({ summary: r.verifyCredential.summary })
  @ZodResponse({ status: 200, type: CredentialDto })
  verify(@Param() p: CodeParamsDto) {
    return this.credentials.verify(p.code);
  }
}

/** My credentials, and revoking one the organisation issued (CRED-1). */
@ApiTags('outcomes')
@Authenticated()
@Controller('v1/learning')
export class CredentialsController {
  constructor(private readonly credentials: CredentialsService) {}

  @Get('me/credentials')
  @ApiOperation({ summary: r.myCredentials.summary })
  @ZodResponse({ status: 200, type: CredentialListDto })
  mine(@CurrentPrincipal() principal: Principal) {
    return this.credentials.mine(principal);
  }

  @Post('credentials/:code/revoke')
  @HttpCode(200)
  @ApiOperation({ summary: r.revokeCredential.summary })
  @ZodResponse({ status: 200, type: CredentialDto })
  revoke(@Param() p: CodeParamsDto, @Body() dto: RevokeDto, @CurrentPrincipal() principal: Principal) {
    return this.credentials.revoke(principal, p.code, dto.reason);
  }
}
