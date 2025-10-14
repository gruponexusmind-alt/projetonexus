import { useState, useEffect } from 'react';
import { Plus, MoreVertical, User, Calendar, Flag, Edit, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { CreateTaskModal } from '@/components/CreateTaskModal';
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

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
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

const COLUMNS = [
  { id: 'pending', title: 'Pendentes', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-100' },
  { id: 'review', title: 'Em Revisão', color: 'bg-purple-100' },
  { id: 'completed', title: 'Concluídas', color: 'bg-green-100' }
] as const;

// Componente de Task Card Drag & Drop
interface SortableTaskCardProps {
  task: TaskWithChecklist;
  project: Project;
  onEdit: () => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onChecklistToggle: (taskId: string, itemId: string, isDone: boolean) => void;
  onRefresh: () => void;
  getPriorityColor: (priority: Task['priority']) => string;
  getPriorityLabel: (priority: Task['priority']) => string;
  subtasksCount?: { count: number; completed: number };
}

function SortableTaskCard({
  task,
  project,
  onEdit,
  onStatusChange,
  onChecklistToggle,
  onRefresh,
  getPriorityColor,
  getPriorityLabel,
  subtasksCount,
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-md transition-all ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing hover:bg-accent rounded p-1"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
              {task.title}
            </CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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
                  Editar Tarefa
                </DropdownMenuItem>
              </EditTaskModal>
              {COLUMNS
                .filter(col => col.id !== task.status)
                .map(col => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => onStatusChange(task.id, col.id)}
                  >
                    Mover para {col.title}
                  </DropdownMenuItem>
                ))
              }
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
            Cliente Executa
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
                  +{task.checklist.length - 3} mais
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
  const { toast } = useToast();

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento antes de iniciar o drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms de toque antes de iniciar
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchTasks();
  }, [project.id]);

  const fetchTasks = async () => {
    try {
      // Fetch tasks with labels and assigned user, ordered by order_index then created_at
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

      // Fetch checklist items for all tasks
      const taskIds = tasksData?.map(t => t.id) || [];
      const { data: checklistData } = await supabase
        .from('gp_task_checklist')
        .select('*')
        .in('task_id', taskIds)
        .order('position');

      // Fetch subtasks counts for all tasks
      const { data: subtasksData } = await supabase
        .from('gp_task_subtasks')
        .select('task_id, is_done')
        .in('task_id', taskIds);

      // Group checklist by task_id
      const checklistByTask = (checklistData || []).reduce((acc, item) => {
        if (!acc[item.task_id]) {
          acc[item.task_id] = [];
        }
        acc[item.task_id].push(item);
        return acc;
      }, {} as Record<string, ChecklistItem[]>);

      // Group subtasks counts by task_id
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

      // Combine tasks with checklists and labels
      const tasksWithChecklist: TaskWithChecklist[] = (tasksData || []).map(task => ({
        ...task,
        status: task.status as Task['status'],
        priority: task.priority as Task['priority'],
        checklist: checklistByTask[task.id] || [],
        labels: task.labels?.map((l: any) => l.label).filter(Boolean) || []
      }));

      setTasks(tasksWithChecklist);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
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
        title: 'Sucesso',
        description: 'Status da tarefa atualizado.',
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
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
        title: 'Sucesso',
        description: 'Item do checklist atualizado.',
      });
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o checklist.',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return labels[priority] || priority;
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  // Handlers de Drag & Drop
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

    // Determinar novo status baseado na coluna de destino
    const overId = over.id as string;
    let newStatus: Task['status'] | null = null;

    // Se foi dropado em uma coluna
    if (COLUMNS.some(col => col.id === overId)) {
      newStatus = overId as Task['status'];
    }
    // Se foi dropado em outro card, usar o status do card
    else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // CASO 1: Mudança de status (movimento entre colunas)
    if (newStatus && newStatus !== task.status) {
      // Atualização otimista
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

        toast({
          title: 'Tarefa movida!',
          description: `Status atualizado para "${COLUMNS.find(c => c.id === newStatus)?.title}"`,
        });

        onRefresh();
      } catch (error) {
        // Rollback em caso de erro
        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, status: task.status, order_index: task.order_index } : t
          )
        );

        console.error('Erro ao atualizar status:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o status.',
          variant: 'destructive',
        });
      }
    }
    // CASO 2: Reordenação na mesma coluna
    else if (active.id !== over.id) {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask && overTask.status === task.status) {
        // Reordenar tarefas na mesma coluna
        const tasksInColumn = tasks.filter(t => t.status === task.status);
        const oldIndex = tasksInColumn.findIndex(t => t.id === taskId);
        const newIndex = tasksInColumn.findIndex(t => t.id === overId);

        if (oldIndex === newIndex) return;

        // Remover task da posição antiga e inserir na nova
        const reorderedTasks = [...tasksInColumn];
        const [movedTask] = reorderedTasks.splice(oldIndex, 1);
        reorderedTasks.splice(newIndex, 0, movedTask);

        // Atualizar order_index
        const updatedTasks = reorderedTasks.map((t, index) => ({
          ...t,
          order_index: index
        }));

        // Atualização otimista
        setTasks(prev => {
          const otherTasks = prev.filter(t => t.status !== task.status);
          return [...otherTasks, ...updatedTasks].sort((a, b) => a.order_index - b.order_index);
        });

        try {
          // Atualizar order_index no banco para todas as tarefas afetadas
          const updates = updatedTasks.map(t =>
            supabase
              .from('gp_tasks')
              .update({ order_index: t.order_index })
              .eq('id', t.id)
          );

          await Promise.all(updates);

          toast({
            title: 'Tarefa reordenada!',
            description: 'A ordem foi atualizada com sucesso.',
          });
        } catch (error) {
          console.error('Erro ao reordenar tarefas:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível reordenar as tarefas.',
            variant: 'destructive',
          });
          // Recarregar para garantir consistência
          fetchTasks();
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Encontrar task sendo arrastada para o DragOverlay
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Kanban - Tarefas</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medium">Kanban - Tarefas</h2>
            <p className="text-muted-foreground font-light">
              Arraste e solte para mover tarefas entre colunas
            </p>
          </div>
          <CreateTaskModal
            projectId={project.id}
            companyId={project.company_id}
            onTaskCreated={() => { fetchTasks(); onRefresh(); }}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </CreateTaskModal>
        </div>

        {/* Kanban Board com Drag & Drop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(column => {
            const columnTasks = getTasksByStatus(column.id);

            return (
              <div key={column.id} className="space-y-3">
                {/* Column Header */}
                <div className={`p-3 rounded-lg ${column.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{column.title}</h3>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
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
                      columnTasks.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          onEdit={fetchTasks}
                          onStatusChange={updateTaskStatus}
                          onChecklistToggle={toggleChecklistItem}
                          onRefresh={onRefresh}
                          getPriorityColor={getPriorityColor}
                          getPriorityLabel={getPriorityLabel}
                          subtasksCount={subtasksCounts[task.id]}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm font-light">Nenhuma tarefa</p>
                      </div>
                    )}
                  </SortableContext>
                </DroppableColumn>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - Preview da task sendo arrastada */}
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
                <Badge className={getPriorityColor(activeTask.priority)} variant="outline">
                  {getPriorityLabel(activeTask.priority)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {COLUMNS.find(c => c.id === activeTask.status)?.title}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}