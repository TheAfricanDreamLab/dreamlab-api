import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { AuthService } from '../auth.service';
import { EmptyBodyDto } from '../dto/empty-body.dto';
import { MfaCodeDto, MfaStatusDto, MfaVerifyDto, RecoveryCodesDto, TotpConfirmDto, TotpSetupDto } from '../dto/mfa.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { MfaService } from '../services/mfa.service';

const r = apiV1Contract.auth;

/** Authenticator apps and two-step sign-in (IAM-19). */
@ApiTags('auth')
@Controller('v1/auth/mfa')
export class MfaController {
  constructor(
    private readonly auth: AuthService,
    private readonly mfa: MfaService,
  ) {}

  @Post('verify')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: r.verifyMfa.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  verify(@Body() dto: MfaVerifyDto, @Meta() meta: RequestMeta) {
    return this.auth.verifyMfa(dto.mfaToken, dto.code, meta);
  }

  @Get()
  @Authenticated()
  @ApiOperation({ summary: r.mfaStatus.summary })
  @ZodResponse({ status: 200, type: MfaStatusDto })
  status(@CurrentPrincipal() principal: Principal) {
    return this.mfa.status(principal);
  }

  @Post('totp/setup')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.setupTotp.summary })
  @ZodResponse({ status: 200, type: TotpSetupDto })
  setup(@Body() _dto: EmptyBodyDto, @CurrentPrincipal() principal: Principal) {
    return this.mfa.setup(principal);
  }

  @Post('totp/confirm')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.confirmTotp.summary })
  @ZodResponse({ status: 200, type: RecoveryCodesDto })
  confirm(@Body() dto: TotpConfirmDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.mfa.confirm(principal, dto.code, meta);
  }

  @Post('step-up')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.stepUpMfa.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  stepUp(@Body() dto: MfaCodeDto, @CurrentPrincipal() principal: Principal) {
    return this.mfa.stepUp(principal, dto.code);
  }

  @Post('recovery-codes')
  @Authenticated()
  @HttpCode(200)
  @ApiOperation({ summary: r.regenerateRecoveryCodes.summary })
  @ZodResponse({ status: 200, type: RecoveryCodesDto })
  recoveryCodes(@Body() dto: MfaCodeDto, @CurrentPrincipal() principal: Principal) {
    return this.mfa.regenerateRecoveryCodes(principal, dto.code);
  }

  @Post('disable')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.disableMfa.summary })
  async disable(@Body() dto: MfaCodeDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.mfa.disable(principal, dto.code, meta);
  }
}
