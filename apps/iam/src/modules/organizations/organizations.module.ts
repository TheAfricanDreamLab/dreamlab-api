import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OrganizationsRpcController } from './controllers/organizations-rpc.controller';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [UsersModule],
  controllers: [OrganizationsController, OrganizationsRpcController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
