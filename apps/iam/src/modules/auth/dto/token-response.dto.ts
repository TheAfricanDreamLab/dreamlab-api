import { TokenResponseSchema } from '@dreamlab/contracts';
import { createZodDto } from 'nestjs-zod';

export class TokenResponseDto extends createZodDto(TokenResponseSchema) {}
