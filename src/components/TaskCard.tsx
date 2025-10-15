import { TimelineTask } from '@/hooks/useTimelineData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, User, Flag, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: TimelineTask;
  onClick: (task: TimelineTask) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-800 border-slate-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      review: 'bg-amber-100 text-amber-800 border-amber-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      review: 'Em Revisão',
      completed: 'Concluída',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-amber-600',
      high: 'text-red-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-emerald-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 hover:scale-[1.01]"
      style={{
        borderLeftColor: task.status === 'completed' ? '#10b981' :
                         task.status === 'in_progress' ? '#3b82f6' :
                         task.status === 'review' ? '#f59e0b' :
                         '#64748b'
      }}
      onClick={() => onClick(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Indicator */}
          <div className="flex-shrink-0">
            <div className={`w-3 h-3 rounded-full mt-1.5 ${
              task.status === 'completed' ? 'bg-emerald-500' :
              task.status === 'in_progress' ? 'bg-blue-500' :
              task.status === 'review' ? 'bg-amber-500' :
              'bg-slate-400'
            }`} />
          </div>

          {/* Task Info */}
          <div className="flex-1 space-y-3 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={`${getStatusColor(task.status)} flex-shrink-0 border`}
              >
                {getStatusLabel(task.status)}
              </Badge>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {/* Datas */}
              {task.start_date && task.due_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(parseISO(task.start_date), 'dd/MM/yy', { locale: ptBR })}
                    {' → '}
                    {format(parseISO(task.due_date), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                </div>
              )}

              {/* Responsável */}
              {task.assigned_user_name && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="truncate max-w-[150px]">{task.assigned_user_name}</span>
                </div>
              )}

              {/* Prioridade */}
              <div className="flex items-center gap-1.5">
                <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                <span className={getPriorityColor(task.priority)}>
                  {task.priority === 'high' ? 'Alta' :
                   task.priority === 'medium' ? 'Média' :
                   'Baixa'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">Progresso</span>
                <span className="font-semibold">{task.progress}%</span>
              </div>
              <Progress
                value={task.progress}
                className="h-2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
