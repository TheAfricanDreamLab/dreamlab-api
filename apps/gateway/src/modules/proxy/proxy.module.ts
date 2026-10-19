import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [TenancyModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
