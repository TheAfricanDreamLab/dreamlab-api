import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../auth/auth.module';
import { PlatformRpcController } from './platform-rpc.controller';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthenticationModule],
  controllers: [PlatformController, PlatformRpcController],
  providers: [PlatformService],
})
export class PlatformModule {}
