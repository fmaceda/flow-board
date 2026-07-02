import api from './client';
import type { Workspace, WorkspaceMember, ApiResponse } from '@flow-board/types';

// ── Request shapes ─────────────────────────────────────────────────────────

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

// Re-export for consumers
export type { Workspace as WorkspaceDto, WorkspaceMember as WorkspaceMemberDto };

// ── API functions ──────────────────────────────────────────────────────────

export const workspaceApi = {
  list: () =>
    api.get<ApiResponse<Workspace[]>>('/workspaces'),

  get: (workspaceId: string) =>
    api.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`),

  create: (dto: CreateWorkspaceDto) =>
    api.post<ApiResponse<Workspace>>('/workspaces', dto),

  update: (workspaceId: string, dto: Partial<CreateWorkspaceDto>) =>
    api.patch<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`, dto),

  remove: (workspaceId: string) =>
    api.delete(`/workspaces/${workspaceId}`),

  getMembers: (workspaceId: string) =>
    api.get<ApiResponse<WorkspaceMember[]>>(`/workspaces/${workspaceId}/members`),

  inviteMember: (workspaceId: string, email: string, role: string) =>
    api.post<ApiResponse<WorkspaceMember>>(`/workspaces/${workspaceId}/members`, { email, role }),

  removeMember: (workspaceId: string, userId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
};
