import { UpdateMembershipSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class UpdateMembershipDto extends createZodDto(UpdateMembershipSchema) {}
