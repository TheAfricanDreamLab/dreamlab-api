import { Global, Logger, Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { createEmailSender, type EmailSender } from '@lib/email';
import { IamConfig, smsProvider } from '../../config';
import { ChannelNotifier, EMAIL_SENDER, NOTIFIER, SMS_SENDER } from './notifier.service';
import { ConsoleSmsSender } from './providers/console.sms-sender';
import type { SmsSender } from './providers/sms-sender.interface';
import { TermiiSmsSender } from './providers/termii.sms-sender';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      inject: [CONFIG],
      useFactory: (config: IamConfig): EmailSender => createEmailSender(config),
    },
    {
      provide: SMS_SENDER,
      inject: [CONFIG],
      useFactory: (config: IamConfig): SmsSender => {
        const provider = smsProvider(config);
        new Logger('Notifier').log(`SMS provider: ${provider}`);
        if (provider === 'termii') {
          if (!config.TERMII_API_KEY) throw new Error('SMS_PROVIDER=termii needs TERMII_API_KEY');
          return new TermiiSmsSender(config.TERMII_API_KEY, config.TERMII_SENDER_ID, config.TERMII_API_URL, config.TERMII_SMS_CHANNEL);
        }
        // Without Termii, production refuses phone codes rather than logging them.
        return new ConsoleSmsSender();
      },
    },
    { provide: NOTIFIER, useClass: ChannelNotifier },
  ],
  exports: [NOTIFIER],
})
export class NotificationsModule {}
