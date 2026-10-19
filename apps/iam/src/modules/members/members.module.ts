import { Module } from '@nestjs/common';
import { RolesController } from './controllers/roles.controller';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembershipLoader } from './services/membership-loader.service';

@Module({
  controllers: [MembersController, RolesController],
  providers: [MembersService, MembershipLoader],
  exports: [MembershipLoader],
})
export class MembersModule {}
