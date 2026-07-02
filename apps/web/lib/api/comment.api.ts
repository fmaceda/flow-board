import api from './client';
import type { Comment, ApiResponse } from '@flow-board/types';

export interface CreateCommentDto {
  content: string;
}

export type { Comment as CommentDto };

export const commentApi = {
  list: (taskId: string) =>
    api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`),

  create: (taskId: string, dto: CreateCommentDto) =>
    api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, dto),

  update: (taskId: string, commentId: string, dto: CreateCommentDto) =>
    api.patch<ApiResponse<Comment>>(`/tasks/${taskId}/comments/${commentId}`, dto),

  remove: (taskId: string, commentId: string) =>
    api.delete(`/tasks/${taskId}/comments/${commentId}`),
};
