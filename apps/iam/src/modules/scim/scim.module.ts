import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ScimAdminController } from './controllers/scim-admin.controller';
import { ScimController } from './controllers/scim.controller';
import { ScimTokenGuard } from './guards/scim-token.guard';
import { ScimGroupsService } from './services/scim-groups.service';
import { ScimSettingsService } from './services/scim-settings.service';
import { ScimUsersService } from './services/scim-users.service';

@Module({
  imports: [UsersModule],
  controllers: [ScimController, ScimAdminController],
  providers: [ScimUsersService, ScimGroupsService, ScimSettingsService, ScimTokenGuard],
})
export class ScimModule {}
