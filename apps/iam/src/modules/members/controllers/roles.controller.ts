import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { RoleListDto } from '../dto/role.dto';
import { MembersService } from '../members.service';

@ApiTags('roles')
@Controller('v1/roles')
export class RolesController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: apiV1Contract.roles.list.summary })
  @ZodResponse({ status: 200, type: RoleListDto })
  list(@CurrentPrincipal() principal: Principal) {
    return this.members.listRoles(principal);
  }
}
