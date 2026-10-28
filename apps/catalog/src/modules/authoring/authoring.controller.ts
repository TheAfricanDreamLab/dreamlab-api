import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { AuthoringService } from './authoring.service';
import { AuthoringOverviewDto, CourseMediaUploadDto, CourseMediaUploadRequestDto, CreateDraftDto, DraftDto, DraftParamsDto, EmptyBodyDto, RequestChangesDto, ReviewNoteDto, SaveDraftDto } from './dto/authoring.dto';

const r = apiV1Contract.authoring;

/** Authors and reviewers are told apart per draft (course.content.edit, course.publish), so the service decides. */
@ApiTags('authoring')
@Controller('v1/catalog/authoring')
export class AuthoringController {
  constructor(private readonly authoring: AuthoringService) {}

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

  @Delete('drafts/:draftId')
  @HttpCode(204)
  @Authenticated()
  @ApiOperation({ summary: r.remove.summary })
  async remove(@Param() p: DraftParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.authoring.remove(principal, p.draftId);
  }
}
