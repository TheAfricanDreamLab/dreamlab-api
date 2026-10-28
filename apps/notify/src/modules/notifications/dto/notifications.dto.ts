import { NotificationListQuerySchema, NotificationPreferencesSchema, NotificationSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class NotificationListQueryDto extends createZodDto(NotificationListQuerySchema) {}
export class NotificationListDto extends createZodDto(z.object({ items: z.array(NotificationSchema), unread: z.number().int(), hasMore: z.boolean() })) {}
export class UnreadCountDto extends createZodDto(z.object({ unread: z.number().int() })) {}
export class NotificationPreferencesDto extends createZodDto(NotificationPreferencesSchema) {}
export class NotificationParamsDto extends createZodDto(z.object({ id: UuidSchema })) {}
