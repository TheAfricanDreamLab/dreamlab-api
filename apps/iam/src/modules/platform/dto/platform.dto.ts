import { PlatformOverviewSchema, PlatformUserDetailSchema, PlatformUserSchema, SetUserStatusSchema, UserStatusSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class PlatformOverviewDto extends createZodDto(PlatformOverviewSchema) {}
export class UserListQueryDto extends createZodDto(
  z.object({
    q: z.string().trim().max(120).optional(),
    status: UserStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().optional(),
  }),
) {}
export class PlatformUserListDto extends createZodDto(z.object({ items: z.array(PlatformUserSchema), nextCursor: z.string().nullable() })) {}
export class PlatformUserDetailDto extends createZodDto(PlatformUserDetailSchema) {}
export class UserParamsDto extends createZodDto(z.object({ userId: UuidSchema })) {}
export class SetUserStatusDto extends createZodDto(SetUserStatusSchema) {}
