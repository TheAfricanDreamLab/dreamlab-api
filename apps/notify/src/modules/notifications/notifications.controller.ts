import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { NotificationListDto, NotificationListQueryDto, NotificationParamsDto, NotificationPreferencesDto, UnreadCountDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

const r = apiV1Contract.notifications;

@ApiTags('notifications')
@Controller('v1/notifications')
@Authenticated()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: NotificationListDto })
  list(@Query() q: NotificationListQueryDto, @CurrentPrincipal() p: Principal) {
    return this.notifications.list(p, q);
  }

  @Get('unread-count')
  @ApiOperation({ summary: r.unreadCount.summary })
  @ZodResponse({ status: 200, type: UnreadCountDto })
  unreadCount(@CurrentPrincipal() p: Principal) {
    return this.notifications.unreadCount(p);
  }

  @Post('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: r.markAllRead.summary })
  markAllRead(@CurrentPrincipal() p: Principal) {
    return this.notifications.markAllRead(p);
  }

  @Post(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: r.markRead.summary })
  markRead(@Param() params: NotificationParamsDto, @CurrentPrincipal() p: Principal) {
    return this.notifications.markRead(p, params.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: r.preferences.summary })
  @ZodResponse({ status: 200, type: NotificationPreferencesDto })
  preferences(@CurrentPrincipal() p: Principal) {
    return this.notifications.preferences(p);
  }

  @Put('preferences')
  @ApiOperation({ summary: r.updatePreferences.summary })
  @ZodResponse({ status: 200, type: NotificationPreferencesDto })
  updatePreferences(@Body() body: NotificationPreferencesDto, @CurrentPrincipal() p: Principal) {
    return this.notifications.updatePreferences(p, body);
  }
}
