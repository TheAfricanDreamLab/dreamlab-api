import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, OptionalPrincipal, Principal, Public, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { CohortsService } from './cohorts.service';
import {
  AttendanceSheetDto,
  ChooseElectiveDto,
  ClassSessionDto,
  CohortDetailDto,
  CohortListDto,
  CohortParamsDto,
  CreateCohortDto,
  JoinCohortDto,
  MarkAttendanceDto,
  MyProgramDto,
  MyProgramListDto,
  ProgramEnrollmentParamsDto,
  ProgramSlugParamsDto,
  RosterDto,
  SessionParamsDto,
  UpdateCohortDto,
  UpdateSessionDto,
} from './dto/cohorts.dto';
import { ProgramsService } from './programs.service';

const r = apiV1Contract.cohorts;

/** Cohorts as the host organisation's staff run them. */
@ApiTags('cohorts')
@Controller('v1/learning/cohorts')
export class CohortsController {
  constructor(private readonly cohorts: CohortsService) {}

  @Get()
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.adminList.summary })
  @ZodResponse({ status: 200, type: CohortListDto })
  list(@CurrentPrincipal() principal: Principal) {
    return this.cohorts.list(principal);
  }

  @Post()
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: CohortDetailDto })
  create(@Body() dto: CreateCohortDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.create(principal, dto);
  }

  @Get(':cohortId')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: CohortDetailDto })
  get(@Param() p: CohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.get(principal, p.cohortId);
  }

  @Patch(':cohortId')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.update.summary })
  @ZodResponse({ status: 200, type: CohortDetailDto })
  update(@Param() p: CohortParamsDto, @Body() dto: UpdateCohortDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.update(principal, p.cohortId, dto);
  }

  @Get(':cohortId/roster')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.roster.summary })
  @ZodResponse({ status: 200, type: RosterDto })
  roster(@Param() p: CohortParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.roster(principal, p.cohortId);
  }

  @Patch(':cohortId/sessions/:sessionId')
  @RequirePermission('cohort.manage')
  @ApiOperation({ summary: r.updateSession.summary })
  @ZodResponse({ status: 200, type: ClassSessionDto })
  updateSession(@Param() p: SessionParamsDto, @Body() dto: UpdateSessionDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.updateSession(principal, p.cohortId, p.sessionId, dto);
  }

  /** Teachers may take attendance too, so the service decides (cohort.manage or course_run.teach). */
  @Get(':cohortId/sessions/:sessionId/attendance')
  @Authenticated()
  @ApiOperation({ summary: r.attendance.summary })
  @ZodResponse({ status: 200, type: AttendanceSheetDto })
  attendance(@Param() p: SessionParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.attendance(principal, p.cohortId, p.sessionId);
  }

  @Put(':cohortId/sessions/:sessionId/attendance')
  @Authenticated()
  @ApiOperation({ summary: r.markAttendance.summary })
  @ZodResponse({ status: 200, type: AttendanceSheetDto })
  markAttendance(@Param() p: SessionParamsDto, @Body() dto: MarkAttendanceDto, @CurrentPrincipal() principal: Principal) {
    return this.cohorts.markAttendance(principal, p.cohortId, p.sessionId, dto);
  }
}

/** Programmes as learners take them: finding and joining an intake, my programme, electives. */
@ApiTags('cohorts')
@Controller('v1/learning')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get('programs/:slug/cohorts')
  @Public()
  @ApiOperation({ summary: r.listForProgram.summary })
  @ZodResponse({ status: 200, type: CohortListDto })
  listForProgram(@Param() p: ProgramSlugParamsDto, @OptionalPrincipal() principal: Principal | null) {
    return this.programs.listForProgram(principal, p.slug);
  }

  @Post('cohorts/:cohortId/join')
  @Authenticated()
  @ApiOperation({ summary: r.join.summary })
  @ZodResponse({ status: 201, type: MyProgramDto })
  join(@Param() p: CohortParamsDto, @Body() _dto: JoinCohortDto, @CurrentPrincipal() principal: Principal, @Req() req: { id?: string }) {
    return this.programs.join(principal, p.cohortId, req.id);
  }

  @Get('me/programs')
  @Authenticated()
  @ApiOperation({ summary: r.myPrograms.summary })
  @ZodResponse({ status: 200, type: MyProgramListDto })
  mine(@CurrentPrincipal() principal: Principal) {
    return this.programs.myPrograms(principal);
  }

  @Post('me/programs/:enrollmentId/electives')
  @HttpCode(200)
  @Authenticated()
  @ApiOperation({ summary: r.chooseElective.summary })
  @ZodResponse({ status: 200, type: MyProgramDto })
  chooseElective(@Param() p: ProgramEnrollmentParamsDto, @Body() dto: ChooseElectiveDto, @CurrentPrincipal() principal: Principal, @Req() req: { id?: string }) {
    return this.programs.chooseElective(principal, p.enrollmentId, dto.courseSlugs, req.id);
  }
}
