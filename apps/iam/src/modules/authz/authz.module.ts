import { Global, Module } from '@nestjs/common';
import { AUTHZ_CHECKER } from '@lib/auth';
import { AuthzService } from './authz.service';
import { AuthzRpcController } from './controllers/authz-rpc.controller';
import { LocalAuthzChecker } from './services/local-authz-checker.service';

@Global()
@Module({
  controllers: [AuthzRpcController],
  providers: [AuthzService, LocalAuthzChecker, { provide: AUTHZ_CHECKER, useExisting: LocalAuthzChecker }],
  exports: [AuthzService, AUTHZ_CHECKER],
})
export class AuthzModule {}
