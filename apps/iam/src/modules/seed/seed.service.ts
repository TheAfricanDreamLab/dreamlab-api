import { Injectable, Logger } from '@nestjs/common';
import { SYSTEM_ROLES } from '@dreamlab/contracts';
import { newId } from '@lib/common';
import { InjectConfig } from '@lib/config';
import { InjectDatabase } from '@lib/database';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { IamConfig } from '../../config';
import { IamDatabase, IamTx, schema } from '../../database';
import { PasswordService } from '../auth/password.service';

const { roles, organizations, users, memberships, roleAssignments } = schema;

const DEMO_ORGS = [
  { slug: 'dreamlab', name: 'The African Dream Lab', kinds: ['institution', 'partner'] },
  { slug: 'acme', name: 'Acme Learning Co (demo enterprise)', kinds: ['enterprise'] },
] as const;

/**
 * Idempotent: safe on every boot. System roles are upserted from the contracts package, so the
 * permission catalog in the database always matches the code.
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectDatabase() private readonly db: IamDatabase,
    @InjectConfig() private readonly config: IamConfig,
    private readonly passwords: PasswordService,
  ) {}

  async run(): Promise<void> {
    const adminHash =
      this.config.BOOTSTRAP_ADMIN_EMAIL && this.config.BOOTSTRAP_ADMIN_PASSWORD
        ? await this.passwords.hash(this.config.BOOTSTRAP_ADMIN_PASSWORD)
        : null;
    await this.db.system(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('iam.seed'))`);
      await this.seedRoles(tx);
      const platformId = await this.ensureOrg(tx, this.config.PLATFORM_ORG_SLUG, 'African Dream Network (platform)', ['platform']);
      if (this.config.SEED_DEMO_ORGS) {
        for (const org of DEMO_ORGS) await this.ensureOrg(tx, org.slug, org.name, [...org.kinds]);
      }
      if (adminHash) await this.ensureBootstrapAdmin(tx, platformId, adminHash);
    });
    this.logger.log('Seed complete');
  }

  private async seedRoles(tx: IamTx): Promise<void> {
    for (const role of SYSTEM_ROLES) {
      const [existing] = await tx.select({ id: roles.id }).from(roles).where(and(isNull(roles.orgId), eq(roles.key, role.key)));
      const values = {
        name: role.name,
        description: role.description,
        scopeTypes: [...role.scopeTypes],
        permissions: [...role.permissions],
        system: true,
      };
      if (existing) await tx.update(roles).set(values).where(eq(roles.id, existing.id));
      else await tx.insert(roles).values({ id: newId(), orgId: null, key: role.key, ...values });
    }
  }

  private async ensureOrg(tx: IamTx, slug: string, name: string, kinds: string[]): Promise<string> {
    const [existing] = await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, slug));
    if (existing) return existing.id;
    const id = newId();
    await tx.insert(organizations).values({ id, slug, name, kinds });
    const profiles = { institution: schema.institutionProfiles, enterprise: schema.enterpriseProfiles, partner: schema.partnerProfiles, sponsor: schema.sponsorProfiles };
    for (const kind of kinds) {
      const table = profiles[kind as keyof typeof profiles];
      if (table) await tx.insert(table).values({ orgId: id });
    }
    this.logger.log(`Created organisation ${slug}`);
    return id;
  }

  private async ensureBootstrapAdmin(tx: IamTx, platformOrgId: string, passwordHash: string): Promise<void> {
    const email = this.config.BOOTSTRAP_ADMIN_EMAIL!.toLowerCase();
    let [user] = await tx.select().from(users).where(eq(users.email, email));
    if (!user) {
      [user] = await tx
        .insert(users)
        .values({ id: newId(), email, fullName: this.config.BOOTSTRAP_ADMIN_NAME, emailVerifiedAt: new Date() })
        .returning();
      await tx
        .insert(schema.userIdentities)
        .values({ id: newId(), userId: user!.id, provider: 'password', subject: user!.id, secretHash: passwordHash });
      this.logger.log(`Created bootstrap platform admin ${email}`);
    }
    let [membership] = await tx
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, user!.id), eq(memberships.orgId, platformOrgId)));
    if (!membership) {
      [membership] = await tx
        .insert(memberships)
        .values({ id: newId(), userId: user!.id, orgId: platformOrgId, status: 'active', source: 'bootstrap', joinedAt: new Date() })
        .returning();
    }
    const [role] = await tx.select({ id: roles.id }).from(roles).where(and(isNull(roles.orgId), eq(roles.key, 'platform_admin')));
    await tx
      .insert(roleAssignments)
      .values({ id: newId(), orgId: platformOrgId, membershipId: membership!.id, roleId: role!.id, scopeType: 'org' })
      .onConflictDoNothing();
  }
}
