import { MemberListQuerySchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class MemberListQueryDto extends createZodDto(MemberListQuerySchema) {}
