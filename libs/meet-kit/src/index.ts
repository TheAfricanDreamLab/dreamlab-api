import { HttpStatus, Logger } from '@nestjs/common';
import { AppException } from '@lib/common';
import { AccessToken, RoomServiceClient, TrackSource, WebhookReceiver } from 'livekit-server-sdk';
import { z } from 'zod';

/*
 * meet-kit (LIVE-1, Plan v1.1 §10): live rooms behind one small interface, with a LiveKit adapter.
 * LiveKit Cloud and a self-hosted LiveKit server speak the same API, so moving between them is a
 * change of settings (URL and keys), not of code. Rooms are created server-side only; names carry the
 * environment so one server can host staging and production side by side.
 */

export const meetKitConfigShape = {
  /** What browsers connect to, e.g. wss://rtc.learn.theafricandreamlab.com or wss://<project>.livekit.cloud. */
  LIVEKIT_URL: z.string().regex(/^wss?:\/\//, 'A ws:// or wss:// URL').optional(),
  /** The server API, from the services (http(s)://…); defaults to LIVEKIT_URL over http(s). */
  LIVEKIT_API_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().min(3).optional(),
  LIVEKIT_API_SECRET: z.string().min(16).optional(),
  /** Room-name prefix for this environment, e.g. dl-prod. */
  MEETINGS_ROOM_PREFIX: z.string().regex(/^[a-z0-9-]{2,24}$/).default('dl-dev'),
};

export interface MeetKitConfig {
  LIVEKIT_URL?: string;
  LIVEKIT_API_URL?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
  MEETINGS_ROOM_PREFIX: string;
}

export type LiveRole = 'host' | 'participant';

export interface JoinGrant {
  url: string;
  token: string;
  roomName: string;
  expiresAt: Date;
}

export interface ParticipantEvent {
  /** participant_joined | participant_left | room_finished | … */
  event: string;
  eventId: string;
  roomName: string;
  /** Our user id: tokens use it as the participant identity. */
  identity: string | null;
  at: Date;
}

const TOKEN_TTL_SECONDS = 2 * 3600;

export class MeetKit {
  private readonly logger = new Logger('MeetKit');
  private readonly rooms: RoomServiceClient | null;
  private readonly receiver: WebhookReceiver | null;

  constructor(private readonly config: MeetKitConfig) {
    const { LIVEKIT_URL: url, LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = config;
    if (url && key && secret) {
      this.rooms = new RoomServiceClient(config.LIVEKIT_API_URL ?? url.replace(/^ws/, 'http'), key, secret);
      this.receiver = new WebhookReceiver(key, secret);
    } else {
      this.rooms = null;
      this.receiver = null;
    }
  }

  get enabled(): boolean {
    return this.rooms !== null;
  }

  /** `<prefix>-<kind>-<id>`: one server hosts several environments without collisions. */
  roomName(kind: 'session' | 'mentor', id: string): string {
    return `${this.config.MEETINGS_ROOM_PREFIX}-${kind}-${id}`;
  }

  /** Is this room ours (this environment's)? Webhooks from a shared server arrive for every environment. */
  owns(roomName: string): boolean {
    return roomName.startsWith(`${this.config.MEETINGS_ROOM_PREFIX}-`);
  }

  /**
   * A join token for one person. Hosts can publish anything and moderate; in classes, participants
   * publish their microphone, and a camera and screen only when the host lets them (Plan: audio first
   * on low data). `participantVideo` lets participants use camera and screen too (one-to-one meetings).
   */
  async join(roomName: string, identity: string, name: string, role: LiveRole, emptyTimeoutMin = 30, options: { participantVideo?: boolean } = {}): Promise<JoinGrant> {
    const { rooms, config } = this.require();
    // Created server-side, idempotently, so a room exists only for a real session or meeting.
    await rooms.createRoom({ name: roomName, emptyTimeout: emptyTimeoutMin * 60, maxParticipants: 300 }).catch((err: unknown) => {
      this.logger.error(`Could not create room ${roomName}: ${err instanceof Error ? err.message : String(err)}`);
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'live_unavailable', 'Live classes are not available right now. Try again in a moment.');
    });
    const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, { identity, name, ttl: TOKEN_TTL_SECONDS });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishData: true,
      roomAdmin: role === 'host',
      canPublishSources: role === 'host' ? undefined : options.participantVideo ? [TrackSource.MICROPHONE, TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO] : [TrackSource.MICROPHONE],
    });
    return { url: config.LIVEKIT_URL!, token: await at.toJwt(), roomName, expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000) };
  }

  /** Verifies the provider's signature; null for anything that is not a valid event. */
  async receive(body: string, authorization: string | undefined): Promise<ParticipantEvent | null> {
    if (!this.receiver || !authorization) return null;
    try {
      const e = await this.receiver.receive(body, authorization);
      if (!e.room?.name) return null;
      return {
        event: e.event,
        eventId: e.id,
        roomName: e.room.name,
        identity: e.participant?.identity ?? null,
        at: new Date(Number(e.createdAt ?? 0) * 1000 || Date.now()),
      };
    } catch {
      return null;
    }
  }

  private require(): { rooms: RoomServiceClient; config: Required<Pick<MeetKitConfig, 'LIVEKIT_URL' | 'LIVEKIT_API_KEY' | 'LIVEKIT_API_SECRET'>> } {
    if (!this.rooms) throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, 'live_unavailable', 'Live classes are not set up yet.');
    return { rooms: this.rooms, config: this.config as Required<MeetKitConfig> };
  }
}
