import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [MembersModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
