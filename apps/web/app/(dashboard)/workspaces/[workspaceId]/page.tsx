'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useProjects } from '@/hooks/use-projects';
import { CreateProjectDialog } from '@/components/features/project/create-project-dialog';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectDto } from '@/lib/api/project.api';

function ProjectCard({
  project,
  workspaceId,
}: {
  project: ProjectDto;
  workspaceId: string;
}) {
  return (
    <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
      <Card className="hover:bg-zinc-50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-base">{project.name}</CardTitle>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: projects, isLoading, isError } = useProjects(workspaceId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Select a project to open the task board
          </p>
        </div>
        <CreateProjectDialog workspaceId={workspaceId} />
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load projects. Please refresh.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : projects?.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No projects yet. Create your first one above.
          </p>
        ) : (
          projects?.map((p) => (
            <ProjectCard key={p.id} project={p} workspaceId={workspaceId} />
          ))
        )}
      </div>
    </div>
  );
}
