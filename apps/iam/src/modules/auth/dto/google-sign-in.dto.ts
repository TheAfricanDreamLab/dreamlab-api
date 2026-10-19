import { GoogleSignInRequestSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class GoogleSignInDto extends createZodDto(GoogleSignInRequestSchema) {}
