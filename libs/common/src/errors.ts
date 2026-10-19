import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ErrorResponse } from '@dreamlab/contracts';
import { ThrottlerException } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { Observable, throwError } from 'rxjs';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

/** An HTTP error with a stable machine-readable code clients can branch on. */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super({ message, code, details }, status);
  }
}

export const badRequest = (code: string, message: string, details?: unknown) =>
  new AppException(HttpStatus.BAD_REQUEST, code, message, details);
export const unauthorized = (code: string, message: string) => new AppException(HttpStatus.UNAUTHORIZED, code, message);
export const forbidden = (code: string, message: string) => new AppException(HttpStatus.FORBIDDEN, code, message);
export const notFound = (code: string, message: string) => new AppException(HttpStatus.NOT_FOUND, code, message);
export const conflict = (code: string, message: string, details?: unknown) =>
  new AppException(HttpStatus.CONFLICT, code, message, details);
export const tooManyRequests = (code: string, message: string, retryAfterSeconds?: number) =>
  new AppException(HttpStatus.TOO_MANY_REQUESTS, code, message, retryAfterSeconds ? { retryAfterSeconds } : undefined);

const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

/** Turn any thrown value into the shared ErrorResponse shape. */
export function toErrorResponse(exception: unknown): ErrorResponse {
  if (exception instanceof ZodValidationException) {
    const zodError = exception.getZodError() as ZodError;
    return {
      statusCode: 400,
      error: STATUS_NAMES[400]!,
      message: 'Request validation failed',
      code: 'validation_failed',
      details: zodError.issues.map((i) => ({ path: i.path.join('.'), message: i.message, code: i.code })),
    };
  }
  if (exception instanceof ZodSerializationException) {
    return { statusCode: 500, error: STATUS_NAMES[500]!, message: 'Response serialization failed', code: 'serialization_failed' };
  }
  if (exception instanceof ThrottlerException) {
    return { statusCode: 429, error: STATUS_NAMES[429]!, message: 'Too many requests', code: 'rate_limited' };
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const body = exception.getResponse();
    const fromBody = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const message =
      typeof body === 'string'
        ? body
        : Array.isArray(fromBody.message)
          ? fromBody.message.join('; ')
          : String(fromBody.message ?? exception.message);
    return {
      statusCode: status,
      error: STATUS_NAMES[status] ?? 'Error',
      message,
      code: typeof fromBody.code === 'string' ? fromBody.code : undefined,
      details: fromBody.details,
    };
  }
  return { statusCode: 500, error: STATUS_NAMES[500]!, message: 'Internal server error', code: 'internal_error' };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void | Observable<never> {
    if (host.getType() !== 'http') {
      // RPC (RabbitMQ) handlers: hand the error back to the caller as data, never crash the consumer.
      const { statusCode, message, code } = toErrorResponse(exception);
      return throwError(() => ({ status: 'error', statusCode, message, code }));
    }
    const response = toErrorResponse(exception);
    if (response.statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    }
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const details = response.details as { retryAfterSeconds?: number } | undefined;
    if (response.statusCode === 429 && details?.retryAfterSeconds) {
      void reply.header('retry-after', String(details.retryAfterSeconds));
    }
    void reply.status(response.statusCode).send(response);
  }
}
