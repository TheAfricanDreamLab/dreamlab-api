import { Global, Module } from '@nestjs/common';
import { SecretBox } from './secret-box.service';
import { SigningKeysService } from './signing-keys.service';

@Global()
@Module({ providers: [SecretBox, SigningKeysService], exports: [SecretBox, SigningKeysService] })
export class KeysModule {}
