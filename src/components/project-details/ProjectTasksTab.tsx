import { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, User, Calendar, Flag, Edit, GripVertical, Trash, List, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskProgressIndicatorV2 } from '@/components/TaskProgressIndicatorV2';
import { EditTaskModal } from '@/components/EditTaskModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// New imports for Linear-like features
import { TaskListView } from '@/components/tasks/TaskListView';
import { QuickCreateTask } from '@/components/tasks/QuickCreateTask';
import { TaskStatus, STATUS_CONFIG } from '@/components/tasks/StatusIcon';
import { TaskPriority } from '@/components/tasks/PriorityIcon';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimated_hours: number | null;
  progress: number;
  assigned_to: string | null;
  created_at: string;
  project_id: string;
  company_id: string;
  order_index: number;
  client_execution: boolean;
  labels?: Array<{ id: string; name: string; color: string; }>;
  assigned_user?: {
    id: string;
    nome: string;
  };
}

interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
  position: number;
}

interface TaskWithChecklist extends Task {
  checklist: ChecklistItem[];
}

interface Project {
  id: string;
  title: string;
  company_id: string;
}

interface ProjectTasksTabProps {
  project: Project;
  onRefresh: () => void;
}

// Kanban columns configuration with new status values
const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'todo', title: 'Todo', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100' },
  { id: 'review', title: 'In Review', color: 'bg-purple-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
] as const;

type ViewMode = 'kanban' | 'list';

// Componente de Task Card Drag & Drop
interface SortableTaskCardProps {
  task: TaskWithChecklist;
  project: Project;
  onEdit: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onChecklistToggle: (taskId: string, itemId: string, isDone: boolean) => void;
  onRefresh: () => void;
  onDeleteTask: (taskId: string) => void;
  subtasksCount?: { count: number; completed: number };
  onCardClick: (task: TaskWithChecklist) => void;
}

function SortableTaskCard({
  task,
  project,
  onEdit,
  onStatusChange,
  onChecklistToggle,
  onRefresh,
  onDeleteTask,
  subtasksCount,
  onCardClick,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      none: 'bg-gray-100 text-gray-600',
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels: Record<TaskPriority, string> = {
      none: '---',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    return labels[priority] || priority;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-md transition-all cursor-pointer ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
      onClick={() => onCardClick(task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing hover:bg-accent rounded p-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
              {task.title}
            </CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <EditTaskModal
                task={{
                  ...task,
                  project_id: project.id,
                  company_id: project.company_id
                }}
                onTaskUpdated={() => { onEdit(); onRefresh(); }}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Task
                </DropdownMenuItem>
              </EditTaskModal>
              {KANBAN_COLUMNS
                .filter(col => col.id !== task.status)
                .map(col => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => onStatusChange(task.id, col.id as TaskStatus)}
                  >
                    Move to {col.title}
                  </DropdownMenuItem>
                ))
              }
              <DropdownMenuItem
                onClick={() => onDeleteTask(task.id)}
                className="text-destructive"
              >
                <Trash className="h-3 w-3 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                style={{
                  backgroundColor: `${label.color}20`,
                  borderColor: label.color,
                  color: label.color
                }}
                className="text-xs flex items-center gap-1"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </Badge>
            ))}
            {task.labels.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{task.labels.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Priority and Due Date */}
        <div className="flex items-center justify-between">
          <Badge className={getPriorityColor(task.priority)} variant="outline">
            <Flag className="h-3 w-3 mr-1" />
            {getPriorityLabel(task.priority)}
          </Badge>
          {task.due_date && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(task.due_date).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        {/* Client Execution Badge */}
        {task.client_execution && (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
            Client Executes
          </Badge>
        )}

        {/* Assignee */}
        {task.assigned_user && (
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            {task.assigned_user.nome}
          </div>
        )}

        {/* Progress with Smart Indicator V2 */}
        <TaskProgressIndicatorV2
          taskId={task.id}
          onProgressUpdate={() => { onEdit(); onRefresh(); }}
          size="sm"
        />

        {/* Mini Checklist */}
        {task.checklist.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium">Checklist:</p>
            <div className="space-y-1">
              {task.checklist.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.is_done}
                    onCheckedChange={(checked) =>
                      onChecklistToggle(task.id, item.id, !!checked)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-3 w-3"
                  />
                  <span className={`text-xs ${
                    item.is_done ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {item.title}
                  </span>
                </div>
              ))}
              {task.checklist.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{task.checklist.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de Coluna Droppable
interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  isEmpty: boolean;
}

function DroppableColumn({ id, children, isEmpty }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary' : ''
      } ${isEmpty ? 'border-2 border-dashed border-border/50' : ''}`}
    >
      {children}
    </div>
  );
}

export function ProjectTasksTab({ project, onRefresh }: ProjectTasksTabProps) {
  const [tasks, setTasks] = useState<TaskWithChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [subtasksCounts, setSubtasksCounts] = useState<Record<string, {count: number, completed: number}>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban'); // Default to kanban view
  const [selectedTask, setSelectedTask] = useState<TaskWithChecklist | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [project.id]);

  const fetchTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('gp_tasks')
        .select(`
          *,
          labels:gp_task_labels(
            label:gp_labels(id, name, color)
          ),
          assigned_user:profiles!gp_tasks_assigned_to_fkey(id, nome)
        `)
        .eq('project_id', project.id)
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const taskIds = tasksData?.map(t => t.id) || [];
      const { data: checklistData } = await supabase
        .from('gp_task_checklist')
        .select('*')
        .in('task_id', taskIds)
        .order('position');

      const { data: subtasksData } = await supabase
        .from('gp_task_subtasks')
        .select('task_id, is_done')
        .in('task_id', taskIds);

      const checklistByTask = (checklistData || []).reduce((acc, item) => {
        if (!acc[item.task_id]) {
          acc[item.task_id] = [];
        }
        acc[item.task_id].push(item);
        return acc;
      }, {} as Record<string, ChecklistItem[]>);

      const subtasksCountByTask = (subtasksData || []).reduce((acc, item) => {
        if (!acc[item.task_id]) {
          acc[item.task_id] = { count: 0, completed: 0 };
        }
        acc[item.task_id].count++;
        if (item.is_done) {
          acc[item.task_id].completed++;
        }
        return acc;
      }, {} as Record<string, {count: number, completed: number}>);

      setSubtasksCounts(subtasksCountByTask);

      const tasksWithChecklist: TaskWithChecklist[] = (tasksData || []).map(task => ({
        ...task,
        status: task.status as TaskStatus,
        priority: (task.priority || 'none') as TaskPriority,
        checklist: checklistByTask[task.id] || [],
        labels: task.labels?.map((l: any) => l.label).filter(Boolean) || []
      }));

      setTasks(tasksWithChecklist);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await supabase
        .from('gp_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      toast({
        title: 'Success',
        description: 'Task status updated.',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: TaskPriority) => {
    try {
      await supabase
        .from('gp_tasks')
        .update({ priority: newPriority })
        .eq('id', taskId);

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, priority: newPriority } : task
        )
      );

      toast({
        title: 'Success',
        description: 'Task priority updated.',
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Error',
        description: 'Failed to update priority.',
        variant: 'destructive',
      });
    }
  };

  const toggleChecklistItem = async (taskId: string, itemId: string, isDone: boolean) => {
    try {
      await supabase
        .from('gp_task_checklist')
        .update({ is_done: isDone })
        .eq('id', itemId);

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                checklist: task.checklist.map(item =>
                  item.id === itemId ? { ...item, is_done: isDone } : item
                )
              }
            : task
        )
      );

      toast({
        title: 'Success',
        description: 'Checklist item updated.',
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update checklist.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gp_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task deleted successfully.',
      });

      await fetchTasks();
      onRefresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task.',
        variant: 'destructive',
      });
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const overId = over.id as string;
    let newStatus: TaskStatus | null = null;

    if (KANBAN_COLUMNS.some(col => col.id === overId)) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus && newStatus !== task.status) {
      const tasksInNewColumn = tasks.filter(t => t.status === newStatus);
      const newOrderIndex = tasksInNewColumn.length;

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status: newStatus!, order_index: newOrderIndex } : t
        )
      );

      try {
        await supabase
          .from('gp_tasks')
          .update({ status: newStatus, order_index: newOrderIndex })
          .eq('id', taskId);

        toastTimeoutRef.current = setTimeout(() => {
          toast({
            title: 'Task moved!',
            description: `Status updated to "${STATUS_CONFIG[newStatus!].label}"`,
          });
        }, 100);

        onRefresh();
      } catch (error) {
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: task.status, order_index: task.order_index } : t
          )
        );

        console.error('Error updating status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update status.',
          variant: 'destructive',
        });
      }
    } else if (active.id !== over.id) {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask && overTask.status === task.status) {
        const tasksInColumn = tasks.filter(t => t.status === task.status);
        const oldIndex = tasksInColumn.findIndex(t => t.id === taskId);
        const newIndex = tasksInColumn.findIndex(t => t.id === overId);

        if (oldIndex === newIndex) return;

        const reorderedTasks = [...tasksInColumn];
        const [movedTask] = reorderedTasks.splice(oldIndex, 1);
        reorderedTasks.splice(newIndex, 0, movedTask);

        const updatedTasks = reorderedTasks.map((t, index) => ({
          ...t,
          order_index: index
        }));

        setTasks(prev => {
          const otherTasks = prev.filter(t => t.status !== task.status);
          return [...otherTasks, ...updatedTasks].sort((a, b) => a.order_index - b.order_index);
        });

        try {
          const updates = updatedTasks.map(t =>
            supabase
              .from('gp_tasks')
              .update({ order_index: t.order_index })
              .eq('id', t.id)
          );

          await Promise.all(updates);

          toastTimeoutRef.current = setTimeout(() => {
            toast({
              title: 'Task reordered!',
              description: 'Order updated successfully.',
            });
          }, 100);
        } catch (error) {
          console.error('Error reordering tasks:', error);
          toast({
            title: 'Error',
            description: 'Failed to reorder tasks.',
            variant: 'destructive',
          });
          fetchTasks();
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task as TaskWithChecklist);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-medium">Tasks</h2>
              <p className="text-muted-foreground font-light text-sm">
                {tasks.length} tasks
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('kanban')}
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <QuickCreateTask
            projectId={project.id}
            companyId={project.company_id}
            onTaskCreated={() => { fetchTasks(); onRefresh(); }}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </QuickCreateTask>
        </div>

        {/* List View (Linear-like) */}
        {viewMode === 'list' && (
          <TaskListView
            tasks={tasks}
            onStatusChange={updateTaskStatus}
            onPriorityChange={updateTaskPriority}
            onTaskClick={handleTaskClick}
            onCreateTask={(status) => {
              // Could open QuickCreateTask with pre-selected status
            }}
          />
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {KANBAN_COLUMNS.map(column => {
                const columnTasks = getTasksByStatus(column.id as TaskStatus);

                return (
                  <div key={column.id} className="space-y-3">
                    {/* Column Header */}
                    <div className={`p-3 rounded-lg ${column.color}`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{column.title}</h3>
                        <Badge variant="secondary" className="text-xs">{columnTasks.length}</Badge>
                      </div>
                    </div>

                    {/* Droppable Column Area */}
                    <DroppableColumn id={column.id} isEmpty={columnTasks.length === 0}>
                      <SortableContext
                        id={column.id}
                        items={columnTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {columnTasks.length > 0 ? (
                          columnTasks.map((task) => (
                            <SortableTaskCard
                              key={`task-${task.id}-${task.status}`}
                              task={task}
                              project={project}
                              onEdit={fetchTasks}
                              onStatusChange={updateTaskStatus}
                              onChecklistToggle={toggleChecklistItem}
                              onRefresh={onRefresh}
                              onDeleteTask={handleDeleteTask}
                              subtasksCount={subtasksCounts[task.id]}
                              onCardClick={handleTaskClick}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm font-light">No tasks</p>
                          </div>
                        )}
                      </SortableContext>
                    </DroppableColumn>
                  </div>
                );
              })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <Card className="shadow-2xl rotate-3 opacity-90">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {activeTask.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {STATUS_CONFIG[activeTask.status]?.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onTaskUpdated={() => {
            fetchTasks();
            onRefresh();
            setSelectedTask(null);
          }}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        >
          <span />
        </EditTaskModal>
      )}
    </>
  );
}
