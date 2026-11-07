import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { AuthoringService } from './authoring.service';
import { CollabService } from './collab.service';
import {
  AddCommentDto,
  AuthoringOverviewDto,
  CommentDto,
  CommentListDto,
  CommentParamsDto,
  HeartbeatDto,
  PresenceListDto,
  UpdateCommentDto,
  CourseMediaUploadDto,
  CourseMediaUploadRequestDto,
  CreateDraftDto,
  DraftDto,
  DraftHistoryDocDto,
  DraftHistoryDto,
  DraftParamsDto,
  DraftRevisionParamsDto,
  EmptyBodyDto,
  RequestChangesDto,
  RestoreDraftDto,
  ReviewNoteDto,
  SaveDraftDto,
} from './dto/authoring.dto';

const r = apiV1Contract.authoring;

/** Authors and reviewers are told apart per draft (course.content.edit, course.publish), so the service decides. */
@ApiTags('authoring')
@Controller('v1/catalog/authoring')
export class AuthoringController {
  constructor(
    private readonly authoring: AuthoringService,
    private readonly collab: CollabService,
  ) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: r.overview.summary })
  @ZodResponse({ status: 200, type: AuthoringOverviewDto })
  overview(@CurrentPrincipal() principal: Principal) {
    return this.authoring.overview(principal);
  }

  @Post('drafts')
  @Authenticated()
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: DraftDto })
  create(@Body() dto: CreateDraftDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.create(principal, dto);
  }

  @Get('drafts/:draftId')
  @Authenticated()
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  get(@Param() p: DraftParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.get(principal, p.draftId);
  }

  @Put('drafts/:draftId')
  @Authenticated()
  @ApiOperation({ summary: r.save.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  save(@Param() p: DraftParamsDto, @Body() dto: SaveDraftDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.save(principal, p.draftId, dto);
  }

  @Get('drafts/:draftId/history')
  @Authenticated()
  @ApiOperation({ summary: r.history.summary })
  @ZodResponse({ status: 200, type: DraftHistoryDto })
  history(@Param() p: DraftParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.history(principal, p.draftId);
  }

  @Get('drafts/:draftId/history/:revision')
  @Authenticated()
  @ApiOperation({ summary: r.historyDoc.summary })
  @ZodResponse({ status: 200, type: DraftHistoryDocDto })
  historyDoc(@Param() p: DraftRevisionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.historyDoc(principal, p.draftId, p.revision);
  }

  @Post('drafts/:draftId/restore')
  @HttpCode(200)
  @Authenticated()
  @ApiOperation({ summary: r.restore.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  restore(@Param() p: DraftParamsDto, @Body() dto: RestoreDraftDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.restore(principal, p.draftId, dto);
  }

  @Post('drafts/:draftId/submit')
  @HttpCode(200)
  @Authenticated()
  @ApiOperation({ summary: r.submit.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  submit(@Param() p: DraftParamsDto, @Body() _dto: EmptyBodyDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.submit(principal, p.draftId);
  }

  @Post('drafts/:draftId/withdraw')
  @HttpCode(200)
  @Authenticated()
  @ApiOperation({ summary: r.withdraw.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  withdraw(@Param() p: DraftParamsDto, @Body() _dto: EmptyBodyDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.withdraw(principal, p.draftId);
  }

  @Post('drafts/:draftId/request-changes')
  @HttpCode(200)
  @Authenticated()
  @ApiOperation({ summary: r.requestChanges.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  requestChanges(@Param() p: DraftParamsDto, @Body() dto: RequestChangesDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.requestChanges(principal, p.draftId, dto.note);
  }

  @Post('drafts/:draftId/publish')
  @HttpCode(200)
  @Authenticated()
  @ApiOperation({ summary: r.publish.summary })
  @ZodResponse({ status: 200, type: DraftDto })
  publish(@Param() p: DraftParamsDto, @Body() dto: ReviewNoteDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.publish(principal, p.draftId, dto.note);
  }

  @Post('drafts/:draftId/media')
  @Authenticated()
  @ApiOperation({ summary: r.uploadMedia.summary })
  @ZodResponse({ status: 201, type: CourseMediaUploadDto })
  uploadMedia(@Param() p: DraftParamsDto, @Body() dto: CourseMediaUploadRequestDto, @CurrentPrincipal() principal: Principal) {
    return this.authoring.uploadMedia(principal, p.draftId, dto);
  }

  @Get('drafts/:draftId/comments')
  @Authenticated()
  @ApiOperation({ summary: r.comments.summary })
  @ZodResponse({ status: 200, type: CommentListDto })
  comments(@Param() p: DraftParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.collab.comments(principal, p.draftId);
  }

  @Post('drafts/:draftId/comments')
  @Authenticated()
  @ApiOperation({ summary: r.addComment.summary })
  @ZodResponse({ status: 201, type: CommentDto })
  addComment(@Param() p: DraftParamsDto, @Body() dto: AddCommentDto, @CurrentPrincipal() principal: Principal) {
    return this.collab.add(principal, p.draftId, dto);
  }

  @Patch('drafts/:draftId/comments/:commentId')
  @Authenticated()
  @ApiOperation({ summary: r.updateComment.summary })
  @ZodResponse({ status: 200, type: CommentDto })
  updateComment(@Param() p: CommentParamsDto, @Body() dto: UpdateCommentDto, @CurrentPrincipal() principal: Principal) {
    return this.collab.update(principal, p.draftId, p.commentId, dto);
  }

  @Delete('drafts/:draftId/comments/:commentId')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.removeComment.summary })
  async removeComment(@Param() p: CommentParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.collab.remove(principal, p.draftId, p.commentId);
  }

  @Post('drafts/:draftId/presence')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.presence.summary })
  @ZodResponse({ status: 200, type: PresenceListDto })
  presence(@Param() p: DraftParamsDto, @Body() dto: HeartbeatDto, @CurrentPrincipal() principal: Principal) {
    return this.collab.heartbeat(principal, p.draftId, dto);
  }

  @Delete('drafts/:draftId')
  @HttpCode(204)
  @Authenticated()
  @ApiOperation({ summary: r.remove.summary })
  async remove(@Param() p: DraftParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.authoring.remove(principal, p.draftId);
  }
}
