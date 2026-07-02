'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ workspaceId?: string }>();
  const { workspaceId } = params;

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          FlowBoard
        </Link>
      </div>

      <Separator />

      {/* Top-level nav */}
      <nav className="flex-1 space-y-1 p-2">
        <NavItem
          href="/"
          label="Workspaces"
          icon={LayoutDashboard}
          active={pathname === '/'}
        />

        {/* Show workspace-scoped nav when inside a workspace */}
        {workspaceId && (
          <>
            <div className="flex items-center gap-1 px-3 py-1.5">
              <ChevronRight className="h-3 w-3 text-zinc-400" />
              <span className="text-xs text-zinc-400 truncate">workspace</span>
            </div>
            <NavItem
              href={`/workspaces/${workspaceId}`}
              label="Projects"
              icon={FolderKanban}
              active={pathname === `/workspaces/${workspaceId}`}
            />
          </>
        )}

        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname === '/settings'}
        />
      </nav>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-zinc-100 text-zinc-900'
          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

