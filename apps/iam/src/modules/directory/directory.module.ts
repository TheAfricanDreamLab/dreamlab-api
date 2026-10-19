import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { MeController } from './me.controller';
import { MembersController, RolesController } from './members.controller';
import { MembersService } from './members.service';
import { MembershipLoader } from './membership-loader';
import { OrganizationsController, OrganizationsRpcController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { StructureController } from './structure.controller';
import { StructureService } from './structure.service';

@Module({
  imports: [UsersModule],
  controllers: [
    MeController,
    OrganizationsController,
    OrganizationsRpcController,
    MembersController,
    RolesController,
    InvitationsController,
    StructureController,
  ],
  providers: [MembershipLoader, OrganizationsService, MembersService, InvitationsService, StructureService],
})
export class DirectoryModule {}
