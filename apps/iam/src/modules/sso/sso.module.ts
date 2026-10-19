import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import type { IamConfig } from '../../config';
import { AuthenticationModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { SsoAdminController } from './controllers/sso-admin.controller';
import { SsoAuthController } from './controllers/sso-auth.controller';
import { OidcClient } from './providers/oidc.client';
import { OIDC_CLIENT, SsoConnectionsService } from './services/sso-connections.service';
import { SsoSignInService } from './services/sso-signin.service';

@Module({
  imports: [AuthenticationModule, UsersModule],
  controllers: [SsoAuthController, SsoAdminController],
  providers: [
    SsoConnectionsService,
    SsoSignInService,
    { provide: OIDC_CLIENT, inject: [CONFIG], useFactory: (config: IamConfig) => new OidcClient(config.SSO_ALLOW_PRIVATE_URLS) },
  ],
})
export class SsoModule {}
