import { ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceRole, WorkspaceMember } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Numeric rank for role comparison. Higher = more privileged. */
const ROLE_RANK: Record<WorkspaceRole, number> = {
  [WorkspaceRole.MEMBER]: 1,
  [WorkspaceRole.ADMIN]: 2,
  [WorkspaceRole.OWNER]: 3,
};

@Injectable()
export class WorkspacePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies the user is a member of the workspace and holds at least the
   * required role. Throws ForbiddenException otherwise.
   *
   * Returns the membership record so callers can inspect the user's role
   * without a second query.
   */
  async checkMembership(
    userId: string,
    workspaceId: string,
    requiredRole: WorkspaceRole = WorkspaceRole.MEMBER,
  ): Promise<WorkspaceMember> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (ROLE_RANK[membership.role] < ROLE_RANK[requiredRole]) {
      throw new ForbiddenException(
        `This action requires at least the ${requiredRole} role`,
      );
    }

    return membership;
  }
}
