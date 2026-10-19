import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, OptionalPrincipal, Principal, Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { CourseProgressDto, EnrollDto, EnrollmentDto, EnrollmentListDto, JournalDto, SlugParamsDto } from './dto/learning.dto';
import { EnrollmentsService } from './enrollments.service';

const r = apiV1Contract.learning;

@ApiTags('learning')
@Controller('v1/learning')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post('enrollments')
  @Authenticated()
  @ApiOperation({ summary: r.enroll.summary })
  @ZodResponse({ status: 201, type: EnrollmentDto })
  enroll(@Body() dto: EnrollDto, @CurrentPrincipal() principal: Principal, @Req() req: { id?: string }) {
    return this.enrollments.enroll(principal, dto.courseSlug, req.id);
  }

  @Get('enrollments')
  @Authenticated()
  @ApiOperation({ summary: r.myEnrollments.summary })
  @ZodResponse({ status: 200, type: EnrollmentListDto })
  mine(@CurrentPrincipal() principal: Principal) {
    return this.enrollments.mine(principal);
  }

  @Get('courses/:slug')
  @Public()
  @ApiOperation({ summary: r.courseProgress.summary })
  @ZodResponse({ status: 200, type: CourseProgressDto })
  progress(@Param() p: SlugParamsDto, @OptionalPrincipal() principal: Principal | null) {
    return this.enrollments.courseProgress(principal, p.slug);
  }

  @Get('journal')
  @Authenticated()
  @ApiOperation({ summary: r.journal.summary })
  @ZodResponse({ status: 200, type: JournalDto })
  journal(@CurrentPrincipal() principal: Principal) {
    return this.enrollments.journal(principal);
  }
}
