import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, X } from 'lucide-react';
import { MyDayTask, MyDayMeeting } from '@/hooks/useMyDayData';
import { Button } from '@/components/ui/button';

interface DroppableTimeSlotProps {
  hour: number;
  tasks: MyDayTask[];
  meetings: MyDayMeeting[];
  isCurrentHour?: boolean;
  onRemoveTask?: (taskId: string) => void;
}

export function DroppableTimeSlot({
  hour,
  tasks,
  meetings,
  isCurrentHour,
  onRemoveTask,
}: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: {
      type: 'timeslot',
      hour: hour,
    },
  });

  const hasContent = tasks.length > 0 || meetings.length > 0;
  const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimated_time_minutes || 0), 0) +
                       meetings.reduce((sum, meeting) => sum + meeting.duration_minutes, 0);

  return (
    <div
      ref={setNodeRef}
      className={`
        relative
        border-l-2
        ${isCurrentHour ? 'border-l-primary bg-primary/5' : 'border-l-border'}
        ${isOver ? 'bg-primary/10 ring-2 ring-primary' : ''}
        transition-all
        min-h-[80px]
      `}
    >
      {/* Hour label */}
      <div className="sticky top-0 left-0 p-2 flex items-center justify-between bg-background/80 backdrop-blur-sm z-10 border-b">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isCurrentHour ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`font-medium text-sm ${isCurrentHour ? 'text-primary' : 'text-muted-foreground'}`}>
            {hour.toString().padStart(2, '0')}:00
          </span>
          {isCurrentHour && (
            <Badge variant="default" className="text-xs">
              Agora
            </Badge>
          )}
        </div>

        {totalMinutes > 0 && (
          <span className="text-xs text-muted-foreground">
            {totalMinutes}min
          </span>
        )}
      </div>

      {/* Drop zone indicator */}
      {isOver && !hasContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-md border-2 border-dashed border-primary">
            Solte aqui para agendar às {hour.toString().padStart(2, '0')}:00
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="p-2 space-y-2">
        {/* Meetings */}
        {meetings.map((meeting) => (
          <Card
            key={meeting.id}
            className="p-2 bg-blue-50 border-blue-200 border-l-4 border-l-blue-500"
          >
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-blue-900 truncate">
                  {meeting.title}
                </h4>
                {meeting.project_title && (
                  <p className="text-xs text-blue-700 truncate">
                    {meeting.project_title}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  {meeting.duration_minutes} minutos
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* Tasks */}
        {tasks.map((task) => (
          <Card
            key={task.id}
            className="p-2 bg-card border-l-4 border-l-primary hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {task.title}
                </h4>
                {task.project_title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {task.project_title}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {task.estimated_time_minutes && (
                    <span className="text-xs text-muted-foreground">
                      {task.estimated_time_minutes}min
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </div>
              {onRemoveTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onRemoveTask(task.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {/* Empty state */}
        {!hasContent && !isOver && (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            Arraste uma tarefa aqui
          </div>
        )}
      </div>
    </div>
  );
}
