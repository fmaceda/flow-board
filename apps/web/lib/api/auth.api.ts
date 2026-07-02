import api from './client';
import type { AuthUser } from '@/store/auth.store';

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

// ── Response shapes ────────────────────────────────────────────────────────

interface AuthResponseData {
  accessToken: string;
  user: AuthUser;
}

type ApiResponse<T> = { success: true; data: T };

// ── API functions ──────────────────────────────────────────────────────────

export const authApi = {
  register: (dto: RegisterDto) =>
    api.post<ApiResponse<AuthResponseData>>('/auth/register', dto),

  login: (dto: LoginDto) =>
    api.post<ApiResponse<AuthResponseData>>('/auth/login', dto),

  logout: () => api.post('/auth/logout'),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  me: () =>
    api.get<ApiResponse<AuthUser>>('/users/me'),
};
