import api from './client';
import type { Project, ApiResponse } from '@flow-board/types';

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export type { Project as ProjectDto };

export const projectApi = {
  list: (workspaceId: string) =>
    api.get<ApiResponse<Project[]>>(
      `/workspaces/${workspaceId}/projects`,
    ),

  get: (workspaceId: string, projectId: string) =>
    api.get<ApiResponse<Project>>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
    ),

  create: (workspaceId: string, dto: CreateProjectDto) =>
    api.post<ApiResponse<Project>>(
      `/workspaces/${workspaceId}/projects`,
      dto,
    ),

  update: (workspaceId: string, projectId: string, dto: Partial<CreateProjectDto>) =>
    api.patch<ApiResponse<Project>>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      dto,
    ),

  remove: (workspaceId: string, projectId: string) =>
    api.delete(`/workspaces/${workspaceId}/projects/${projectId}`),
};
