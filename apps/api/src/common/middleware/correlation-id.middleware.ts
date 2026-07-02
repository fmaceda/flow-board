import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request globally so every middleware/controller can read req.correlationId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Honor an incoming X-Request-ID from a reverse proxy or the client;
    // otherwise generate a fresh UUID for this request.
    const id =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    req.correlationId = id;
    res.setHeader('X-Request-ID', id);
    next();
  }
}
