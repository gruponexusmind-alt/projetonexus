import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TaskSubtasksComponent } from './TaskSubtasksComponent';
import { TaskProgressIndicatorV2 } from './TaskProgressIndicatorV2';
import { 
  MoreVertical, 
  User, 
  Calendar, 
  Clock,
  CheckSquare,
  Flag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  assigned_to?: string;
  assignee?: { nome: string };
  project_id: string;
  company_id: string;
  labels?: Array<{ id: string; name: string; color: string; }>;
}

interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
}

interface KanbanCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onChecklistToggle: (itemId: string, isCompleted: boolean) => void;
  onProgressUpdate?: () => void;
  onTaskEdit?: () => void;
  checklistItems: ChecklistItem[];
  companyId: string;
}

export function KanbanCard({ 
  task, 
  onStatusChange, 
  onChecklistToggle,
  onProgressUpdate,
  onTaskEdit,
  checklistItems,
  companyId
}: KanbanCardProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subtasksCount, setSubtasksCount] = useState(0);
  const [subtasksCompleted, setSubtasksCompleted] = useState(0);

  // Fetch subtasks count for progress calculation
  useEffect(() => {
    const fetchSubtasksCount = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase
          .from('gp_task_subtasks')
          .select('id, is_done')
          .eq('task_id', task.id);
        
        if (data) {
          setSubtasksCount(data.length);
          setSubtasksCompleted(data.filter(s => s.is_done).length);
        }
      } catch (error) {
        console.error('Erro ao buscar subtarefas:', error);
      }
    };

    fetchSubtasksCount();
  }, [task.id, showSubtasks]); // Re-fetch when subtasks are toggled

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <DropdownMenu>
      <Card className="w-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-muted rounded">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge className={getPriorityColor(task.priority)} variant="secondary">
              <Flag className="h-3 w-3 mr-1" />
              {getPriorityLabel(task.priority)}
            </Badge>
            {isOverdue() && (
              <Badge variant="destructive">
                <Clock className="h-3 w-3 mr-1" />
                Atrasada
              </Badge>
            )}
          </div>

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

          {/* Meta info */}
          <div className="space-y-1 text-xs text-muted-foreground">
            {task.assignee?.nome && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignee.nome}</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_hours}h estimadas</span>
              </div>
            )}
          </div>

          {/* Checklist preview */}
          {checklistItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckSquare className="h-3 w-3" />
                <span>
                  {checklistItems.filter(item => item.is_done).length}/{checklistItems.length} checklist
                </span>
              </div>
              
              {/* Show first 2 checklist items */}
              <div className="space-y-1">
                {checklistItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.is_done}
                      onChange={() => onChecklistToggle(item.id, !item.is_done)}
                      className="rounded text-primary"
                    />
                    <span 
                      className={`text-xs ${
                        item.is_done ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
                {checklistItems.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{checklistItems.length - 2} mais itens
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Progress with Smart Indicator V2 */}
          <TaskProgressIndicatorV2
            taskId={task.id}
            onProgressUpdate={onProgressUpdate}
            size="sm"
          />

          {/* Subtasks toggle */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSubtasks ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Subtarefas
            </button>
          </div>

          {/* Subtasks component */}
          {showSubtasks && (
            <TaskSubtasksComponent
              taskId={task.id}
              companyId={companyId}
              onProgressUpdate={onProgressUpdate}
            />
          )}
        </CardContent>
      </Card>

      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onTaskEdit?.()}>
          Editar Tarefa
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'pending')}>
          Mover para Pendente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
          Mover para Em Progresso
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'review')}>
          Mover para Em Revisão
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>
          Mover para Concluído
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}