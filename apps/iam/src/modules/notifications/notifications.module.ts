import { Global, Logger, Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { emailProvider, IamConfig } from '../../config';
import { ChannelNotifier, EMAIL_SENDER, NOTIFIER } from './notifier.service';
import { ConsoleEmailSender } from './providers/console.email-sender';
import type { EmailSender } from './providers/email-sender.interface';
import { ResendEmailSender } from './providers/resend.email-sender';
import { ZeptoMailEmailSender } from './providers/zeptomail.email-sender';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      inject: [CONFIG],
      useFactory: (config: IamConfig): EmailSender => {
        const provider = emailProvider(config);
        new Logger('Notifier').log(`Email provider: ${provider}`);
        if (provider === 'resend') {
          if (!config.RESEND_API_KEY) throw new Error('EMAIL_PROVIDER=resend needs RESEND_API_KEY');
          return new ResendEmailSender(config.RESEND_API_KEY, config.EMAIL_FROM);
        }
        if (provider === 'zeptomail') {
          if (!config.ZEPTOMAIL_TOKEN) throw new Error('EMAIL_PROVIDER=zeptomail needs ZEPTOMAIL_TOKEN');
          return new ZeptoMailEmailSender(config.ZEPTOMAIL_TOKEN, config.EMAIL_FROM, config.ZEPTOMAIL_API_URL);
        }
        if (config.NODE_ENV === 'production') throw new Error('No email provider configured: set RESEND_API_KEY or ZEPTOMAIL_TOKEN');
        return new ConsoleEmailSender();
      },
    },
    { provide: NOTIFIER, useClass: ChannelNotifier },
  ],
  exports: [NOTIFIER],
})
export class NotificationsModule {}
