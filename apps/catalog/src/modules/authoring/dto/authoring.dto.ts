import { AuthoringOverviewSchema, CreateDraftSchema, DraftSchema, RequestChangesSchema, ReviewNoteSchema, SaveDraftSchema, UuidSchema } from '@dreamlab/contracts';
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
