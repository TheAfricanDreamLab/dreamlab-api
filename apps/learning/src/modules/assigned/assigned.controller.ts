import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  apiV1Contract,
  CreateLearningAssignmentSchema,
  LearningAssignmentDetailSchema,
  LearningAssignmentSchema,
  MyAssignmentSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { AssignedService } from './assigned.service';

const r = apiV1Contract.assignedLearning;
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

class LearningAssignmentParamsDto extends createZodDto(z.object({ assignmentId: UuidSchema })) {}
class CreateLearningAssignmentDto extends createZodDto(CreateLearningAssignmentSchema) {}
class UpdateLearningAssignmentDto extends createZodDto(z.object({ dueOn: DateOnly.nullable().optional(), note: z.string().trim().max(500).optional() }).strict()) {}
class LearningAssignmentListDto extends createZodDto(z.object({ items: z.array(LearningAssignmentSchema) })) {}
class LearningAssignmentDetailDto extends createZodDto(LearningAssignmentDetailSchema) {}
class MyAssignmentsDto extends createZodDto(z.object({ items: z.array(MyAssignmentSchema) })) {}

/** Assigned learning (ASSIGN-1): courses an organisation asks its people to take. */
@ApiTags('assigned-learning')
@Authenticated()
@Controller('v1/learning')
export class AssignedController {
  constructor(private readonly assigned: AssignedService) {}

  @Get('org/assignments')
  @RequirePermission('learning.assign')
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: LearningAssignmentListDto })
  list(@CurrentPrincipal() principal: Principal) {
    return this.assigned.list(principal);
  }

  @Post('org/assignments')
  @RequirePermission('learning.assign')
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: LearningAssignmentDetailDto })
  create(@Body() dto: CreateLearningAssignmentDto, @CurrentPrincipal() principal: Principal, @Req() req: { id?: string }) {
    return this.assigned.create(principal, dto, req.id);
  }

  @Get('org/assignments/:assignmentId')
  @RequirePermission('learning.assign')
  @ApiOperation({ summary: r.get.summary })
  @ZodResponse({ status: 200, type: LearningAssignmentDetailDto })
  get(@Param() p: LearningAssignmentParamsDto, @CurrentPrincipal() principal: Principal) {
    return this.assigned.get(principal, p.assignmentId);
  }

  @Patch('org/assignments/:assignmentId')
  @RequirePermission('learning.assign')
  @ApiOperation({ summary: r.update.summary })
  @ZodResponse({ status: 200, type: LearningAssignmentDetailDto })
  update(@Param() p: LearningAssignmentParamsDto, @Body() dto: UpdateLearningAssignmentDto, @CurrentPrincipal() principal: Principal) {
    return this.assigned.update(principal, p.assignmentId, dto);
  }

  @Delete('org/assignments/:assignmentId')
  @HttpCode(204)
  @RequirePermission('learning.assign')
  @ApiOperation({ summary: r.remove.summary })
  async remove(@Param() p: LearningAssignmentParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.assigned.remove(principal, p.assignmentId);
  }

  @Get('me/assigned')
  @ApiOperation({ summary: r.mine.summary })
  @ZodResponse({ status: 200, type: MyAssignmentsDto })
  mine(@CurrentPrincipal() principal: Principal) {
    return this.assigned.mine(principal);
  }
}
