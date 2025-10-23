import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, Users, CheckCircle, XCircle, CalendarClock } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  meeting_type: 'internal' | 'client' | 'kickoff' | 'review';
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link: string | null;
}

interface PublicProjectMeetingsProps {
  meetings: Meeting[];
}

export function PublicProjectMeetings({ meetings }: PublicProjectMeetingsProps) {
  const getTypeColor = (type: string) => {
    const colors = {
      internal: 'bg-blue-100 text-blue-800 border-blue-200',
      client: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      kickoff: 'bg-purple-100 text-purple-800 border-purple-200',
      review: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      internal: 'Interna',
      client: 'Com Cliente',
      kickoff: 'Kickoff',
      review: 'Revisão',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Agendada',
      completed: 'Realizada',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <CalendarClock className="h-4 w-4" />;
    }
  };

  // Separar reuniões futuras e passadas
  const now = new Date();
  const upcomingMeetings = meetings
    .filter(m => m.status === 'scheduled' && isFuture(new Date(m.meeting_date)))
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime());

  const pastMeetings = meetings
    .filter(m => m.status !== 'scheduled' || isPast(new Date(m.meeting_date)))
    .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());

  if (meetings.length === 0) {
    return (
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Nenhuma reunião agendada</p>
          <p className="text-sm text-gray-600">
            As reuniões do projeto aparecerão aqui quando forem criadas
          </p>
        </CardContent>
      </Card>
    );
  }

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const meetingDate = new Date(meeting.meeting_date);
    const isUpcoming = isFuture(meetingDate) && meeting.status === 'scheduled';

    return (
      <Card className={`bg-white border shadow-sm hover:shadow-md transition-all ${
        isUpcoming ? 'border-l-4 border-l-blue-600' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CardTitle className="text-lg text-gray-900">{meeting.title}</CardTitle>
                {isUpcoming && (
                  <Badge className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
                    ● Próxima
                  </Badge>
                )}
              </div>
              {meeting.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {meeting.description}
                </p>
              )}
            </div>
            <div className="flex flex-row md:flex-col gap-2">
              <Badge variant="outline" className={`${getTypeColor(meeting.meeting_type)} border-2`}>
                <Users className="h-3 w-3 mr-1" />
                {getTypeLabel(meeting.meeting_type)}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(meeting.status)} border-2`}>
                {getStatusIcon(meeting.status)}
                <span className="ml-1">{getStatusLabel(meeting.status)}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-gray-900 font-medium">
                {format(meetingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-gray-900 font-medium">
                {format(meetingDate, "HH:mm", { locale: ptBR })} • {meeting.duration_minutes} min
              </span>
            </div>

            {meeting.meeting_link && meeting.status === 'scheduled' && (
              <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Video className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate font-semibold"
                >
                  Acessar link da reunião →
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Reuniões Próximas */}
      {upcomingMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Próximas Reuniões</h3>
            <Badge className="ml-auto bg-blue-600 hover:bg-blue-700 text-white">
              {upcomingMeetings.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {upcomingMeetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Reuniões Passadas */}
      {pastMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <div className="p-2 bg-gray-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Histórico de Reuniões</h3>
            <Badge variant="outline" className="ml-auto bg-white border-2 border-gray-300">
              {pastMeetings.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {pastMeetings.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      <Card className="bg-blue-50 border-2 border-blue-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900">
                {meetings.length} reuniã{meetings.length !== 1 ? 'ões' : 'o'} no total
              </p>
              <p className="text-sm text-gray-700 mt-1 font-medium">
                {upcomingMeetings.length} próxima{upcomingMeetings.length !== 1 ? 's' : ''} • {' '}
                {meetings.filter(m => m.status === 'completed').length} realizada{meetings.filter(m => m.status === 'completed').length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
