import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskService } from '../task/task.service';
import { WorkspacePermissionsService } from '../workspace/workspace-permissions.service';
import { WorkspaceRole } from '../generated/prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskService: TaskService,
    private readonly permissions: WorkspacePermissionsService,
  ) {}

  async create(
    userId: string,
    taskId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const workspaceId = await this.resolveWorkspaceId(taskId, userId);
    void workspaceId; // membership already checked inside resolveWorkspaceId

    const comment = await this.prisma.comment.create({
      data: { content: dto.content, taskId, authorId: userId },
      include: { author: true },
    });
    return this.toResponseDto(comment);
  }

  async findAll(userId: string, taskId: string): Promise<CommentResponseDto[]> {
    await this.resolveWorkspaceId(taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((c) => this.toResponseDto(c));
  }

  async update(
    userId: string,
    taskId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    await this.resolveWorkspaceId(taskId, userId);
    const comment = await this.findComment(taskId, commentId);

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Only the comment author can edit this comment',
      );
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: { author: true },
    });
    return this.toResponseDto(updated);
  }

  async remove(
    userId: string,
    taskId: string,
    commentId: string,
  ): Promise<void> {
    const workspaceId = await this.resolveWorkspaceId(taskId, userId);
    const comment = await this.findComment(taskId, commentId);

    const isAuthor = comment.authorId === userId;
    if (!isAuthor) {
      // Non-authors can delete only if they are at least ADMIN
      const membership = await this.permissions.checkMembership(
        userId,
        workspaceId,
        WorkspaceRole.ADMIN,
      );
      void membership;
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Resolve the workspaceId from a task and check membership for the user.
   * Throws NotFoundException if task doesn't exist, ForbiddenException if not a member.
   */
  private async resolveWorkspaceId(
    taskId: string,
    userId: string,
  ): Promise<string> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { project: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.permissions.checkMembership(userId, task.project.workspaceId);
    return task.project.workspaceId;
  }

  private async findComment(taskId: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private toResponseDto(comment: {
    id: string;
    content: string;
    taskId: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.taskId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        email: comment.author.email,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
        avatarUrl: comment.author.avatarUrl,
        createdAt: comment.author.createdAt,
        updatedAt: comment.author.updatedAt,
      },
    };
  }
}
