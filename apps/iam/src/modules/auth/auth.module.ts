import { Module } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { UsersModule } from '../users/users.module';
import { AuthController, WellKnownController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleIdentityService } from './google.service';
import { PasswordService } from './password.service';
import { SessionsService } from './sessions.service';
import { TokenService } from './token.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController, WellKnownController],
  providers: [AuthService, GoogleIdentityService, PasswordService, SessionsService, TokenService, OtpService],
  exports: [PasswordService],
})
export class AuthenticationModule {}
