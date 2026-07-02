'use client';

import { useParams } from 'next/navigation';
import { useTasks } from '@/hooks/use-tasks';
import { TaskBoard } from '@/components/features/task/task-board';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks, isLoading, isError } = useTasks(projectId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Failed to load tasks. Please refresh.
      </p>
    );
  }

  return <TaskBoard projectId={projectId} tasks={tasks ?? []} />;
}
