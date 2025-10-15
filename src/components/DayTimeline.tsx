import { MyDayMeeting } from '@/hooks/useMyDayData';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayTimelineProps {
  meetings: MyDayMeeting[];
}

export function DayTimeline({ meetings }: DayTimelineProps) {
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

  // Hora atual
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = new Date().toDateString() === now.toDateString();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Timeline do Dia</h3>
      </div>

      <div className="relative">
        {hours.map((hour) => {
          const hasMeetings = meetingsByHour.has(hour);
          const hourMeetings = meetingsByHour.get(hour) || [];
          const isCurrentHour = isToday && currentHour === hour;

          return (
            <div
              key={hour}
              className={`flex gap-4 py-3 border-l-2 pl-4 relative ${
                isCurrentHour
                  ? 'border-primary bg-primary/5'
                  : hasMeetings
                  ? 'border-blue-300'
                  : 'border-gray-200'
              }`}
            >
              {/* Hora */}
              <div className="flex-shrink-0 w-16">
                <div className={`text-sm font-medium ${isCurrentHour ? 'text-primary' : 'text-muted-foreground'}`}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {isCurrentHour && (
                  <Badge variant="default" className="text-xs mt-1">
                    Agora
                  </Badge>
                )}
              </div>

              {/* Indicador de hora atual */}
              {isCurrentHour && (
                <div className="absolute left-0 top-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white" />
              )}

              {/* Reuniões */}
              <div className="flex-1 space-y-2">
                {hourMeetings.map((meeting) => {
                  const meetingTime = new Date(meeting.meeting_date);
                  const minutes = meetingTime.getMinutes();

                  return (
                    <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{meeting.title}</div>
                            {meeting.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {meeting.description}
                              </div>
                            )}
                            {meeting.project_title && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {meeting.project_title}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {hour.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {meeting.duration_minutes}min
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {!hasMeetings && !isCurrentHour && (
                  <div className="text-xs text-muted-foreground italic">Nenhuma reunião</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {meetings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma reunião agendada para hoje</p>
        </div>
      )}
    </div>
  );
}
