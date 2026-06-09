import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * Override to throw a clean UnauthorizedException instead of the default
   * Passport error object, which leaks internal details.
   */
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing access token');
    }
    return user;
  }
}
