import { useQuery } from '@tanstack/react-query';
import { workspaceApi, type WorkspaceDto } from '@/lib/api/workspace.api';

// Centralised query keys — prevents typos and makes invalidation easy
export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
};

export function useWorkspaces() {
  return useQuery<WorkspaceDto[]>({
    queryKey: workspaceKeys.list(),
    queryFn: async () => {
      const { data } = await workspaceApi.list();
      return data.data;
    },
  });
}
