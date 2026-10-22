import {
  AttendanceEntrySchema,
  ChooseElectiveSchema,
  ClassSessionSchema,
  CohortDetailSchema,
  CohortSchema,
  CreateCohortSchema,
  MarkAttendanceSchema,
  MyProgramSchema,
  RosterEntrySchema,
  UpdateCohortSchema,
  UpdateSessionSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CohortListDto extends createZodDto(z.object({ items: z.array(CohortSchema) })) {}
export class CohortDetailDto extends createZodDto(CohortDetailSchema) {}
export class CreateCohortDto extends createZodDto(CreateCohortSchema) {}
export class UpdateCohortDto extends createZodDto(UpdateCohortSchema) {}
export class UpdateSessionDto extends createZodDto(UpdateSessionSchema) {}
export class ClassSessionDto extends createZodDto(ClassSessionSchema) {}
export class RosterDto extends createZodDto(z.object({ items: z.array(RosterEntrySchema) })) {}
export class AttendanceSheetDto extends createZodDto(z.object({ session: ClassSessionSchema, items: z.array(AttendanceEntrySchema) })) {}
export class MarkAttendanceDto extends createZodDto(MarkAttendanceSchema) {}
export class MyProgramDto extends createZodDto(MyProgramSchema) {}
export class MyProgramListDto extends createZodDto(z.object({ items: z.array(MyProgramSchema) })) {}
export class ChooseElectiveDto extends createZodDto(ChooseElectiveSchema) {}
export class JoinCohortDto extends createZodDto(z.object({}).strict()) {}

export class CohortParamsDto extends createZodDto(z.object({ cohortId: UuidSchema })) {}
export class SessionParamsDto extends createZodDto(z.object({ cohortId: UuidSchema, sessionId: UuidSchema })) {}
export class ProgramSlugParamsDto extends createZodDto(z.object({ slug: z.string().max(80) })) {}
export class ProgramEnrollmentParamsDto extends createZodDto(z.object({ enrollmentId: UuidSchema })) {}
