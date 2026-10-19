import { newId } from '@lib/common';

export const EVENTS_EXCHANGE = 'dreamlab.events';
export const DEAD_LETTER_EXCHANGE = 'dreamlab.events.dlx';

export interface EventActor {
  type: 'user' | 'system' | 'service';
  id: string | null;
}

/** The wire format of every domain event. `type` is also the RabbitMQ routing key. */
export interface EventEnvelope<P = unknown> {
  id: string;
  type: string;
  version: number;
  source: string;
  occurredAt: string;
  orgId: string | null;
  actor: EventActor;
  requestId?: string | null;
  payload: P;
}

export interface NewEvent<P = unknown> {
  type: string;
  payload: P;
  orgId?: string | null;
  actor?: EventActor;
  version?: number;
  requestId?: string | null;
}

export const SYSTEM_ACTOR: EventActor = { type: 'system', id: null };
export const userActor = (userId: string | null | undefined): EventActor =>
  userId ? { type: 'user', id: userId } : SYSTEM_ACTOR;

export function createEnvelope<P>(source: string, event: NewEvent<P>, now = new Date()): EventEnvelope<P> {
  return {
    id: newId(),
    type: event.type,
    version: event.version ?? 1,
    source,
    occurredAt: now.toISOString(),
    orgId: event.orgId ?? null,
    actor: event.actor ?? SYSTEM_ACTOR,
    requestId: event.requestId ?? null,
    payload: event.payload,
  };
}
