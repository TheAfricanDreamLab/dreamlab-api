import { Module } from '@nestjs/common';
import { PasswordService } from '../auth/services/password.service';
import { SeedService } from './seed.service';

@Module({ providers: [SeedService, PasswordService], exports: [SeedService] })
export class SeedModule {}
