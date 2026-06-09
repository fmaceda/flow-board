import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { WorkspaceRole } from '../../generated/prisma/client';
import { AuthenticatedUser } from '../../auth/auth.types';
import { WORKSPACE_ROLE_KEY } from '../../auth/decorators/roles.decorator';
import { WorkspacePermissionsService } from '../workspace-permissions.service';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: WorkspacePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Read the minimum role set by @Roles() — default to MEMBER if not specified
    const requiredRole =
      this.reflector.getAllAndOverride<WorkspaceRole>(WORKSPACE_ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? WorkspaceRole.MEMBER;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    const workspaceId = Array.isArray(req.params.workspaceId)
      ? req.params.workspaceId[0]
      : req.params.workspaceId;

    if (!workspaceId) {
      throw new BadRequestException(
        'workspaceId route parameter is required for workspace-scoped routes',
      );
    }

    // Throws ForbiddenException if not a member or role is insufficient
    await this.permissions.checkMembership(
      req.user.userId,
      workspaceId,
      requiredRole,
    );

    return true;
  }
}
