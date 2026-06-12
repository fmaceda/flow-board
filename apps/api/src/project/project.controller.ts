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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../workspace/guards/workspace-member.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WorkspaceRole } from '../generated/prisma/client';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project in a workspace (MEMBER+)' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectService.create(workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects in a workspace (MEMBER+)' })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll(
    @Param('workspaceId') workspaceId: string,
  ): Promise<ProjectResponseDto[]> {
    return this.projectService.findAll(workspaceId);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project by ID (MEMBER+)' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.projectService.findOne(workspaceId, projectId);
  }

  @Patch(':projectId')
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update a project (ADMIN+)' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectService.update(workspaceId, projectId, dto);
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a project (ADMIN+)' })
  @ApiResponse({ status: 204 })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ): Promise<void> {
    return this.projectService.remove(workspaceId, projectId);
  }
}
