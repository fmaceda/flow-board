import api from './client';

// ── Response shapes ────────────────────────────────────────────────────────

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

type ApiResponse<T> = { success: true; data: T };

// ── API functions ──────────────────────────────────────────────────────────

export const workspaceApi = {
  list: () =>
    api.get<ApiResponse<WorkspaceDto[]>>('/workspaces'),

  get: (workspaceId: string) =>
    api.get<ApiResponse<WorkspaceDto>>(`/workspaces/${workspaceId}`),

  create: (dto: CreateWorkspaceDto) =>
    api.post<ApiResponse<WorkspaceDto>>('/workspaces', dto),

  update: (workspaceId: string, dto: Partial<CreateWorkspaceDto>) =>
    api.patch<ApiResponse<WorkspaceDto>>(`/workspaces/${workspaceId}`, dto),

  remove: (workspaceId: string) =>
    api.delete(`/workspaces/${workspaceId}`),
};
