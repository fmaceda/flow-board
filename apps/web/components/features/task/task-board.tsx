'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, type Task, type TaskStatus } from '@flow-board/types';
import { useUpdateTaskStatus } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// ── Task card ──────────────────────────────────────────────────────────────

function TaskCard({ task, isDragging = false }: { task: Task; isDragging?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-3 shadow-xs text-sm',
        isDragging && 'opacity-50 rotate-2 shadow-lg',
      )}
    >
      <p className="font-medium leading-snug">{task.title}</p>
      {task.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}
      {task.assignee && (
        <p className="mt-2 text-xs text-muted-foreground">
          {task.assignee.firstName} {task.assignee.lastName}
        </p>
      )}
      {task.dueDate && (
        <p className="mt-1 text-xs text-muted-foreground">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ── Sortable card wrapper (makes each card draggable) ──────────────────────

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

// ── Column (droppable area) ────────────────────────────────────────────────

function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          {TASK_STATUS_LABELS[status]}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>

      <div
        className="flex flex-col gap-2 rounded-xl bg-zinc-100 p-2 min-h-24"
        data-droppable-id={status}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// ── Board ──────────────────────────────────────────────────────────────────

export function TaskBoard({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: Task[];
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateStatus = useUpdateTaskStatus(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px of movement before starting drag — prevents accidental drags on click
      activationConstraint: { distance: 8 },
    }),
  );

  // Group tasks by status for column rendering
  const tasksByStatus = TASK_STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] },
  );

  function onDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);

    if (!over) return;

    // Determine the target column — `over.id` can be either a task ID
    // (dropped over another card) or a status string (dropped on the column itself)
    const targetStatus = (
      TASK_STATUS_ORDER.includes(over.id as TaskStatus)
        ? over.id
        : tasks.find((t) => t.id === over.id)?.status
    ) as TaskStatus | undefined;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!targetStatus || !draggedTask || draggedTask.status === targetStatus) return;

    // Fire the optimistic mutation (cache update is immediate; PATCH is in-flight)
    updateStatus(String(active.id), targetStatus);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-4 gap-4 h-full">
        {TASK_STATUS_ORDER.map((status) => (
          <Column key={status} status={status} tasks={tasksByStatus[status]} />
        ))}
      </div>

      {/* Ghost card shown while dragging */}
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
