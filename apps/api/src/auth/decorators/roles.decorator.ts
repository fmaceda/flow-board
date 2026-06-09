import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../../generated/prisma/client';

export const WORKSPACE_ROLE_KEY = 'workspace_role';

/**
 * Declares the minimum WorkspaceRole required to access a route.
 * Must be used alongside WorkspaceMemberGuard (which runs after JwtAuthGuard).
 *
 * @example
 * @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
 * @Roles(WorkspaceRole.ADMIN)
 * @Delete(':workspaceId/members/:userId')
 */
export const Roles = (role: WorkspaceRole) =>
  SetMetadata(WORKSPACE_ROLE_KEY, role);
