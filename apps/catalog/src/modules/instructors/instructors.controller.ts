import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  apiV1Contract,
  CourseMediaUploadSchema,
  CourseStaffSchema,
  InstructorPhotoUploadSchema,
  InstructorProfileSchema,
  SaveInstructorSchema,
  UuidSchema,
} from '@dreamlab/contracts';
import { Authenticated, CurrentPrincipal, Principal } from '@lib/auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { InstructorsService } from './instructors.service';

const r = apiV1Contract.instructors;

class ProfileParamsDto extends createZodDto(z.object({ profileId: UuidSchema })) {}
class SlugParamsDto extends createZodDto(z.object({ slug: z.string().min(3).max(80) })) {}
class SaveInstructorDto extends createZodDto(SaveInstructorSchema) {}
class InstructorProfileDto extends createZodDto(InstructorProfileSchema) {}
class InstructorListDto extends createZodDto(z.object({ items: z.array(InstructorProfileSchema) })) {}
class PhotoUploadRequestDto extends createZodDto(InstructorPhotoUploadSchema) {}
class PhotoUploadDto extends createZodDto(CourseMediaUploadSchema) {}
class CourseStaffDto extends createZodDto(CourseStaffSchema) {}

@ApiTags('instructors')
@Authenticated()
@Controller('v1/catalog')
export class InstructorsController {
  constructor(private readonly instructors: InstructorsService) {}

  @Get('instructors')
  @ApiOperation({ summary: r.list.summary })
  @ZodResponse({ status: 200, type: InstructorListDto })
  list(@CurrentPrincipal() principal: Principal) {
    return this.instructors.list(principal);
  }

  @Post('instructors')
  @ApiOperation({ summary: r.create.summary })
  @ZodResponse({ status: 201, type: InstructorProfileDto })
  create(@Body() dto: SaveInstructorDto, @CurrentPrincipal() principal: Principal) {
    return this.instructors.create(principal, dto);
  }

  @Post('instructors/photo')
  @ApiOperation({ summary: r.uploadPhoto.summary })
  @ZodResponse({ status: 201, type: PhotoUploadDto })
  photo(@Body() dto: PhotoUploadRequestDto, @CurrentPrincipal() principal: Principal) {
    return this.instructors.uploadPhoto(principal, dto);
  }

  @Put('instructors/:profileId')
  @ApiOperation({ summary: r.update.summary })
  @ZodResponse({ status: 200, type: InstructorProfileDto })
  update(@Param() p: ProfileParamsDto, @Body() dto: SaveInstructorDto, @CurrentPrincipal() principal: Principal) {
    return this.instructors.update(principal, p.profileId, dto);
  }

  @Delete('instructors/:profileId')
  @HttpCode(204)
  @ApiOperation({ summary: r.remove.summary })
  async remove(@Param() p: ProfileParamsDto, @CurrentPrincipal() principal: Principal) {
    await this.instructors.remove(principal, p.profileId);
  }

  @Put('courses/:slug/staff')
  @ApiOperation({ summary: r.setStaff.summary })
  @ZodResponse({ status: 200, type: CourseStaffDto })
  setStaff(@Param() p: SlugParamsDto, @Body() dto: CourseStaffDto, @CurrentPrincipal() principal: Principal) {
    return this.instructors.setStaff(principal, p.slug, dto.staff);
  }
}
