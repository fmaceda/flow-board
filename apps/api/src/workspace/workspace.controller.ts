import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { WorkspaceRole } from '../generated/prisma/client';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import {
  WorkspaceMemberResponseDto,
  WorkspaceResponseDto,
} from './dto/workspace-response.dto';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // ─── Workspace CRUD ────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, type: WorkspaceResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces the current user belongs to' })
  @ApiResponse({ status: 200, type: [WorkspaceResponseDto] })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkspaceResponseDto[]> {
    return this.workspaceService.findAllForUser(user.userId);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto })
  findOne(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.findOne(workspaceId);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceMemberGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update a workspace (ADMIN+)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, type: WorkspaceResponseDto })
  update(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponseDto> {
    return this.workspaceService.update(workspaceId, dto);
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(WorkspaceMemberGuard)
  @Roles(WorkspaceRole.OWNER)
  @ApiOperation({ summary: 'Delete a workspace (OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 204 })
  remove(@Param('workspaceId') workspaceId: string): Promise<void> {
    return this.workspaceService.remove(workspaceId);
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'List workspace members (MEMBER+)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, type: [WorkspaceMemberResponseDto] })
  getMembers(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return this.workspaceService.getMembers(workspaceId);
  }

  @Post(':workspaceId/members')
  @UseGuards(WorkspaceMemberGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Invite a user to the workspace (ADMIN+)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, type: WorkspaceMemberResponseDto })
  inviteMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspaceService.inviteMember(workspaceId, dto);
  }

  @Patch(':workspaceId/members/:userId')
  @UseGuards(WorkspaceMemberGuard)
  @Roles(WorkspaceRole.OWNER)
  @ApiOperation({ summary: "Change a member's role (OWNER only)" })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'userId', description: 'Target member UUID' })
  @ApiResponse({ status: 200, type: WorkspaceMemberResponseDto })
  updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.workspaceService.updateMemberRole(
      workspaceId,
      targetUserId,
      user.userId,
      dto,
    );
  }

  @Delete(':workspaceId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(WorkspaceMemberGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Remove a member from the workspace (ADMIN+)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'userId', description: 'Target member UUID' })
  @ApiResponse({ status: 204 })
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.workspaceService.removeMember(
      workspaceId,
      targetUserId,
      user.userId,
    );
  }
}
