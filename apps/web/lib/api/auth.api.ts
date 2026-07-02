import api from './client';
import type { AuthResponse, ApiResponse } from '@flow-board/types';

// ── Request shapes ─────────────────────────────────────────────────────────

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ── API functions ──────────────────────────────────────────────────────────

export const authApi = {
  register: (dto: RegisterDto) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', dto),

  login: (dto: LoginDto) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', dto),

  logout: () => api.post('/auth/logout'),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  me: () =>
    api.get<ApiResponse<AuthResponse['user']>>('/users/me'),
};
