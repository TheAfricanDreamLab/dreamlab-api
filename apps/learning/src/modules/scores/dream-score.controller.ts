import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract, DreamScoreDimensionSchema, DreamScoreSchema, DreamScoreWeightsSchema, type DreamScoreWeights, UuidSchema } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { DreamScoreService } from './dream-score.service';

const r = apiV1Contract.outcomes;

class EnrollmentParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema })) {}
class DreamScoreDto extends createZodDto(DreamScoreSchema) {}
class WeightsDto extends createZodDto(z.object({ weights: z.record(DreamScoreDimensionSchema, z.number().int()) })) {}
class SetWeightsDto extends createZodDto(z.object({ weights: DreamScoreWeightsSchema })) {}

/** The Dream Score™ (SCORE-1): a learner's competency radar, and the organisation's dimension weights. */
@ApiTags('dream-score')
@Authenticated()
@Controller('v1/learning')
export class DreamScoreController {
  constructor(private readonly scores: DreamScoreService) {}

  @Get('programs/enrollments/:enrollmentId/dream-score')
  @ApiOperation({ summary: r.dreamScore.summary })
  @ZodResponse({ status: 200, type: DreamScoreDto })
  dreamScore(@Param() p: EnrollmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.scores.get(principal, p.enrollmentId);
  }

  @Get('dream-score/weights')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.dreamScoreWeights.summary })
  @ZodResponse({ status: 200, type: WeightsDto })
  weights(@CurrentPrincipal() principal: Principal) {
    return this.scores.weights(principal);
  }

  @Put('dream-score/weights')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.setDreamScoreWeights.summary })
  @ZodResponse({ status: 200, type: WeightsDto })
  setWeights(@Body() dto: SetWeightsDto, @CurrentPrincipal() principal: Principal) {
    return this.scores.setWeights(principal, dto.weights as DreamScoreWeights);
  }
}
