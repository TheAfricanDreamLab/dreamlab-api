import { Injectable } from '@nestjs/common';
import { InjectConfig } from '@lib/config';
import { Algorithm, hash, verify } from '@node-rs/argon2';
import type { IamConfig } from '../../config';

/** argon2id with OWASP-recommended parameters (19 MiB, t=2, p=1 by default). */
@Injectable()
export class PasswordService {
  private readonly options;
  private dummyHash: Promise<string> | null = null;

  constructor(@InjectConfig() config: IamConfig) {
    this.options = { algorithm: Algorithm.Argon2id, memoryCost: config.ARGON2_MEMORY_KIB, timeCost: 2, parallelism: 1 };
  }

  hash(password: string): Promise<string> {
    return hash(password, this.options);
  }

  async verify(storedHash: string, password: string): Promise<boolean> {
    try {
      return await verify(storedHash, password);
    } catch {
      return false;
    }
  }

  /** Spend the same time as a real check when the account does not exist (no user enumeration by timing). */
  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('dummy-password-for-timing-equalisation');
    await this.verify(await this.dummyHash, password);
    return false;
  }
}
