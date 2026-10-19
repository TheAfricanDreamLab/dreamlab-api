import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { AppException } from '@lib/common';
import type { FastifyReply } from 'fastify';
import { SCIM, SCIM_CONTENT_TYPE } from '../utils/scim';

/** Every SCIM error in the RFC 7644 error shape, which identity providers parse. */
@Catch()
export class ScimExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Scim');

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    let status = 500;
    let body: Record<string, unknown> = { schemas: [SCIM.error], status: '500', detail: 'Internal error' };
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as Record<string, unknown>;
      if (Array.isArray(res?.schemas)) body = res;
      else {
        const detail = exception instanceof AppException ? exception.message : typeof res?.message === 'string' ? res.message : exception.message;
        body = { schemas: [SCIM.error], status: String(status), detail };
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    }
    void reply.status(status).header('content-type', SCIM_CONTENT_TYPE).send(body);
  }
}
