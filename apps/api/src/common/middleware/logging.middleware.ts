import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    // 'finish' fires after the response headers + body are fully flushed —
    // this is the earliest point at which statusCode is reliable.
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const correlationId = req.correlationId ?? '-';
      const message = `${method} ${originalUrl} ${statusCode} +${duration}ms [${correlationId}]`;

      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
