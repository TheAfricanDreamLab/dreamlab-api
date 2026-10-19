import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { LearningStatsDto } from '../enrollments/dto/learning.dto';
import { LearningStatsService } from './learning-stats.service';

@ApiTags('platform')
@Controller('v1/learning/admin')
export class LearningAdminController {
  constructor(private readonly stats: LearningStatsService) {}

  @Get('stats')
  @RequirePermission('platform.users.read')
  @ApiOperation({ summary: apiV1Contract.learning.adminStats.summary })
  @ZodResponse({ status: 200, type: LearningStatsDto })
  get() {
    return this.stats.stats();
  }
}
