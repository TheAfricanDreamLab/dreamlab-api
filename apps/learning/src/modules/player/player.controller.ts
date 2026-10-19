import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import {
  AssignmentSubmissionDto,
  AssignmentSubmitDto,
  BlockResultDto,
  CheckDto,
  DiscussionDto,
  DiscussionPostDto,
  ItemParamsDto,
  ItemViewDto,
  ProgressUpdateDto,
  QuizAttemptDto,
  QuizSubmitDto,
  SaveProgressDto,
} from '../enrollments/dto/learning.dto';
import { PlayerService } from './player.service';

const r = apiV1Contract.learning;

@ApiTags('learning')
@Authenticated()
@Controller('v1/learning/enrollments/:enrollmentId/items/:itemId')
export class PlayerController {
  constructor(private readonly player: PlayerService) {}

  @Get()
  @ApiOperation({ summary: r.getItem.summary })
  @ZodResponse({ status: 200, type: ItemViewDto })
  get(@Param() p: ItemParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.player.getItem(principal, p.enrollmentId, p.itemId);
  }

  @Put('progress')
  @ApiOperation({ summary: r.saveProgress.summary })
  @ZodResponse({ status: 200, type: ProgressUpdateDto })
  save(@Param() p: ItemParamsDto, @Body() dto: SaveProgressDto, @CurrentPrincipal() principal: Principal) {
    return this.player.saveProgress(principal, p.enrollmentId, p.itemId, dto);
  }

  @Post('checks')
  @HttpCode(200)
  @ApiOperation({ summary: r.check.summary })
  @ZodResponse({ status: 200, type: BlockResultDto })
  check(@Param() p: ItemParamsDto, @Body() dto: CheckDto, @CurrentPrincipal() principal: Principal) {
    return this.player.check(principal, p.enrollmentId, p.itemId, dto.blockId, dto.response);
  }

  @Post('quiz-attempts')
  @ApiOperation({ summary: r.submitQuiz.summary })
  @ZodResponse({ status: 201, type: QuizAttemptDto })
  quiz(@Param() p: ItemParamsDto, @Body() dto: QuizSubmitDto, @CurrentPrincipal() principal: Principal) {
    return this.player.submitQuiz(principal, p.enrollmentId, p.itemId, dto.answers);
  }

  @Post('submissions')
  @ApiOperation({ summary: r.submitAssignment.summary })
  @ZodResponse({ status: 201, type: AssignmentSubmissionDto })
  submit(@Param() p: ItemParamsDto, @Body() dto: AssignmentSubmitDto, @CurrentPrincipal() principal: Principal) {
    return this.player.submitAssignment(principal, p.enrollmentId, p.itemId, dto);
  }

  @Post('discussion')
  @ApiOperation({ summary: r.postDiscussion.summary })
  @ZodResponse({ status: 201, type: DiscussionDto })
  discuss(@Param() p: ItemParamsDto, @Body() dto: DiscussionPostDto, @CurrentPrincipal() principal: Principal) {
    return this.player.postDiscussion(principal, p.enrollmentId, p.itemId, dto);
  }
}
