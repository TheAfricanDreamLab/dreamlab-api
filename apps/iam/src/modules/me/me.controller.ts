import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiV1Contract } from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { MeDto } from './dto/me.dto';
import { MeService } from './me.service';

@ApiTags('me')
@Controller('v1/me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  @Authenticated()
  @ApiOperation({ summary: apiV1Contract.me.me.summary })
  @ZodResponse({ status: 200, type: MeDto })
  async me(@CurrentPrincipal() principal: Principal) {
    return this.meService.me(principal);
  }
}
