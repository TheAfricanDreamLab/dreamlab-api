import { Logger, Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import type { IamConfig } from '../../config';
import { UsersModule } from '../users/users.module';
import { DomainsController } from './domains.controller';
import { DomainsService, TXT_LOOKUP } from './domains.service';
import { publicTxtLookup, TRUST_ALL_DOMAINS } from './utils/dns-txt';

@Module({
  imports: [UsersModule],
  controllers: [DomainsController],
  providers: [
    DomainsService,
    {
      provide: TXT_LOOKUP,
      inject: [CONFIG],
      useFactory: (config: IamConfig) => {
        if (config.DOMAIN_VERIFY_MODE !== 'trust') return publicTxtLookup();
        // Development only (refused in production): any claimed domain verifies without DNS.
        new Logger('Domains').warn('DOMAIN_VERIFY_MODE=trust: domains verify without a DNS check');
        return TRUST_ALL_DOMAINS;
      },
    },
  ],
  exports: [DomainsService],
})
export class DomainsModule {}
