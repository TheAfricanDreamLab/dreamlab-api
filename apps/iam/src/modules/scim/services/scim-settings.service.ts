import { Injectable } from '@nestjs/common';
import type { Principal } from '@lib/auth';
import { conflict, newId, randomToken, sha256 } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { InjectOutbox, OutboxWriter, userActor } from '@lib/messaging';
import { eq, isNotNull } from 'drizzle-orm';
import type { RequestMeta } from '../../../common/interfaces/request-meta.interface';
import { IamDatabase, schema } from '../../../database';
import { IamEvents } from '../../../events';
import { ScimUsersService } from './scim-users.service';

const { scimDirectories, orgDomains } = schema;

/** Org admins turn SCIM on, rotate its token or turn it off. */
@Injectable()
export class ScimSettingsService {
  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectOutbox() private readonly outbox: OutboxWriter,
    private readonly scimUsers: ScimUsersService,
  ) {}

  private ctx(principal: Principal, orgId: string) {
    return { orgId, userId: principal.userId };
  }

  async get(principal: Principal, orgId: string) {
    const [dir] = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select().from(scimDirectories));
    return {
      baseUrl: this.scimUsers.base(),
      enabled: Boolean(dir),
      tokenHint: dir?.tokenHint ?? null,
      lastSyncAt: dir?.lastSyncAt?.toISOString() ?? null,
      createdAt: dir?.createdAt.toISOString() ?? null,
    };
  }

  /** A new token replaces the old one at once. It is shown once; only its hash is kept. */
  async createToken(principal: Principal, orgId: string, meta: RequestMeta) {
    const [domain] = await this.db.tenant(this.ctx(principal, orgId), (tx) => tx.select({ id: orgDomains.id }).from(orgDomains).where(isNotNull(orgDomains.verifiedAt)));
    if (!domain) throw conflict('domain_required', 'Verify at least one email domain first. SCIM only provisions addresses at your verified domains.');
    const token = `scim_${randomToken(32)}`;
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const values = { tokenHash: sha256(token), tokenHint: token.slice(0, 10) };
      const [existing] = await tx.select({ id: scimDirectories.id }).from(scimDirectories);
      if (existing) await tx.update(scimDirectories).set(values).where(eq(scimDirectories.id, existing.id));
      else await tx.insert(scimDirectories).values({ id: newId(), orgId, ...values });
      await this.outbox.add(tx, { type: IamEvents.ScimChanged, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload: { orgId, change: existing ? 'token_rotated' : 'enabled' } });
    });
    return { baseUrl: this.scimUsers.base(), token };
  }

  async disable(principal: Principal, orgId: string, meta: RequestMeta): Promise<void> {
    await this.db.tenant(this.ctx(principal, orgId), async (tx) => {
      const removed = await tx.delete(scimDirectories).returning({ id: scimDirectories.id });
      if (removed.length > 0) {
        await this.outbox.add(tx, { type: IamEvents.ScimChanged, orgId, actor: userActor(principal.userId), requestId: meta.requestId, payload: { orgId, change: 'disabled' } });
      }
    });
  }
}
