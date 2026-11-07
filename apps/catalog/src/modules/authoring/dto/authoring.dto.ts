import {
  AddCommentSchema,
  AuthoringOverviewSchema,
  DraftCommentSchema,
  HeartbeatSchema,
  PresenceSchema,
  UpdateCommentSchema,
  CourseMediaUploadRequestSchema,
  CourseMediaUploadSchema,
  CreateDraftSchema,
  DraftSaveSchema,
  DraftSchema,
  RequestChangesSchema,
  RestoreDraftSchema,
  ReviewNoteSchema,
  SaveDraftSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class AuthoringOverviewDto extends createZodDto(AuthoringOverviewSchema) {}
export class DraftDto extends createZodDto(DraftSchema) {}
export class CreateDraftDto extends createZodDto(CreateDraftSchema) {}
export class SaveDraftDto extends createZodDto(SaveDraftSchema) {}
export class ReviewNoteDto extends createZodDto(ReviewNoteSchema) {}
export class RequestChangesDto extends createZodDto(RequestChangesSchema) {}
export class EmptyBodyDto extends createZodDto(z.object({}).strict()) {}
export class DraftParamsDto extends createZodDto(z.object({ draftId: UuidSchema })) {}
export class CourseMediaUploadRequestDto extends createZodDto(CourseMediaUploadRequestSchema) {}
export class CourseMediaUploadDto extends createZodDto(CourseMediaUploadSchema) {}
export class DraftHistoryDto extends createZodDto(z.object({ items: z.array(DraftSaveSchema) })) {}
export class DraftHistoryDocDto extends createZodDto(z.object({ revision: z.number().int(), doc: z.record(z.unknown()) })) {}
export class DraftRevisionParamsDto extends createZodDto(z.object({ draftId: UuidSchema, revision: z.coerce.number().int().min(1) })) {}
export class RestoreDraftDto extends createZodDto(RestoreDraftSchema) {}
export class CommentDto extends createZodDto(DraftCommentSchema) {}
export class CommentListDto extends createZodDto(z.object({ items: z.array(DraftCommentSchema) })) {}
export class AddCommentDto extends createZodDto(AddCommentSchema) {}
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}
export class CommentParamsDto extends createZodDto(z.object({ draftId: UuidSchema, commentId: UuidSchema })) {}
export class HeartbeatDto extends createZodDto(HeartbeatSchema) {}
export class PresenceListDto extends createZodDto(z.object({ people: z.array(PresenceSchema) })) {}
