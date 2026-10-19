import { AddDomainSchema, JoinableOrganizationSchema, OrgDomainSchema, UpdateDomainSchema, UuidSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class OrgDomainDto extends createZodDto(OrgDomainSchema) {}
export class OrgDomainListDto extends createZodDto(z.object({ items: z.array(OrgDomainSchema) })) {}
export class AddDomainDto extends createZodDto(AddDomainSchema) {}
export class UpdateDomainDto extends createZodDto(UpdateDomainSchema) {}
export class DomainParamsDto extends createZodDto(z.object({ orgId: UuidSchema, domainId: UuidSchema })) {}
export class JoinableOrgListDto extends createZodDto(z.object({ items: z.array(JoinableOrganizationSchema) })) {}
export class JoinResultDto extends createZodDto(z.object({ status: z.enum(['active', 'requested']), membershipId: UuidSchema })) {}
