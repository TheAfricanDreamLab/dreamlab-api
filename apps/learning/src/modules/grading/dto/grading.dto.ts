import { GradeRequestSchema, GradingQueueItemSchema, GradingQueueQuerySchema, SubmissionForGradingSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class GradingQueueDto extends createZodDto(z.object({ items: z.array(GradingQueueItemSchema) })) {}
export class GradingQueueQueryDto extends createZodDto(GradingQueueQuerySchema) {}
export class SubmissionForGradingDto extends createZodDto(SubmissionForGradingSchema) {}
export class GradeRequestDto extends createZodDto(GradeRequestSchema) {}
export class SubmissionParamsDto extends createZodDto(z.object({ submissionId: UuidSchema })) {}
