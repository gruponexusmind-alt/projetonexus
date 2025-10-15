import { MyDayMeeting, MyDayTask } from '@/hooks/useMyDayData';
import { Calendar } from 'lucide-react';
import { DroppableTimeSlot } from './DroppableTimeSlot';

interface DayTimelineProps {
  meetings: MyDayMeeting[];
  tasks: MyDayTask[];
  onRemoveTask?: (taskId: string) => void;
  onTaskClick?: (task: MyDayTask) => void;
}

export function DayTimeline({ meetings, tasks, onRemoveTask, onTaskClick }: DayTimelineProps) {
  // Gerar linha do tempo de 8h às 20h
  const hours = Array.from({ length: 13 }, (_, i) => 8 + i); // 8h às 20h

  // Organizar reuniões por hora
  const meetingsByHour = new Map<number, MyDayMeeting[]>();
  meetings.forEach(meeting => {
    const meetingTime = new Date(meeting.meeting_date);
    const hour = meetingTime.getHours();
    if (!meetingsByHour.has(hour)) {
      meetingsByHour.set(hour, []);
    }
    meetingsByHour.get(hour)?.push(meeting);
  });

  // Organizar tarefas por hora agendado
  const tasksByHour = new Map<number, MyDayTask[]>();
  tasks.forEach(task => {
    if (task.scheduled_time) {
      const hour = parseInt(task.scheduled_time.split(':')[0]);
      if (!tasksByHour.has(hour)) {
        tasksByHour.set(hour, []);
      }
      tasksByHour.get(hour)?.push(task);
    }
  });

  // Hora atual
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = new Date().toDateString() === now.toDateString();

  const hasContent = meetings.length > 0 || tasks.filter(t => t.scheduled_time).length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Timeline do Dia</h3>
      </div>

      <div className="relative space-y-1">
        {hours.map((hour) => {
          const hourMeetings = meetingsByHour.get(hour) || [];
          const hourTasks = tasksByHour.get(hour) || [];
          const isCurrentHour = isToday && currentHour === hour;

          return (
            <DroppableTimeSlot
              key={hour}
              hour={hour}
              tasks={hourTasks}
              meetings={hourMeetings}
              isCurrentHour={isCurrentHour}
              onRemoveTask={onRemoveTask}
              onTaskClick={onTaskClick}
            />
          );
        })}
      </div>

      {!hasContent && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma reunião ou tarefa agendada para hoje</p>
          <p className="text-xs mt-2">Arraste tarefas para os horários da timeline</p>
        </div>
      )}
    </div>
  );
}
