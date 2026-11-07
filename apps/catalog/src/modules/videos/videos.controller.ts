import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AutoCaptionsSchema,
  CaptionCueSchema,
  CaptionLangSchema,
  CreatedVideoSchema,
  CreateVideoSchema,
  LibraryVideoSchema,
  SaveCaptionsSchema,
  UuidSchema,
  VideoStatusSchema,
  VideoUploadLinkSchema,
  apiV1Contract,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { VideosService } from './videos.service';

class VideoDto extends createZodDto(LibraryVideoSchema) {}
class VideoListDto extends createZodDto(z.object({ items: z.array(LibraryVideoSchema) })) {}
class VideoListQueryDto extends createZodDto(z.object({ q: z.string().max(100).optional(), status: VideoStatusSchema.optional() })) {}
class CreateVideoDto extends createZodDto(CreateVideoSchema) {}
class CreatedVideoDto extends createZodDto(CreatedVideoSchema) {}
class VideoParamsDto extends createZodDto(z.object({ videoId: UuidSchema })) {}
class CaptionParamsDto extends createZodDto(z.object({ videoId: UuidSchema, lang: CaptionLangSchema })) {}
class RenameVideoDto extends createZodDto(z.object({ title: z.string().trim().min(1).max(200) }).strict()) {}
class UploadLinkDto extends createZodDto(VideoUploadLinkSchema) {}
class UploadStatusDto extends createZodDto(z.object({ received: z.array(z.number().int()), blocks: z.number().int() })) {}
class EmptyDto extends createZodDto(z.object({}).strict()) {}
class CaptionsDto extends createZodDto(z.object({ lang: z.string(), label: z.string(), cues: z.array(CaptionCueSchema) })) {}
class SaveCaptionsDto extends createZodDto(SaveCaptionsSchema) {}
class AutoCaptionsDto extends createZodDto(AutoCaptionsSchema) {}

const r = apiV1Contract.videos;

/** The organisation's video library (CAT-6). The service decides who may read or change it. */
@ApiTags('videos')
@Controller('v1/catalog/authoring/videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: VideoListDto })
  list(@Query() q: VideoListQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.list(principal, q);
  }

  @Post()
  @Authenticated()
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: CreatedVideoDto })
  create(@Body() dto: CreateVideoDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.create(principal, dto);
  }

  @Get(':videoId')
  @Authenticated()
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  get(@Param() p: VideoParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.get(principal, p.videoId);
  }

  @Patch(':videoId')
  @Authenticated()
  @ApiOperation({ summary: r.update.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  update(@Param() p: VideoParamsDto, @Body() dto: RenameVideoDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.rename(principal, p.videoId, dto.title);
  }

  @Delete(':videoId')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.remove.summary })
  async remove(@Param() p: VideoParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.videos.remove(principal, p.videoId);
  }

  @Post(':videoId/upload-link')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.uploadLink.summary })
  @ZodResponse({ status: 200, type: UploadLinkDto })
  uploadLink(@Param() p: VideoParamsDto, @Body() _dto: EmptyDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.uploadLinkFor(principal, p.videoId);
  }

  @Get(':videoId/upload-status')
  @Authenticated()
  @ApiOperation({ summary: r.uploadStatus.summary })
  @ZodResponse({ status: 200, type: UploadStatusDto })
  uploadStatus(@Param() p: VideoParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.uploadStatus(principal, p.videoId);
  }

  @Post(':videoId/uploaded')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.uploaded.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  uploaded(@Param() p: VideoParamsDto, @Body() _dto: EmptyDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.uploaded(principal, p.videoId);
  }

  @Post(':videoId/retry')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.retry.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  retry(@Param() p: VideoParamsDto, @Body() _dto: EmptyDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.retry(principal, p.videoId);
  }

  @Get(':videoId/captions/:lang')
  @Authenticated()
  @ApiOperation({ summary: r.captions.summary })
  @ZodResponse({ status: 200, type: CaptionsDto })
  captions(@Param() p: CaptionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.captions(principal, p.videoId, p.lang);
  }

  @Put(':videoId/captions/:lang')
  @Authenticated()
  @ApiOperation({ summary: r.saveCaptions.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  saveCaptions(@Param() p: CaptionParamsDto, @Body() dto: SaveCaptionsDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.saveCaptions(principal, p.videoId, p.lang, dto);
  }

  @Delete(':videoId/captions/:lang')
  @Authenticated()
  @ApiOperation({ summary: r.removeCaptions.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  removeCaptions(@Param() p: CaptionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.removeCaptions(principal, p.videoId, p.lang);
  }

  @Post(':videoId/captions-auto')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.autoCaptions.summary })
  @ZodResponse({ status: 200, type: VideoDto })
  autoCaptions(@Param() p: VideoParamsDto, @Body() dto: AutoCaptionsDto, @CurrentPrincipal() principal: Principal) {
    return this.videos.autoCaptions(principal, p.videoId, dto.lang);
  }
}
