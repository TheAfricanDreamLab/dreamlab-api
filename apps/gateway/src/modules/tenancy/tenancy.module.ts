import { Module } from '@nestjs/common';
import { TenantService } from './tenancy.service';

@Module({ providers: [TenantService], exports: [TenantService] })
export class TenancyModule {}
