import { Module } from '@nestjs/common';
import { OrgRolesController } from './controllers/org-roles.controller';
import { RolesController } from './controllers/roles.controller';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MembershipLoader } from './services/membership-loader.service';
import { OrgRolesService } from './services/org-roles.service';

@Module({
  controllers: [MembersController, RolesController, OrgRolesController],
  providers: [MembersService, MembershipLoader, OrgRolesService],
  exports: [MembershipLoader],
})
export class MembersModule {}
