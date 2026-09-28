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

  private getErrorStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (typeof exception === 'object' && exception !== null) {
      const maybeStatus = (exception as { status?: number; statusCode?: number }).status;
      const maybeStatusCode = (exception as { statusCode?: number }).statusCode;
      if (typeof maybeStatus === 'number') {
        return maybeStatus;
      }
      if (typeof maybeStatusCode === 'number') {
        return maybeStatusCode;
      }
    }

    const code = this.getPrismaErrorCode(exception);
    if (code === 'P2025') return HttpStatus.NOT_FOUND;
    if (code === 'P2002' || code === '23505') return HttpStatus.CONFLICT;
    if (code === 'P2000' || code === 'P2001' || code === 'P2011' || code === 'P2012') return HttpStatus.BAD_REQUEST;

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getPrismaErrorCode(exception: unknown): string | undefined {
    if (typeof exception !== 'object' || exception === null) {
      return undefined;
    }

    const maybeCode = (exception as { code?: string }).code;
    const maybeName = (exception as { name?: string }).name;
    const maybeCause = (exception as { cause?: { code?: string } }).cause;

    return typeof maybeCode === 'string'
      ? maybeCode
      : typeof maybeCause?.code === 'string'
        ? maybeCause.code
        : maybeName === 'PrismaClientKnownRequestError'
          ? 'UNKNOWN_PRISMA'
          : undefined;
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        const message = (response as { message?: unknown }).message;
        if (Array.isArray(message)) {
          return message.join(', ');
        }
        if (typeof message === 'string') {
          return message;
        }
      }
    }

    if (typeof exception === 'object' && exception !== null) {
      const response = (exception as { response?: unknown }).response;
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        const message = (response as { message?: unknown }).message;
        if (Array.isArray(message)) {
          return message.join(', ');
        }
        if (typeof message === 'string') {
          return message;
        }
      }
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Something went wrong.';
  }

  private getErrorName(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const error = (response as { error?: unknown }).error;
        if (typeof error === 'string') {
          return error;
        }
      }
      return exception.name;
    }

    if (typeof exception === 'object' && exception !== null) {
      const name = (exception as { name?: string }).name;
      if (typeof name === 'string' && name.length > 0) {
        return name;
      }
    }

    return 'Internal Server Error';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getErrorStatus(exception);
    const message = this.getErrorMessage(exception);
    const errorName = this.getErrorName(exception);

    const payload: Record<string, unknown> = {
      statusCode: status,
      path: request.url,
      method: request.method,
      message,
      error: errorName,
    };

    if (process.env.NODE_ENV !== 'production') {
      payload.details =
        exception instanceof Error ? { name: exception.name, stack: exception.stack ?? exception.message } : message;
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(payload);
  }
}
