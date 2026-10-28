import {
  AssignmentSubmissionSchema,
  AssignmentSubmitRequestSchema,
  BlockResultSchema,
  CheckRequestSchema,
  CourseProgressSchema,
  CourseSlugSchema,
  DiscussionPostRequestSchema,
  DiscussionSchema,
  EnrollmentSchema,
  EnrollmentSummarySchema,
  EnrollRequestSchema,
  ItemViewSchema,
  JournalEntrySchema,
  LearningStatsSchema,
  ProgressUpdateSchema,
  QuizAttemptSchema,
  QuizSubmitRequestSchema,
  SaveProgressRequestSchema,
  SubmissionFileUploadRequestSchema,
  SubmissionFileUploadSchema,
  FileLinkSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class EnrollDto extends createZodDto(EnrollRequestSchema) {}
export class EnrollmentDto extends createZodDto(EnrollmentSchema) {}
export class EnrollmentListDto extends createZodDto(z.object({ items: z.array(EnrollmentSummarySchema) })) {}
export class CourseProgressDto extends createZodDto(CourseProgressSchema) {}
export class SlugParamsDto extends createZodDto(z.object({ slug: CourseSlugSchema })) {}
export class ItemParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema, itemId: UuidSchema })) {}
export class ItemViewDto extends createZodDto(ItemViewSchema) {}
export class SaveProgressDto extends createZodDto(SaveProgressRequestSchema) {}
export class ProgressUpdateDto extends createZodDto(ProgressUpdateSchema) {}
export class CheckDto extends createZodDto(CheckRequestSchema) {}
export class BlockResultDto extends createZodDto(BlockResultSchema) {}
export class QuizSubmitDto extends createZodDto(QuizSubmitRequestSchema) {}
export class QuizAttemptDto extends createZodDto(QuizAttemptSchema) {}
export class AssignmentSubmitDto extends createZodDto(AssignmentSubmitRequestSchema) {}
export class AssignmentSubmissionDto extends createZodDto(AssignmentSubmissionSchema) {}
export class DiscussionPostDto extends createZodDto(DiscussionPostRequestSchema) {}
export class DiscussionDto extends createZodDto(DiscussionSchema) {}
export class JournalDto extends createZodDto(z.object({ items: z.array(JournalEntrySchema) })) {}
export class LearningStatsDto extends createZodDto(LearningStatsSchema) {}
export class SubmissionFileUploadRequestDto extends createZodDto(SubmissionFileUploadRequestSchema) {}
export class SubmissionFileUploadDto extends createZodDto(SubmissionFileUploadSchema) {}
export class FileLinkDto extends createZodDto(FileLinkSchema) {}
export class FileParamsDto extends createZodDto(z.object({ fileId: UuidSchema })) {}
