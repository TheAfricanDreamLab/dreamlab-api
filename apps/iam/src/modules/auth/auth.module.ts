import { Module } from '@nestjs/common';
import { OtpModule } from '../otp/otp.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { WellKnownController } from './controllers/well-known.controller';
import { GoogleIdentityService } from './services/google-identity.service';
import { PasswordService } from './services/password.service';
import { SessionsService } from './services/sessions.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [UsersModule, OtpModule],
  controllers: [AuthController, WellKnownController],
  providers: [AuthService, GoogleIdentityService, PasswordService, SessionsService, TokenService],
  exports: [PasswordService],
})
export class AuthenticationModule {}
