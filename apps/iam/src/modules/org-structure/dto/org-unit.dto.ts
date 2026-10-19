import { CreateOrgUnitSchema, OrgUnitSchema, UpdateOrgUnitSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class OrgUnitDto extends createZodDto(OrgUnitSchema) {}
export class OrgUnitListDto extends createZodDto(z.object({ items: z.array(OrgUnitSchema) })) {}
export class CreateOrgUnitDto extends createZodDto(CreateOrgUnitSchema) {}
export class UpdateOrgUnitDto extends createZodDto(UpdateOrgUnitSchema) {}
export class UnitParamsDto extends createZodDto(z.object({ orgId: UuidSchema, unitId: UuidSchema })) {}
