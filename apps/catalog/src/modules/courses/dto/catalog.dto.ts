import {
  AdminCourseSchema,
  CourseAuthoringSchema,
  CourseDetailSchema,
  CourseLevelSchema,
  CourseSlugSchema,
  CourseSummarySchema,
  ImportResultSchema,
  ProgramAuthoringSchema,
  ProgramDetailSchema,
  ProgramSummarySchema,
  UpdateAdminCourseSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CourseListQueryDto extends createZodDto(
  z.object({ q: z.string().trim().max(80).optional(), program: z.string().max(80).optional(), level: CourseLevelSchema.optional() }),
) {}
export class CourseListDto extends createZodDto(z.object({ items: z.array(CourseSummarySchema) })) {}
export class CourseDetailDto extends createZodDto(CourseDetailSchema) {}
export class SlugParamsDto extends createZodDto(z.object({ slug: CourseSlugSchema })) {}
export class ProgramSlugParamsDto extends createZodDto(z.object({ slug: z.string().max(80) })) {}
export class ProgramListDto extends createZodDto(z.object({ items: z.array(ProgramSummarySchema) })) {}
export class ProgramDetailDto extends createZodDto(ProgramDetailSchema) {}
export class AdminCourseDto extends createZodDto(AdminCourseSchema) {}
export class AdminCourseListDto extends createZodDto(z.object({ items: z.array(AdminCourseSchema) })) {}
export class UpdateAdminCourseDto extends createZodDto(UpdateAdminCourseSchema) {}
export class CourseIdParamsDto extends createZodDto(z.object({ courseId: UuidSchema })) {}
export class ImportCourseDto extends createZodDto(CourseAuthoringSchema) {}
export class ImportProgramDto extends createZodDto(ProgramAuthoringSchema) {}
export class ImportResultDto extends createZodDto(ImportResultSchema) {}
export class ProgramImportResultDto extends createZodDto(z.object({ slug: z.string() })) {}
