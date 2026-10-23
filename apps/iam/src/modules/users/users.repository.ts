import { Injectable } from '@nestjs/common';
import { newId } from '@lib/common';
import { InjectDatabase } from '@lib/database';
import { and, eq, or } from 'drizzle-orm';
import { IamDatabase, IamTx, schema } from '../../database';

export type UserRow = typeof schema.users.$inferSelect;
const { users, userIdentities } = schema;

export const isEmail = (identifier: string): boolean => identifier.includes('@');

/** Users are global (no tenant), so this repository uses the system connection. */
@Injectable()
export class UsersRepository {
  constructor(@InjectDatabase() private readonly db: IamDatabase) {}

  async findById(id: string, tx?: IamTx): Promise<UserRow | null> {
    const [row] = await (tx ?? this.db.sys).select().from(users).where(eq(users.id, id));
    return row ?? null;
  }

  async findByIdentifier(identifier: string, tx?: IamTx): Promise<UserRow | null> {
    const [row] = await (tx ?? this.db.sys)
      .select()
      .from(users)
      .where(isEmail(identifier) ? eq(users.email, identifier) : eq(users.phone, identifier));
    return row ?? null;
  }

  async findByEmailOrPhone(email: string | null, phone: string | null, tx?: IamTx): Promise<UserRow | null> {
    const conditions = [email ? eq(users.email, email) : undefined, phone ? eq(users.phone, phone) : undefined].filter(Boolean);
    if (conditions.length === 0) return null;
    const [row] = await (tx ?? this.db.sys).select().from(users).where(or(...conditions));
    return row ?? null;
  }

  async create(
    tx: IamTx,
    input: { email: string | null; phone: string | null; fullName: string; locale: string },
  ): Promise<UserRow> {
    const [row] = await tx.insert(users).values({ id: newId(), ...input }).returning();
    return row!;
  }

  async update(tx: IamTx, id: string, patch: Partial<Pick<UserRow, 'fullName' | 'locale' | 'status'>>): Promise<void> {
    await tx.update(users).set(patch).where(eq(users.id, id));
  }

  async passwordHash(userId: string): Promise<string | null> {
    const [row] = await this.db.sys
      .select({ hash: userIdentities.secretHash })
      .from(userIdentities)
      .where(and(eq(userIdentities.userId, userId), eq(userIdentities.provider, 'password')));
    return row?.hash ?? null;
  }

  async setPassword(tx: IamTx, userId: string, hash: string): Promise<void> {
    await tx
      .insert(userIdentities)
      .values({ id: newId(), userId, provider: 'password', subject: userId, secretHash: hash })
      .onConflictDoUpdate({
        target: [userIdentities.provider, userIdentities.subject],
        set: { secretHash: hash, updatedAt: new Date() },
      });
  }

  /** Remove the password sign-in (used for passwords nobody has proven they set: see AuthService.register). */
  async dropPassword(tx: IamTx, userId: string): Promise<void> {
    await tx.delete(userIdentities).where(and(eq(userIdentities.userId, userId), eq(userIdentities.provider, 'password')));
  }

  async markVerified(tx: IamTx, userId: string, identifier: string): Promise<void> {
    await tx
      .update(users)
      .set(isEmail(identifier) ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() })
      .where(eq(users.id, userId));
  }

  static isVerified(user: UserRow, identifier: string): boolean {
    return isEmail(identifier) ? user.emailVerifiedAt !== null : user.phoneVerifiedAt !== null;
  }

  static isAnyVerified(user: UserRow): boolean {
    return user.emailVerifiedAt !== null || user.phoneVerifiedAt !== null;
  }
}

/**
 * Lock a user's row for the rest of the transaction. Taken by everything that adds someone to an
 * organisation and by SCIM before it changes an account, so "does this person belong elsewhere?"
 * can't change between SCIM's check and its update.
 */
export async function lockUserRow(tx: IamTx, userId: string): Promise<void> {
  await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update');
}
