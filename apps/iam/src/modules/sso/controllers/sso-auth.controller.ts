import { Body, Controller, Get, Header, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { OptionalPrincipal, Principal, Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import {
  ConnectionParamsDto,
  OidcCallbackDto,
  SamlAcceptedDto,
  SamlAcsDto,
  SsoDiscoverDto,
  SsoDiscoveryDto,
  SsoFinishDto,
  SsoResultDto,
  SsoStartDto,
  SsoStartRequestDto,
} from '../dto/sso.dto';
import { SsoSignInService } from '../services/sso-signin.service';

const r = apiV1Contract.auth;

/** Single sign-on with an organisation's identity provider (IAM-15 OIDC, IAM-16 SAML). */
@ApiTags('auth')
@Controller('v1/auth/sso')
export class SsoAuthController {
  constructor(private readonly sso: SsoSignInService) {}

  @Post('discover')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: r.discoverSso.summary })
  @ZodResponse({ status: 200, type: SsoDiscoveryDto })
  discover(@Body() dto: SsoDiscoverDto) {
    return this.sso.discover(dto);
  }

  @Post('start')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: r.startSso.summary })
  @ZodResponse({ status: 200, type: SsoStartDto })
  start(@Body() dto: SsoStartRequestDto, @OptionalPrincipal() principal: Principal | null, @Meta() meta: RequestMeta) {
    return this.sso.start(dto, principal ?? undefined, meta);
  }

  @Post('oidc/callback')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: r.oidcCallback.summary })
  @ZodResponse({ status: 200, type: SsoResultDto })
  oidcCallback(@Body() dto: OidcCallbackDto, @Meta() meta: RequestMeta) {
    return this.sso.oidcCallback(dto.state, dto.code, meta);
  }

  @Post('saml/acs')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: r.samlAcs.summary })
  @ZodResponse({ status: 200, type: SamlAcceptedDto })
  samlAcs(@Body() dto: SamlAcsDto) {
    return this.sso.samlAcs(dto.samlResponse, dto.relayState);
  }

  @Post('finish')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: r.finishSso.summary })
  @ZodResponse({ status: 200, type: SsoResultDto })
  finish(@Body() dto: SsoFinishDto, @Meta() meta: RequestMeta) {
    return this.sso.finish(dto.state, meta);
  }

  @Get('saml/:connectionId/metadata')
  @Public()
  @Header('content-type', 'application/samlmetadata+xml; charset=utf-8')
  @ApiProduces('application/samlmetadata+xml')
  @ApiOperation({ summary: r.samlMetadata.summary })
  metadata(@Param() p: ConnectionParamsDto) {
    return this.sso.metadata(p.connectionId);
  }
}
