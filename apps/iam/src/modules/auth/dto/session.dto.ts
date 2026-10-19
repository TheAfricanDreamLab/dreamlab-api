import { SessionListSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class SessionListDto extends createZodDto(SessionListSchema) {}
export class SessionParamsDto extends createZodDto(z.object({ sessionId: UuidSchema })) {}
