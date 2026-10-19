import { Logger } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import type { DatabaseService, Tx } from '@lib/database';
import { EventEnvelope, NewEvent, createEnvelope } from './envelope';
import { inbox, outbox } from './schema';
import type { RabbitConnection } from './rabbit';

type AnySchema = Record<string, unknown>;

/** Writes events into the outbox inside the caller's transaction. */
export class OutboxWriter {
  constructor(private readonly source: string) {}

  async add<S extends AnySchema>(tx: Tx<S>, ...events: NewEvent[]): Promise<EventEnvelope[]> {
    if (events.length === 0) return [];
    const envelopes = events.map((e) => createEnvelope(this.source, e));
    await tx.insert(outbox).values(
      envelopes.map((env) => ({
        id: env.id,
        type: env.type,
        version: env.version,
        orgId: env.orgId,
        envelope: env,
        occurredAt: new Date(env.occurredAt),
      })),
    );
    return envelopes;
  }
}

export interface RelayOptions {
  intervalMs?: number;
  batchSize?: number;
  maxBackoffMs?: number;
}

/**
 * Moves outbox rows to RabbitMQ. Rows are claimed with FOR UPDATE SKIP LOCKED, so several
 * replicas can relay at once without double-publishing; a row is marked published only after
 * the broker confirms it. Delivery is at-least-once; consumers dedupe through the inbox.
 */
export class OutboxRelay {
  private readonly logger = new Logger('OutboxRelay');
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;

  constructor(
    private readonly db: DatabaseService<AnySchema>,
    private readonly rabbit: RabbitConnection,
    private readonly options: RelayOptions = {},
  ) {}

  start(): void {
    this.stopped = false;
    this.schedule(0);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    while (this.running) await new Promise((r) => setTimeout(r, 20));
  }

  private schedule(delay: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), delay);
  }

  private async tick(): Promise<void> {
    this.running = true;
    let published = 0;
    try {
      published = await this.drainOnce();
    } catch (err) {
      this.logger.error(`Relay pass failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.running = false;
      const batch = this.options.batchSize ?? 50;
      this.schedule(published >= batch ? 0 : (this.options.intervalMs ?? 500));
    }
  }

  /** Publish one batch. Returns how many events were published. Exposed for tests. */
  async drainOnce(): Promise<number> {
    if (!this.rabbit.isConnected()) return 0;
    const batchSize = this.options.batchSize ?? 50;
    const maxBackoff = this.options.maxBackoffMs ?? 60_000;
    return this.db.system(async (tx) => {
      const rows = await tx
        .select({ id: outbox.id, envelope: outbox.envelope, attempts: outbox.attempts })
        .from(outbox)
        .where(and(isNull(outbox.publishedAt), lte(outbox.availableAt, sql`now()`)))
        .orderBy(asc(outbox.occurredAt), asc(outbox.id))
        .limit(batchSize)
        .for('update', { skipLocked: true });
      if (rows.length === 0) return 0;

      const ok: string[] = [];
      for (const row of rows) {
        try {
          await this.rabbit.publish(row.envelope as EventEnvelope);
          ok.push(row.id);
        } catch (err) {
          const backoff = Math.min(maxBackoff, 1000 * 2 ** row.attempts);
          await tx
            .update(outbox)
            .set({
              attempts: row.attempts + 1,
              lastError: err instanceof Error ? err.message : String(err),
              availableAt: sql`now() + ${`${backoff} milliseconds`}::interval`,
            })
            .where(eq(outbox.id, row.id));
        }
      }
      if (ok.length > 0) {
        await tx.update(outbox).set({ publishedAt: sql`now()` }).where(inArray(outbox.id, ok));
      }
      return ok.length;
    });
  }
}

/**
 * Run `fn` at most once per (consumer, event id), in one transaction with the inbox record.
 * Returns false when the event was already processed.
 */
export async function processOnce<S extends AnySchema>(
  db: DatabaseService<S>,
  consumer: string,
  eventId: string,
  fn: (tx: Tx<S>) => Promise<void>,
): Promise<boolean> {
  return db.system(async (tx) => {
    const inserted = await tx
      .insert(inbox)
      .values({ consumer, eventId })
      .onConflictDoNothing()
      .returning({ eventId: inbox.eventId });
    if (inserted.length === 0) return false;
    await fn(tx);
    return true;
  });
}
