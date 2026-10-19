import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { PlatformOverviewDto, PlatformUserDetailDto, PlatformUserListDto, SetUserStatusDto, UserListQueryDto, UserParamsDto } from './dto/platform.dto';
import { PlatformService } from './platform.service';

const r = apiV1Contract.platform;

@ApiTags('platform')
@Controller('v1/platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('overview')
  @RequirePermission('platform.users.read')
  @ApiOperation({ summary: r.overview.summary })
  @ZodResponse({ status: 200, type: PlatformOverviewDto })
  overview() {
    return this.platform.overview();
  }

  @Get('users')
  @RequirePermission('platform.users.read')
  @ApiOperation({ summary: r.listUsers.summary })
  @ZodResponse({ status: 200, type: PlatformUserListDto })
  list(@Query() query: UserListQueryDto) {
    return this.platform.listUsers(query);
  }

  @Get('users/:userId')
  @RequirePermission('platform.users.read')
  @ApiOperation({ summary: r.getUser.summary })
  @ZodResponse({ status: 200, type: PlatformUserDetailDto })
  get(@Param() p: UserParamsDto) {
    return this.platform.getUser(p.userId);
  }

  @Post('users/:userId/status')
  @HttpCode(200)
  @RequirePermission('platform.users.manage')
  @ApiOperation({ summary: r.setUserStatus.summary })
  @ZodResponse({ status: 200, type: PlatformUserDetailDto })
  setStatus(@Param() p: UserParamsDto, @Body() dto: SetUserStatusDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.platform.setStatus(principal, p.userId, dto.status, dto.reason, meta.requestId ?? undefined);
  }
}
