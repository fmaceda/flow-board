import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Catches every exception and returns a consistent error envelope:
 *   { success: false, error: { code, message, details? } }
 *
 * - HttpException (4xx): returns the status + a snake_case code derived from the message
 * - Unexpected errors (5xx): logs the stack trace, returns a generic INTERNAL_ERROR
 *   so no implementation details leak to the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: number;
    let code: string;
    let message: string;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
        code = toSnakeCase(responseBody);
      } else {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string) ?? exception.message;
        // class-validator errors come back as an array under `message`
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          details = body.message;
        }
        code = (body.error as string)
          ? toSnakeCase(body.error as string)
          : toSnakeCase(message);
      }
    } else {
      // Unexpected / programmer error — log it, hide details from client
      this.logger.error(
        `Unhandled exception on ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';
    }

    const body: ErrorBody = {
      success: false,
      error: { code, message, ...(details !== undefined && { details }) },
    };

    res.status(status).json(body);
  }
}

function toSnakeCase(str: string): string {
  return str
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
