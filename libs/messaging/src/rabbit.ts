import { Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { DEAD_LETTER_EXCHANGE, EVENTS_EXCHANGE, EventEnvelope } from './envelope';

export interface Subscription {
  /** Durable queue name, e.g. `gateway.tenant-cache`. One queue per consumer, shared by its replicas. */
  queue: string;
  /** Routing-key patterns, e.g. `org.*` or `member.joined`. */
  bindings: string[];
  handler: (event: EventEnvelope) => Promise<void>;
  prefetch?: number;
}

/** One resilient AMQP connection per service, with the shared topic exchange declared. */
export class RabbitConnection {
  private readonly logger = new Logger('RabbitMQ');
  private readonly connection: amqp.AmqpConnectionManager;
  readonly publisher: ChannelWrapper;
  private readonly consumers: ChannelWrapper[] = [];
  private connected = false;

  constructor(url: string, readonly serviceName: string) {
    this.connection = amqp.connect([url], { heartbeatIntervalInSeconds: 15, reconnectTimeInSeconds: 2 });
    this.connection.on('connect', () => {
      this.connected = true;
      this.logger.log('Connected');
    });
    this.connection.on('disconnect', ({ err }) => {
      this.connected = false;
      this.logger.warn(`Disconnected: ${err?.message ?? 'unknown'}`);
    });
    this.publisher = this.connection.createChannel({
      confirm: true,
      json: false,
      setup: (ch: Channel) => RabbitConnection.declareTopology(ch),
    });
  }

  static async declareTopology(ch: Channel): Promise<void> {
    await ch.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
    await ch.assertExchange(DEAD_LETTER_EXCHANGE, 'topic', { durable: true });
  }

  isConnected(): boolean {
    return this.connected;
  }

  async waitForConnect(timeoutMs = 15_000): Promise<void> {
    await Promise.race([
      this.publisher.waitForConnect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('RabbitMQ connection timeout')), timeoutMs)),
    ]);
  }

  /** Publish with a broker confirm; resolves only once RabbitMQ has the message. */
  async publish(envelope: EventEnvelope): Promise<void> {
    await this.publisher.publish(EVENTS_EXCHANGE, envelope.type, Buffer.from(JSON.stringify(envelope)), {
      persistent: true,
      messageId: envelope.id,
      type: envelope.type,
      contentType: 'application/json',
      appId: envelope.source,
      timestamp: Math.floor(Date.parse(envelope.occurredAt) / 1000),
      headers: { 'x-org-id': envelope.orgId ?? '', 'x-request-id': envelope.requestId ?? '' },
    });
  }

  /**
   * Consume events. A handler failure is retried once by requeue; a second failure
   * dead-letters the message to `<queue>.dlq` instead of looping forever.
   */
  subscribe(sub: Subscription): ChannelWrapper {
    const dlq = `${sub.queue}.dlq`;
    const channel = this.connection.createChannel({
      json: false,
      setup: async (ch: Channel) => {
        await RabbitConnection.declareTopology(ch);
        await ch.assertQueue(dlq, { durable: true });
        await ch.bindQueue(dlq, DEAD_LETTER_EXCHANGE, sub.queue);
        await ch.assertQueue(sub.queue, {
          durable: true,
          deadLetterExchange: DEAD_LETTER_EXCHANGE,
          deadLetterRoutingKey: sub.queue,
        });
        for (const pattern of sub.bindings) await ch.bindQueue(sub.queue, EVENTS_EXCHANGE, pattern);
        await ch.prefetch(sub.prefetch ?? 16);
        await ch.consume(sub.queue, (msg) => void this.handle(ch, msg, sub));
      },
    });
    this.consumers.push(channel);
    return channel;
  }

  private async handle(ch: Channel, msg: ConsumeMessage | null, sub: Subscription): Promise<void> {
    if (!msg) return;
    let envelope: EventEnvelope;
    try {
      envelope = JSON.parse(msg.content.toString('utf8')) as EventEnvelope;
    } catch {
      this.logger.error(`Unparseable message on ${sub.queue}; dead-lettering`);
      this.settle(() => ch.nack(msg, false, false));
      return;
    }
    try {
      await sub.handler(envelope);
      this.settle(() => ch.ack(msg));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Handler failed on ${sub.queue} for ${envelope.type} ${envelope.id}: ${message}`);
      this.settle(() => ch.nack(msg, false, !msg.fields.redelivered));
    }
  }

  /**
   * Ack or nack, unless the channel closed meanwhile (reconnect, shutdown): the broker then
   * redelivers the unacknowledged message itself, so there is nothing left to do.
   */
  private settle(fn: () => void): void {
    try {
      fn();
    } catch (err) {
      this.logger.warn(`Channel closed before the message was settled; it will be redelivered (${err instanceof Error ? err.message : String(err)})`);
    }
  }

  async close(): Promise<void> {
    await Promise.allSettled([...this.consumers.map((c) => c.close()), this.publisher.close()]);
    await this.connection.close();
  }
}
