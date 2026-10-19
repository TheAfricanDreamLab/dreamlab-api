import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { exportJWK, generateKeyPair, importJWK, JWK, JWTHeaderParameters, KeyLike } from 'jose';
import type { IamConfig } from '../../config';
import { IamDatabase, schema } from '../../database';
import { SecretBox } from './secret-box.service';

const ALG = 'EdDSA';
const REFRESH_MS = 60_000;

interface LoadedKey {
  kid: string;
  status: 'active' | 'retiring';
  publicJwk: JWK;
  publicKey: KeyLike;
  privateKey?: KeyLike;
}

/**
 * Ed25519 signing keys, stored in the database with the private half encrypted at rest.
 * One key is active; retired keys stay published while tokens they signed may still be valid.
 */
@Injectable()
export class SigningKeysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SigningKeysService.name);
  private keys = new Map<string, LoadedKey>();
  private active: LoadedKey | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    private readonly box: SecretBox,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureActiveKey();
    await this.reload();
    this.timer = setInterval(() => void this.reload().catch((e) => this.logger.error(e)), REFRESH_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async signingKey(): Promise<{ kid: string; key: KeyLike }> {
    if (!this.active?.privateKey) await this.reload();
    if (!this.active?.privateKey) throw new Error('No active signing key');
    return { kid: this.active.kid, key: this.active.privateKey };
  }

  /** Key resolver for verifying tokens in-process (jose JWTVerifyGetKey). */
  readonly resolveKey = async (header: JWTHeaderParameters): Promise<KeyLike> => {
    if (header.alg !== ALG || !header.kid) throw new Error('Unsupported token header');
    let key = this.keys.get(header.kid);
    if (!key) {
      await this.reload();
      key = this.keys.get(header.kid);
    }
    if (!key) throw new Error('Unknown signing key');
    return key.publicKey;
  };

  jwks(): { keys: JWK[] } {
    return { keys: [...this.keys.values()].map((k) => ({ ...k.publicJwk, kid: k.kid, alg: ALG, use: 'sig' })) };
  }

  /** Make a new key active. The old one keeps verifying until its tokens have expired. */
  async rotate(): Promise<string> {
    const kid = await this.db.system(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('iam.signing_keys'))`);
      await tx.update(schema.signingKeys).set({ status: 'retiring', retiredAt: new Date() }).where(eq(schema.signingKeys.status, 'active'));
      return this.insertKey(tx);
    });
    await this.reload();
    this.logger.log(`Rotated signing key; active kid ${kid}`);
    return kid;
  }

  private async ensureActiveKey(): Promise<void> {
    await this.db.system(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('iam.signing_keys'))`);
      const [current] = await tx.select().from(schema.signingKeys).where(eq(schema.signingKeys.status, 'active')).limit(1);
      const maxAgeMs = this.config.SIGNING_KEY_MAX_AGE_DAYS * 86_400_000;
      if (current && Date.now() - current.createdAt.getTime() < maxAgeMs) return;
      if (current) {
        await tx.update(schema.signingKeys).set({ status: 'retiring', retiredAt: new Date() }).where(eq(schema.signingKeys.kid, current.kid));
      }
      const kid = await this.insertKey(tx);
      this.logger.log(`Created signing key ${kid}`);
    });
  }

  private async insertKey(tx: Parameters<Parameters<IamDatabase['system']>[0]>[0]): Promise<string> {
    const { publicKey, privateKey } = await generateKeyPair(ALG, { crv: 'Ed25519', extractable: true });
    const publicJwk = await exportJWK(publicKey);
    const privateJwk = await exportJWK(privateKey);
    const kid = createHash('sha256').update(publicJwk.x ?? '').digest('base64url').slice(0, 22);
    await tx.insert(schema.signingKeys).values({
      kid,
      alg: ALG,
      publicJwk,
      privateJwkEncrypted: this.encrypt(JSON.stringify(privateJwk)),
      status: 'active',
    });
    return kid;
  }

  private async reload(): Promise<void> {
    const graceMs = (this.config.ACCESS_TOKEN_TTL_SECONDS + 300) * 1000;
    const rows = await this.db.system(async (tx) => {
      // Retiring keys stop being published once nothing they signed can still be valid.
      await tx
        .update(schema.signingKeys)
        .set({ status: 'retired' })
        .where(and(eq(schema.signingKeys.status, 'retiring'), lt(schema.signingKeys.retiredAt, new Date(Date.now() - graceMs))));
      return tx.select().from(schema.signingKeys).where(inArray(schema.signingKeys.status, ['active', 'retiring']));
    });
    const next = new Map<string, LoadedKey>();
    let active: LoadedKey | null = null;
    for (const row of rows) {
      const publicJwk = row.publicJwk as JWK;
      const loaded: LoadedKey = {
        kid: row.kid,
        status: row.status as LoadedKey['status'],
        publicJwk,
        publicKey: (await importJWK(publicJwk, ALG)) as KeyLike,
      };
      if (row.status === 'active') {
        loaded.privateKey = (await importJWK(JSON.parse(this.decrypt(row.privateJwkEncrypted)) as JWK, ALG)) as KeyLike;
        active = loaded;
      }
      next.set(row.kid, loaded);
    }
    this.keys = next;
    this.active = active;
  }

  private encrypt(plaintext: string): string {
    return this.box.encrypt(plaintext);
  }

  private decrypt(payload: string): string {
    return this.box.decrypt(payload);
  }
}
