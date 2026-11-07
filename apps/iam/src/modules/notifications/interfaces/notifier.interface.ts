import type { OtpPurpose } from '@dreamlab/contracts';

export interface OtpMessage {
  channel: 'email' | 'sms' | 'whatsapp';
  destination: string;
  code: string;
  purpose: OtpPurpose;
  expiresInSeconds: number;
}

export interface InvitationMessage {
  channel: 'email' | 'sms';
  destination: string;
  orgName: string;
  inviterName: string | null;
  acceptUrl: string;
  expiresAt: Date;
}

/** A change to someone's standing (PLT-2), told to them. */
export interface AccountNotice {
  destination: string;
  name: string;
  status: 'active' | 'suspended' | 'banned';
  until: Date | null;
  message: string | null;
}

/** Outbound messages IAM sends. notify-hub (push → WhatsApp → SMS → email) replaces this later. */
export interface Notifier {
  sendOtp(message: OtpMessage): Promise<void>;
  sendInvitation(message: InvitationMessage): Promise<void>;
  sendAccountNotice(message: AccountNotice): Promise<void>;
}
