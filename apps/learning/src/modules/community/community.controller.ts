import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  apiV1Contract,
  AssignMentorsSchema,
  DreamCircleSchema,
  FileLinkSchema,
  JoinTicketSchema,
  MentorAssignmentSchema,
  MentoringSchema,
  MentorMeetingSchema,
  MyCommunitySchema,
  RecordingUploadRequestSchema,
  RecordingUploadSchema,
  SaveCircleSchema,
  ScheduleMeetingSchema,
  SessionLiveSchema,
  UpdateMeetingSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, Public, RequirePermission } from '@lib/auth';
import { badRequest } from '@lib/common';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { CommunityService } from './community.service';
import { LiveService } from './live.service';

const r = apiV1Contract.community;
const Person = z.object({ userId: UuidSchema, name: z.string() });

class SessionParamsDto extends createZodDto(z.object({ cohortId: UuidSchema, sessionId: UuidSchema })) {}
class CohortParamsDto extends createZodDto(z.object({ cohortId: UuidSchema })) {}
class RecordingParamsDto extends createZodDto(z.object({ recordingId: UuidSchema })) {}
class AssignmentParamsDto extends createZodDto(z.object({ assignmentId: UuidSchema })) {}
class MeetingParamsDto extends createZodDto(z.object({ meetingId: UuidSchema })) {}
class CircleParamsDto extends createZodDto(z.object({ circleId: UuidSchema })) {}
class SessionLiveDto extends createZodDto(SessionLiveSchema) {}
class JoinTicketDto extends createZodDto(JoinTicketSchema) {}
class RecordingUploadRequestDto extends createZodDto(RecordingUploadRequestSchema) {}
class RecordingUploadDto extends createZodDto(RecordingUploadSchema) {}
class FileLinkDto extends createZodDto(FileLinkSchema) {}
class MentorsDto extends createZodDto(z.object({ items: z.array(MentorAssignmentSchema), candidates: z.array(Person) })) {}
class AssignMentorsDto extends createZodDto(AssignMentorsSchema) {}
class AssignmentListDto extends createZodDto(z.object({ items: z.array(MentorAssignmentSchema) })) {}
class MentoringDto extends createZodDto(MentoringSchema) {}
class ScheduleMeetingDto extends createZodDto(ScheduleMeetingSchema) {}
class UpdateMeetingDto extends createZodDto(UpdateMeetingSchema) {}
class MentorMeetingDto extends createZodDto(MentorMeetingSchema) {}
class CircleListDto extends createZodDto(z.object({ items: z.array(DreamCircleSchema) })) {}
class SaveCircleDto extends createZodDto(SaveCircleSchema) {}
class DreamCircleDto extends createZodDto(DreamCircleSchema) {}
class MyCommunityDto extends createZodDto(MyCommunitySchema) {}

/** Live class sessions and recordings (LIVE-1). */
@ApiTags('live')
@Authenticated()
@Controller('v1/learning')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get('cohorts/:cohortId/sessions/:sessionId/live')
  @ApiOperation({ summary: r.sessionLive.summary })
  @ZodResponse({ status: 200, type: SessionLiveDto })
  sessionLive(@Param() p: SessionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.live.sessionLive(principal, p.cohortId, p.sessionId);
  }

  @Post('cohorts/:cohortId/sessions/:sessionId/join')
  @HttpCode(200)
  @ApiOperation({ summary: r.joinSession.summary })
  @ZodResponse({ status: 200, type: JoinTicketDto })
  join(@Param() p: SessionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.live.joinSession(principal, p.cohortId, p.sessionId);
  }

  @Post('cohorts/:cohortId/sessions/:sessionId/recordings')
  @ApiOperation({ summary: r.uploadRecording.summary })
  @ZodResponse({ status: 201, type: RecordingUploadDto })
  upload(@Param() p: SessionParamsDto, @Body() dto: RecordingUploadRequestDto, @CurrentPrincipal() principal: Principal) {
    return this.live.uploadRecording(principal, p.cohortId, p.sessionId, dto);
  }

  @Get('recordings/:recordingId')
  @ApiOperation({ summary: r.recordingLink.summary })
  @ZodResponse({ status: 200, type: FileLinkDto })
  recording(@Param() p: RecordingParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.live.recordingLink(principal, p.recordingId);
  }
}

/**
 * The meeting provider's webhook. Not in the public contract: called by the provider (signed), not
 * by clients, straight on the private network (the gateway would re-encode the signed body).
 */
@Controller('v1/learning/meetings')
export class MeetingWebhookController {
  constructor(private readonly live: LiveService) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async webhook(@Req() req: { body: unknown }, @Headers('authorization') authorization: string | undefined) {
    if (typeof req.body !== 'string') throw badRequest('bad_webhook', 'Expected the provider’s raw event');
    if (!(await this.live.receive(req.body, authorization))) throw badRequest('bad_webhook', 'Unverified event');
    return { ok: true };
  }
}

/** Mentorship and Dream Circles (COMM-1). */
@ApiTags('community')
@Authenticated()
@Controller('v1/learning')
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('cohorts/:cohortId/mentors')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.mentors.summary })
  @ZodResponse({ status: 200, type: MentorsDto })
  mentors(@Param() p: CohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.community.mentors(principal, p.cohortId);
  }

  @Post('cohorts/:cohortId/mentors')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.assignMentors.summary })
  @ZodResponse({ status: 201, type: AssignmentListDto })
  assign(@Param() p: CohortParamsDto, @Body() dto: AssignMentorsDto, @CurrentPrincipal() principal: Principal) {
    return this.community.assignMentors(principal, p.cohortId, dto);
  }

  @Delete('mentor-assignments/:assignmentId')
  @HttpCode(204)
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.endAssignment.summary })
  async end(@Param() p: AssignmentParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.community.endAssignment(principal, p.assignmentId);
  }

  @Get('mentoring')
  @ApiOperation({ summary: r.mentoring.summary })
  @ZodResponse({ status: 200, type: MentoringDto })
  mentoring(@CurrentPrincipal() principal: Principal) {
    return this.community.mentoring(principal);
  }

  @Post('mentoring/meetings')
  @ApiOperation({ summary: r.scheduleMeeting.summary })
  @ZodResponse({ status: 201, type: MentorMeetingDto })
  schedule(@Body() dto: ScheduleMeetingDto, @CurrentPrincipal() principal: Principal) {
    return this.community.scheduleMeeting(principal, dto);
  }

  @Patch('mentoring/meetings/:meetingId')
  @ApiOperation({ summary: r.updateMeeting.summary })
  @ZodResponse({ status: 200, type: MentorMeetingDto })
  update(@Param() p: MeetingParamsDto, @Body() dto: UpdateMeetingDto, @CurrentPrincipal() principal: Principal) {
    return this.community.updateMeeting(principal, p.meetingId, dto);
  }

  @Post('mentoring/meetings/:meetingId/join')
  @HttpCode(200)
  @ApiOperation({ summary: r.joinMeeting.summary })
  @ZodResponse({ status: 200, type: JoinTicketDto })
  joinMeeting(@Param() p: MeetingParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.community.joinMeeting(principal, p.meetingId);
  }

  @Get('cohorts/:cohortId/circles')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.circles.summary })
  @ZodResponse({ status: 200, type: CircleListDto })
  circles(@Param() p: CohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.community.circles(principal, p.cohortId);
  }

  @Post('cohorts/:cohortId/circles')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.createCircle.summary })
  @ZodResponse({ status: 201, type: DreamCircleDto })
  createCircle(@Param() p: CohortParamsDto, @Body() dto: SaveCircleDto, @CurrentPrincipal() principal: Principal) {
    return this.community.createCircle(principal, p.cohortId, dto);
  }

  @Put('circles/:circleId')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.updateCircle.summary })
  @ZodResponse({ status: 200, type: DreamCircleDto })
  updateCircle(@Param() p: CircleParamsDto, @Body() dto: SaveCircleDto, @CurrentPrincipal() principal: Principal) {
    return this.community.updateCircle(principal, p.circleId, dto);
  }

  @Delete('circles/:circleId')
  @HttpCode(204)
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.deleteCircle.summary })
  async deleteCircle(@Param() p: CircleParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.community.deleteCircle(principal, p.circleId);
  }

  @Get('me/community')
  @ApiOperation({ summary: r.myCommunity.summary })
  @ZodResponse({ status: 200, type: MyCommunityDto })
  mine(@CurrentPrincipal() principal: Principal) {
    return this.community.myCommunity(principal);
  }
}
