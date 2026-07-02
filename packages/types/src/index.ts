// ── Enums ──────────────────────────────────────────────────────────────────
// Mirror of the Prisma-generated enums on the backend.
// Keep in sync with apps/api/prisma/schema.prisma.

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
];

// ── Entities ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string;
  assignee: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  data: Task[];
  nextCursor: string | null;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  author: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>;
  createdAt: string;
  updatedAt: string;
}

// ── API envelope ───────────────────────────────────────────────────────────
// Every backend response is wrapped by TransformInterceptor.

export type ApiResponse<T> = {
  success: true;
  data: T;
};

export type ApiListResponse<T> = ApiResponse<T[]>;

// ── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
