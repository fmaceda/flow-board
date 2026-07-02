import { useQuery } from '@tanstack/react-query';
import { projectApi, type ProjectDto } from '@/lib/api/project.api';

export const projectKeys = {
  all: ['projects'] as const,
  list: (workspaceId: string) => [...projectKeys.all, 'list', workspaceId] as const,
  detail: (workspaceId: string, projectId: string) =>
    [...projectKeys.all, 'detail', workspaceId, projectId] as const,
};

export function useProjects(workspaceId: string) {
  return useQuery<ProjectDto[]>({
    queryKey: projectKeys.list(workspaceId),
    queryFn: async () => {
      const { data } = await projectApi.list(workspaceId);
      return data.data;
    },
    enabled: Boolean(workspaceId),
  });
}
