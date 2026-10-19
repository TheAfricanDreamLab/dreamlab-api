import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { GroupsController } from './controllers/groups.controller';
import { OrgUnitsController } from './controllers/org-units.controller';
import { GroupsService } from './services/groups.service';
import { OrgUnitsService } from './services/org-units.service';

@Module({
  imports: [MembersModule],
  controllers: [OrgUnitsController, GroupsController],
  providers: [OrgUnitsService, GroupsService],
})
export class OrgStructureModule {}
