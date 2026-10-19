import { Module } from '@nestjs/common';
import { OtpModule } from '../otp/otp.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaController } from './controllers/mfa.controller';
import { WellKnownController } from './controllers/well-known.controller';
import { GoogleIdentityService } from './services/google-identity.service';
import { MfaService } from './services/mfa.service';
import { PasswordService } from './services/password.service';
import { SessionIssuer } from './services/session-issuer.service';
import { SessionsService } from './services/sessions.service';
import { SsoPolicy } from './services/sso-policy.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [UsersModule, OtpModule],
  controllers: [AuthController, MfaController, WellKnownController],
  providers: [AuthService, GoogleIdentityService, MfaService, PasswordService, SessionIssuer, SessionsService, SsoPolicy, TokenService],
  exports: [PasswordService, SessionIssuer, SessionsService, SsoPolicy],
})
export class AuthenticationModule {}
