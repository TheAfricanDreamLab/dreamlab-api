import { Injectable } from '@nestjs/common';
import { InjectConfig } from '@lib/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { IamConfig } from '../../config';

/**
 * AES-256-GCM with IAM_KEY_ENCRYPTION_SECRET, for secrets IAM must read back: signing keys, OIDC
 * client secrets and authenticator-app secrets. Format: v1.<iv>.<tag>.<ciphertext>, base64url.
 */
@Injectable()
export class SecretBox {
  private readonly key: Buffer;

  constructor(@InjectConfig() config: IamConfig) {
    this.key = Buffer.from(config.IAM_KEY_ENCRYPTION_SECRET, 'base64');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
  }

  decrypt(payload: string): string {
    const [version, iv, tag, ciphertext] = payload.split('.');
    if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Unrecognised encryption format');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
  }
}
