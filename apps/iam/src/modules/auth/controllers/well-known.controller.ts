import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { wellKnownContract } from '@dreamlab/contracts';
import { Public } from '@lib/auth';
import { ZodResponse } from 'nestjs-zod';
import { SigningKeysService } from '../../keys/signing-keys.service';
import { JwksDto } from '../dto/jwks.dto';

@ApiTags('auth')
@Controller('.well-known')
export class WellKnownController {
  constructor(private readonly keys: SigningKeysService) {}

  @Get('jwks.json')
  @Public()
  @ApiOperation({ summary: wellKnownContract.jwks.summary })
  @ZodResponse({ status: 200, type: JwksDto })
  jwks() {
    return this.keys.jwks();
  }
}
