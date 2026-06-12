import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../generated/prisma/client';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import {
  WorkspaceMemberResponseDto,
  WorkspaceResponseDto,
} from './dto/workspace-response.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Workspace CRUD ────────────────────────────────────────────────────────

  async create(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('A workspace with this slug already exists');
    }

    // Atomic: create workspace + creator as OWNER in one transaction
    const [workspace] = await this.prisma.$transaction([
      this.prisma.workspace.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
        },
      }),
    ]);

    await this.prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId, role: WorkspaceRole.OWNER },
    });

    return this.toResponseDto(workspace);
  }

  async findAllForUser(userId: string): Promise<WorkspaceResponseDto[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return memberships.map((m) => this.toResponseDto(m.workspace));
  }

  async findOne(workspaceId: string): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return this.toResponseDto(workspace);
  }

  async update(
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    if (dto.slug) {
      const conflict = await this.prisma.workspace.findFirst({
        where: { slug: dto.slug, NOT: { id: workspaceId } },
      });
      if (conflict) {
        throw new ConflictException(
          'A workspace with this slug already exists',
        );
      }
    }
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
    return this.toResponseDto(workspace);
  }

  async remove(workspaceId: string): Promise<void> {
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async getMembers(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => this.toMemberResponseDto(m));
  }

  async inviteMember(
    workspaceId: string,
    dto: InviteMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No account found with that email address');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot invite a user as OWNER');
    }

    const member = await this.prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id, role: dto.role },
      include: { user: true },
    });
    return this.toMemberResponseDto(member);
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    requestingUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMemberResponseDto> {
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const target = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      include: { user: true },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Cannot change the role of the workspace owner',
      );
    }

    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'Cannot promote to OWNER. Transfer ownership instead.',
      );
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role: dto.role },
      include: { user: true },
    });
    return this.toMemberResponseDto(updated);
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    if (targetUserId === requestingUserId) {
      throw new BadRequestException(
        'You cannot remove yourself. Use the leave workspace endpoint instead.',
      );
    }

    const target = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
    if (!target) throw new NotFoundException('Member not found');

    if (target.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private toResponseDto(workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WorkspaceResponseDto {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  private toMemberResponseDto(member: {
    id: string;
    role: WorkspaceRole;
    joinedAt: Date;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }): WorkspaceMemberResponseDto {
    return {
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        avatarUrl: member.user.avatarUrl,
        createdAt: member.user.createdAt,
        updatedAt: member.user.updatedAt,
      },
    };
  }
}
