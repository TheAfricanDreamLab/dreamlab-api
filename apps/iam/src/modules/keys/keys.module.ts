import { Global, Module } from '@nestjs/common';
import { SigningKeysService } from './signing-keys.service';

@Global()
@Module({ providers: [SigningKeysService], exports: [SigningKeysService] })
export class KeysModule {}
