import { Module } from '@nestjs/common';
import { CONFIG } from '@lib/config';
import { createEmailSender } from '@lib/email';
import { IAM_USERS_QUEUE, RpcClient } from '@lib/rpc';
import type { NotifyConfig } from '../../config';
import { EMAIL_SENDER, IAM, NotificationIntake } from './notification-intake.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationIntake,
    { provide: EMAIL_SENDER, inject: [CONFIG], useFactory: (c: NotifyConfig) => createEmailSender(c) },
    { provide: IAM, inject: [CONFIG], useFactory: (c: NotifyConfig) => new RpcClient(c.RABBITMQ_URL, IAM_USERS_QUEUE, 4000) },
  ],
})
export class NotificationsModule {}
