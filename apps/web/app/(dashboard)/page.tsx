'use client';

import Link from 'next/link';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { CreateWorkspaceDialog } from '@/components/features/workspace/create-workspace-dialog';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { WorkspaceDto } from '@/lib/api/workspace.api';

function WorkspaceCard({ workspace }: { workspace: WorkspaceDto }) {
  return (
    <Link href={`/workspaces/${workspace.id}`}>
      <Card className="hover:bg-zinc-50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-base">{workspace.name}</CardTitle>
          {workspace.description && (
            <CardDescription className="line-clamp-2">
              {workspace.description}
            </CardDescription>
          )}
          <p className="text-xs text-muted-foreground font-mono">
            {workspace.slug}
          </p>
        </CardHeader>
      </Card>
    </Link>
  );
}

function WorkspaceSkeletons() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </>
  );
}

export default function WorkspacesPage() {
  const { data: workspaces, isLoading, isError } = useWorkspaces();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workspaces</h2>
          <p className="text-sm text-muted-foreground">
            Select a workspace to get started
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Failed to load workspaces. Please refresh the page.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <WorkspaceSkeletons />
        ) : workspaces?.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No workspaces yet. Create your first one above.
          </p>
        ) : (
          workspaces?.map((ws) => <WorkspaceCard key={ws.id} workspace={ws} />)
        )}
      </div>
    </div>
  );
}
