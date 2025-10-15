import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  Clock,
  Flag,
  FolderOpen,
} from 'lucide-react';
import { MyDayTask } from '@/hooks/useMyDayData';

interface DraggableTaskCardProps {
  task: MyDayTask;
  isDragging?: boolean;
}

export function DraggableTaskCard({ task, isDragging: externalIsDragging }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: dndIsDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task: task,
    },
  });

  const isDragging = externalIsDragging || dndIsDragging;

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-red-100 text-red-800 border-red-200'
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
      pending: 'border-l-gray-400',
      in_progress: 'border-l-blue-500',
      review: 'border-l-purple-500',
      completed: 'border-l-green-500'
    };
    return colors[status as keyof typeof colors] || 'border-l-gray-400';
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`
          w-full
          hover:shadow-md
          transition-all
          border-l-4
          ${getStatusColor(task.status)}
          ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}
        `}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {/* Grip handle */}
            <button
              {...listeners}
              {...attributes}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing mt-1"
              aria-label="Arrastar tarefa"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Task content */}
            <div className="flex-1 space-y-2">
              {/* Title */}
              <h4 className="font-medium text-sm leading-snug line-clamp-2">
                {task.title}
              </h4>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Project */}
                {task.project_title && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FolderOpen className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{task.project_title}</span>
                  </div>
                )}

                {/* Priority */}
                <Badge className={getPriorityColor(task.priority)} variant="secondary">
                  <Flag className="h-3 w-3 mr-1" />
                  {getPriorityLabel(task.priority)}
                </Badge>

                {/* Estimated time */}
                {task.estimated_time_minutes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_time_minutes}min</span>
                  </div>
                )}
              </div>

              {/* Scheduled time indicator */}
              {task.scheduled_time && (
                <div className="text-xs font-medium text-primary">
                  Agendada: {task.scheduled_time.substring(0, 5)}
                </div>
              )}

              {/* Focus indicator */}
              {task.is_focused && (
                <Badge variant="outline" className="text-xs">
                  Foco do dia
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
