import { MembershipSchema, pageOf } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class MembershipDto extends createZodDto(MembershipSchema) {}
export class MembershipPageDto extends createZodDto(pageOf(MembershipSchema)) {}
