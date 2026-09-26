import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error', error: 'Internal Server Error' };

    const message =
      typeof rawResponse === 'string'
        ? rawResponse
        : (rawResponse as Record<string, unknown>)?.message ?? 'Internal server error';

    const errorName =
      typeof rawResponse === 'string'
        ? 'Internal Server Error'
        : (rawResponse as Record<string, unknown>)?.error ?? 'Internal Server Error';

    const payload: Record<string, unknown> = {
      statusCode: status,
      path: request.url,
      method: request.method,
      message,
      error: errorName,
    };

    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      payload.details = exception.stack ?? exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(payload);
  }
}
