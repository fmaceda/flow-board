import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectService } from '../project/project.service';
import { TaskStatus, Prisma } from '../generated/prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  TaskListResponseDto,
  TaskQueryDto,
  TaskResponseDto,
} from './dto/task-response.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectService: ProjectService,
  ) {}

  async create(
    userId: string,
    projectId: string,
    dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.projectService.resolveWorkspaceAndCheckMembership(
      projectId,
      userId,
    );

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatus.TODO,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assigneeId: dto.assigneeId ?? null,
        projectId,
      },
      include: { assignee: true },
    });

    return this.toResponseDto(task);
  }

  async findAll(
    userId: string,
    projectId: string,
    query: TaskQueryDto,
  ): Promise<TaskListResponseDto> {
    await this.projectService.resolveWorkspaceAndCheckMembership(
      projectId,
      userId,
    );

    const limit = Math.min(query.limit ?? 20, 100);
    const orderField = query.sort ?? 'created_at';
    const orderDir = query.dir ?? 'desc';

    // Map query sort name to Prisma field
    const orderByField: Record<string, string> = {
      created_at: 'createdAt',
      due_date: 'dueDate',
      status: 'status',
    };

    const where: Prisma.TaskWhereInput = {
      projectId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.assigneeId && { assigneeId: query.assigneeId }),
    };

    // Cursor pagination: fetch limit+1 to detect if there is a next page
    const tasks = await this.prisma.task.findMany({
      where: {
        ...where,
        ...(query.cursor && { id: { gt: query.cursor } }),
      },
      include: { assignee: true },
      orderBy: { [orderByField[orderField]]: orderDir },
      take: limit + 1,
    });

    const hasNextPage = tasks.length > limit;
    const page = hasNextPage ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasNextPage ? page[page.length - 1].id : null;

    return {
      data: page.map((t) => this.toResponseDto(t)),
      nextCursor,
    };
  }

  async findOne(
    userId: string,
    projectId: string,
    taskId: string,
  ): Promise<TaskResponseDto> {
    await this.projectService.resolveWorkspaceAndCheckMembership(
      projectId,
      userId,
    );
    const task = await this.findActiveTask(projectId, taskId);
    return this.toResponseDto(task);
  }

  async update(
    userId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.projectService.resolveWorkspaceAndCheckMembership(
      projectId,
      userId,
    );
    await this.findActiveTask(projectId, taskId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { assignee: true },
    });
    return this.toResponseDto(task);
  }

  async remove(
    userId: string,
    projectId: string,
    taskId: string,
  ): Promise<void> {
    await this.projectService.resolveWorkspaceAndCheckMembership(
      projectId,
      userId,
    );
    await this.findActiveTask(projectId, taskId);
    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async findActiveTask(projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId, deletedAt: null },
      include: { assignee: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private toResponseDto(task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    dueDate: Date | null;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
    assignee: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      projectId: task.projectId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            email: task.assignee.email,
            firstName: task.assignee.firstName,
            lastName: task.assignee.lastName,
            avatarUrl: task.assignee.avatarUrl,
            createdAt: task.assignee.createdAt,
            updatedAt: task.assignee.updatedAt,
          }
        : null,
    };
  }
}
