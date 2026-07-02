import api from './client';
import type { Task, TaskList, TaskStatus, ApiResponse } from '@flow-board/types';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
}

export type UpdateTaskDto = Partial<CreateTaskDto>

export interface TaskQueryParams {
  status?: TaskStatus;
  assigneeId?: string;
  sort?: 'created_at' | 'due_date' | 'status';
  dir?: 'asc' | 'desc';
  cursor?: string;
  limit?: number;
}

export type { Task as TaskDto, TaskList as TaskListDto };

export const taskApi = {
  list: (projectId: string, params?: TaskQueryParams) =>
    api.get<ApiResponse<TaskList>>(`/projects/${projectId}/tasks`, { params }),

  get: (projectId: string, taskId: string) =>
    api.get<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`),

  create: (projectId: string, dto: CreateTaskDto) =>
    api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, dto),

  update: (projectId: string, taskId: string, dto: UpdateTaskDto) =>
    api.patch<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`, dto),

  remove: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
};
