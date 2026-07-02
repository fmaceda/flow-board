import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskApi, type UpdateTaskDto } from '@/lib/api/task.api';
import type { Task, TaskStatus } from '@flow-board/types';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (projectId: string) => [...taskKeys.all, 'list', projectId] as const,
  detail: (projectId: string, taskId: string) =>
    [...taskKeys.all, 'detail', projectId, taskId] as const,
};

// Fetch all tasks for a project (loads up to 100 at once for board view)
export function useTasks(projectId: string) {
  return useQuery<Task[]>({
    queryKey: taskKeys.list(projectId),
    queryFn: async () => {
      const { data } = await taskApi.list(projectId, { limit: 100 });
      return data.data.data;
    },
    enabled: Boolean(projectId),
  });
}

// ── Optimistic status update ───────────────────────────────────────────────
// This is the key mutation: update the cache immediately, PATCH the backend,
// and roll back if the request fails.

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, dto }: { taskId: string; dto: UpdateTaskDto }) =>
      taskApi.update(projectId, taskId, dto),

    // Called before the mutation fires
    onMutate: async ({ taskId, dto }) => {
      // 1. Cancel any in-flight refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) });

      // 2. Snapshot the current cache value so we can roll back on error
      const previousTasks = queryClient.getQueryData<Task[]>(
        taskKeys.list(projectId),
      );

      // 3. Apply the optimistic update immediately
      queryClient.setQueryData<Task[]>(taskKeys.list(projectId), (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, ...dto } : t)),
      );

      // Return the snapshot as context — available in onError
      return { previousTasks };
    },

    onError: (_err, _vars, context) => {
      // Roll back the cache to the snapshot taken in onMutate
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.list(projectId), context.previousTasks);
      }
      toast.error('Failed to update task');
    },

    onSettled: () => {
      // Always refetch after the mutation settles to stay consistent with the server
      void queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    },
  });
}

// Status-only shortcut used by the drag-and-drop board
export function useUpdateTaskStatus(projectId: string) {
  const mutation = useUpdateTask(projectId);

  return (taskId: string, status: TaskStatus) =>
    mutation.mutate({ taskId, dto: { status } });
}
