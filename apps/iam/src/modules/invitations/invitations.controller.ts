import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, RequirePermission } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { MembershipDto } from '../members/dto/membership.dto';
import { OrgParamsDto } from '../organizations/dto/org-params.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationParamsDto } from './dto/invitation-params.dto';
import { InvitationListQueryDto } from './dto/invitation-query.dto';
import { InvitationDto, InvitationPageDto } from './dto/invitation.dto';
import { InvitationsService } from './invitations.service';

const r = apiV1Contract.invitations;

@ApiTags('invitations')
@Controller('v1')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('orgs/:orgId/invitations')
  @RequirePermission('org.members.invite', { anyScope: true })
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: InvitationDto })
  create(
    @Param() params: OrgParamsDto,
    @Body() dto: CreateInvitationDto,
    @CurrentPrincipal() principal: Principal,
    @Meta() meta: RequestMeta,
  ) {
    return this.invitations.create(principal, params.orgId, dto, meta);
  }

  @Get('orgs/:orgId/invitations')
  @RequirePermission('org.members.invite')
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: InvitationPageDto })
  list(@Param() params: OrgParamsDto, @Query() query: InvitationListQueryDto, @CurrentPrincipal() principal: Principal) {
    return this.invitations.list(principal, params.orgId, query);
  }

  @Delete('orgs/:orgId/invitations/:invitationId')
  @RequirePermission('org.members.invite')
  @HttpCode(204)
  @ApiOperation({ summary: r.revoke.summary })
  async revoke(@Param() params: InvitationParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.invitations.revoke(principal, params.orgId, params.invitationId);
  }

  @Post('invitations/accept')
  @Authenticated()
  @ApiOperation({ summary: r.accept.summary })
  @ZodResponse({ status: 200, type: MembershipDto })
  accept(@Body() dto: AcceptInvitationDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.invitations.accept(principal, dto.token, meta);
  }
}
