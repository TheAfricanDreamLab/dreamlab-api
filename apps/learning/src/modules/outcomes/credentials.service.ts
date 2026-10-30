import { Injectable } from '@nestjs/common';
import type { Credential } from '@dreamlab/contracts';
import { hasOrgPermission, type Principal } from '@lib/auth';
import { forbidden, newId, notFound } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { and, desc, eq, sql } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { LearningDatabase, LearningTx, schema } from '../../database';
import { ProgressService } from './progress.service';

const { credentials } = schema;
type CredentialRow = typeof credentials.$inferSelect;

/** No 0/O or 1/I: codes are read aloud and typed from paper. */
export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** DL-XXXX-XXXX-XXXX: 60 random bits, unguessable and easy to read. */
export function credentialCode(random: (max: number) => number = randomInt): string {
  const group = () => Array.from({ length: 4 }, () => CODE_ALPHABET[random(CODE_ALPHABET.length)]).join('');
  return `DL-${group()}-${group()}-${group()}`;
}

export interface IssueInput {
  kind: 'programme_graduation' | 'course_completion';
  userId: string;
  issuerOrgId: string | null;
  programEnrollmentId?: string;
  courseEnrollmentId?: string;
  title: string;
  scorePct: number | null;
  creditHours: number | null;
}

/**
 * Credentials (CRED-1): programme graduations and course certificates. Anyone can check one at
 * /verify/<code>; the issuing organisation can revoke it, with a reason that stays on record.
 */
@Injectable()
export class CredentialsService {
  constructor(
    @InjectDatabase() private readonly db: LearningDatabase,
    private readonly progress: ProgressService,
  ) {}

  /** Issues once per achievement, in the caller's transaction: issuing again returns the first. */
  async issue(tx: LearningTx, input: IssueInput): Promise<CredentialRow> {
    const existing = await this.existing(tx, input);
    if (existing) return existing;
    const [recipientName, issuerName] = await Promise.all([
      this.progress.names([input.userId]).then((n) => n.get(input.userId) ?? 'Learner'),
      this.progress.orgName(input.issuerOrgId),
    ]);
    // A clash on the code (one in 2^60) or a concurrent issue is retried once, then read back.
    for (let attempt = 0; attempt < 3; attempt++) {
      const [row] = await tx
        .insert(credentials)
        .values({
          id: newId(),
          code: credentialCode(),
          kind: input.kind,
          userId: input.userId,
          issuerOrgId: input.issuerOrgId,
          programEnrollmentId: input.programEnrollmentId ?? null,
          courseEnrollmentId: input.courseEnrollmentId ?? null,
          recipientName,
          title: input.title,
          issuerName,
          scorePct: input.scorePct,
          creditHours: input.creditHours,
        })
        .onConflictDoNothing()
        .returning();
      if (row) return row;
      const raced = await this.existing(tx, input);
      if (raced) return raced;
    }
    throw new Error('Could not issue a credential code');
  }

  async mine(p: Principal): Promise<{ items: Credential[] }> {
    const rows = await this.db.sys.select().from(credentials).where(eq(credentials.userId, p.userId)).orderBy(desc(credentials.issuedAt));
    return { items: rows.map(toCredential) };
  }

  async verify(code: string): Promise<Credential> {
    const [row] = await this.db.sys.select().from(credentials).where(eq(credentials.code, code));
    if (!row) throw notFound('credential_not_found', 'No credential has this code. Check it and try again.');
    return toCredential(row);
  }

  async revoke(p: Principal, code: string, reason: string): Promise<Credential> {
    const [row] = await this.db.sys.select().from(credentials).where(eq(credentials.code, code));
    if (!row) throw notFound('credential_not_found', 'Credential not found');
    const allowed = (p.platformAdmin && !p.stale) || (!!row.issuerOrgId && row.issuerOrgId === p.orgId && hasOrgPermission(p, 'cohort.manage'));
    if (!allowed) throw forbidden('permission_denied', 'Only the issuing organisation’s managers can revoke this credential.');
    if (row.revokedAt) return toCredential(row);
    const [updated] = await this.db.system((tx) =>
      tx.update(credentials).set({ revokedAt: new Date(), revokedReason: reason, revokedByUserId: p.userId }).where(eq(credentials.id, row.id)).returning(),
    );
    return toCredential(updated!);
  }

  async forProgramEnrollment(programEnrollmentId: string): Promise<CredentialRow | null> {
    const [row] = await this.db.sys
      .select()
      .from(credentials)
      .where(and(eq(credentials.programEnrollmentId, programEnrollmentId), eq(credentials.kind, 'programme_graduation')));
    return row ?? null;
  }

  private async existing(tx: LearningTx, input: IssueInput): Promise<CredentialRow | undefined> {
    const where =
      input.kind === 'programme_graduation'
        ? and(eq(credentials.kind, 'programme_graduation'), eq(credentials.programEnrollmentId, input.programEnrollmentId ?? sql`null`))
        : and(eq(credentials.kind, 'course_completion'), eq(credentials.courseEnrollmentId, input.courseEnrollmentId ?? sql`null`));
    const [row] = await tx.select().from(credentials).where(where);
    return row;
  }
}

export function toCredential(r: CredentialRow): Credential {
  return {
    code: r.code,
    kind: r.kind,
    recipientName: r.recipientName,
    title: r.title,
    issuerName: r.issuerName,
    issuedAt: r.issuedAt.toISOString(),
    scorePct: r.scorePct,
    creditHours: r.creditHours,
    revoked: r.revokedAt ? { at: r.revokedAt.toISOString(), reason: r.revokedReason ?? '' } : null,
  };
}
