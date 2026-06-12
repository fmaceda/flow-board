import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { WorkspacePermissionsService } from '../workspace/workspace-permissions.service';
import { WorkspaceRole } from '../generated/prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: WorkspacePermissionsService,
  ) {}

  async create(
    workspaceId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.create({
      data: { name: dto.name, description: dto.description, workspaceId },
    });
    return this.toResponseDto(project);
  }

  async findAll(workspaceId: string): Promise<ProjectResponseDto[]> {
    const projects = await this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return projects.map((p) => this.toResponseDto(p));
  }

  async findOne(
    workspaceId: string,
    projectId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.findActiveProject(workspaceId, projectId);
    return this.toResponseDto(project);
  }

  async update(
    workspaceId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    await this.findActiveProject(workspaceId, projectId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
    return this.toResponseDto(updated);
  }

  async remove(workspaceId: string, projectId: string): Promise<void> {
    await this.findActiveProject(workspaceId, projectId);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Fetch a project, verify it belongs to the workspace, and is not soft-deleted.
   * Throws NotFoundException in both cases — prevents IDOR leaking existence.
   */
  async findActiveProject(workspaceId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  /**
   * Resolve a project's workspaceId and verify the user is a member.
   * Used by TaskModule to run membership checks on project-scoped routes.
   */
  async resolveWorkspaceAndCheckMembership(
    projectId: string,
    userId: string,
    requiredRole: WorkspaceRole = WorkspaceRole.MEMBER,
  ): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.permissions.checkMembership(
      userId,
      project.workspaceId,
      requiredRole,
    );
    return project.workspaceId;
  }

  private toResponseDto(project: {
    id: string;
    name: string;
    description: string | null;
    workspaceId: string;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      workspaceId: project.workspaceId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
