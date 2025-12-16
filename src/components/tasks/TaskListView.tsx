import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskListRow } from './TaskListRow';
import { StatusIcon, TaskStatus, STATUS_CONFIG, ALL_STATUSES } from './StatusIcon';
import { TaskPriority } from './PriorityIcon';
import { cn } from '@/lib/utils';

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskAssignee {
  id: string;
  nome: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  assigned_user?: TaskAssignee;
  labels?: TaskLabel[];
  project_id: string;
  company_id: string;
}

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onTaskClick: (task: Task) => void;
  onCreateTask?: (status?: TaskStatus) => void;
}

interface StatusGroupProps {
  status: TaskStatus;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onTaskClick: (task: Task) => void;
  onCreateTask?: (status: TaskStatus) => void;
}

function StatusGroup({
  status,
  tasks,
  isExpanded,
  onToggle,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
  onCreateTask,
}: StatusGroupProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="border-b border-border/40 last:border-b-0">
      {/* Group Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors',
          config.bgColor
        )}
        onClick={onToggle}
      >
        <button className="p-0.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <StatusIcon status={status} size="sm" />

        <span className="text-sm font-medium flex-1">{config.label}</span>

        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>

        {onCreateTask && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCreateTask(status);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tasks */}
      {isExpanded && tasks.length > 0 && (
        <div className="bg-background">
          {tasks.map((task) => (
            <TaskListRow
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isExpanded && tasks.length === 0 && (
        <div className="px-6 py-4 text-center text-sm text-muted-foreground bg-background">
          No tasks
        </div>
      )}
    </div>
  );
}

export function TaskListView({
  tasks,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
  onCreateTask,
}: TaskListViewProps) {
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<TaskStatus>>(() => {
    // Default: expand groups that have tasks
    const initialExpanded = new Set<TaskStatus>();
    ALL_STATUSES.forEach((status) => {
      if (tasks.some((t) => t.status === status)) {
        initialExpanded.add(status);
      }
    });
    return initialExpanded;
  });

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      canceled: [],
      duplicate: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const toggleGroup = (status: TaskStatus) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  // Order of status groups to display
  const displayOrder: TaskStatus[] = [
    'backlog',
    'todo',
    'in_progress',
    'review',
    'done',
    'canceled',
    'duplicate',
  ];

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {displayOrder.map((status) => (
        <StatusGroup
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
          isExpanded={expandedGroups.has(status)}
          onToggle={() => toggleGroup(status)}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onTaskClick={onTaskClick}
          onCreateTask={onCreateTask}
        />
      ))}
    </div>
  );
}
