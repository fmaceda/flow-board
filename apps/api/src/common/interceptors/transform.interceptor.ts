import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Wraps every successful response in a consistent envelope:
 *   { success: true, data: <payload>, meta?: { pagination: ... } }
 *
 * Controllers that need to include pagination metadata should return:
 *   { data: T, meta: { nextCursor: string | null, limit: number } }
 * The interceptor will unwrap and re-wrap it correctly.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((value: unknown) => {
        // If the controller returns { data, meta } unwrap it
        if (
          value !== null &&
          typeof value === 'object' &&
          'data' in value &&
          'meta' in value
        ) {
          const { data, meta } = value as {
            data: T;
            meta: Record<string, unknown>;
          };
          return { success: true as const, data, meta };
        }
        return { success: true as const, data: value as T };
      }),
    );
  }
}
