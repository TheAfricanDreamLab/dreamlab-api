import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal, Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { Meta } from '../../common/decorators/request-meta.decorator';
import type { RequestMeta } from '../../common/interfaces/request-meta.interface';
import { AuthService } from './auth.service';
import { EmptyBodyDto } from './dto/empty-body.dto';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
import { LoginDto, OtpLoginDto } from './dto/login.dto';
import { OtpAcceptedDto, OtpRequestDto, VerifyDto } from './dto/otp.dto';
import { PasswordChangeDto, PasswordResetDto } from './dto/password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { SessionListDto, SessionParamsDto } from './dto/session.dto';
import { SwitchOrgDto } from './dto/switch-org.dto';
import { TokenResponseDto } from './dto/token-response.dto';

const r = apiV1Contract.auth;

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: r.register.summary })
  @ZodResponse({ status: 201, type: RegisterResponseDto })
  register(@Body() dto: RegisterDto, @Meta() meta: RequestMeta) {
    return this.auth.register(dto, meta);
  }

  @Post('otp')
  @Public()
  @ApiOperation({ summary: r.requestOtp.summary })
  @ZodResponse({ status: 202, type: OtpAcceptedDto })
  requestOtp(@Body() dto: OtpRequestDto, @Meta() meta: RequestMeta) {
    return this.auth.requestOtp(dto.identifier, dto.purpose, meta);
  }

  @Post('verify')
  @Public()
  @ApiOperation({ summary: r.verify.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  verify(@Body() dto: VerifyDto, @Meta() meta: RequestMeta) {
    return this.auth.verify(dto.identifier, dto.code, meta);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: r.login.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  login(@Body() dto: LoginDto, @Meta() meta: RequestMeta) {
    return this.auth.login(dto.identifier, dto.password, meta);
  }

  @Post('google')
  @Public()
  @ApiOperation({ summary: r.google.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  google(@Body() dto: GoogleSignInDto, @Meta() meta: RequestMeta) {
    return this.auth.googleSignIn(dto, meta);
  }

  @Post('login/otp')
  @Public()
  @ApiOperation({ summary: r.loginWithOtp.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  loginWithOtp(@Body() dto: OtpLoginDto, @Meta() meta: RequestMeta) {
    return this.auth.loginWithOtp(dto.identifier, dto.code, meta);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: r.refresh.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  refresh(@Body() dto: RefreshDto, @Meta() meta: RequestMeta) {
    return this.auth.refresh(dto.refreshToken, meta);
  }

  @Post('logout')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.logout.summary })
  async logout(@Body() _dto: EmptyBodyDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.auth.logout(principal, meta);
  }

  @Post('logout-all')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.logoutAll.summary })
  async logoutAll(@Body() _dto: EmptyBodyDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.auth.logoutAll(principal, meta);
  }

  @Post('password/reset')
  @Public()
  @HttpCode(204)
  @ApiOperation({ summary: r.resetPassword.summary })
  async resetPassword(@Body() dto: PasswordResetDto, @Meta() meta: RequestMeta) {
    await this.auth.resetPassword(dto.identifier, dto.code, dto.newPassword, meta);
  }

  @Post('password/change')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.changePassword.summary })
  async changePassword(@Body() dto: PasswordChangeDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.auth.changePassword(principal, dto.currentPassword, dto.newPassword, meta);
  }

  @Post('switch-org')
  @Authenticated()
  @ApiOperation({ summary: r.switchOrg.summary })
  @ZodResponse({ status: 200, type: TokenResponseDto })
  switchOrg(@Body() dto: SwitchOrgDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    return this.auth.switchOrg(principal, dto.orgId, meta);
  }

  @Get('sessions')
  @Authenticated()
  @ApiOperation({ summary: r.listSessions.summary })
  @ZodResponse({ status: 200, type: SessionListDto })
  listSessions(@CurrentPrincipal() principal: Principal) {
    return this.auth.listSessions(principal);
  }

  @Delete('sessions/:sessionId')
  @Authenticated()
  @HttpCode(204)
  @ApiOperation({ summary: r.revokeSession.summary })
  async revokeSession(@Param() params: SessionParamsDto, @CurrentPrincipal() principal: Principal, @Meta() meta: RequestMeta) {
    await this.auth.revokeSession(principal, params.sessionId, meta);
  }
}
