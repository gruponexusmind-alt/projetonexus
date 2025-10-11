import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  duration_minutes: number;
  status: string;
  meeting_type: string;
  meeting_link: string;
  notes: string;
  project: {
    title: string;
    id: string;
  };
  attendees: any[];
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_meetings')
        .select(`
          id,
          title,
          description,
          meeting_date,
          duration_minutes,
          status,
          meeting_type,
          meeting_link,
          notes,
          project:gp_projects(id, title)
        `)
        .order('meeting_date', { ascending: true });

      if (error) throw error;

      const formattedMeetings = data?.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description || '',
        meeting_date: meeting.meeting_date,
        duration_minutes: meeting.duration_minutes || 60,
        status: meeting.status || 'scheduled',
        meeting_type: meeting.meeting_type || 'internal',
        meeting_link: meeting.meeting_link || '',
        notes: meeting.notes || '',
        project: {
          id: meeting.project?.id || '',
          title: meeting.project?.title || 'Projeto não vinculado'
        },
        attendees: []
      })) || [];

      setMeetings(formattedMeetings);
    } catch (error) {
      console.error('Erro ao buscar reuniões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as reuniões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      internal: 'bg-purple-100 text-purple-800',
      client: 'bg-blue-100 text-blue-800',
      kickoff: 'bg-green-100 text-green-800',
      review: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const todayMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.meeting_date);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  });

  const upcomingMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.meeting_date);
    const today = new Date();
    return meetingDate > today;
  }).slice(0, 5);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reuniões" 
        description="Gerencie suas reuniões e compromissos"
      >
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Button>
      </PageHeader>
      
      <div className="p-6 space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="today" className="space-y-4">
            <TabsList>
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              <h3 className="text-lg font-semibold">Reuniões de Hoje</h3>
              {todayMeetings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhuma reunião agendada para hoje.
                  </CardContent>
                </Card>
              ) : (
                todayMeetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          <CardDescription>{meeting.project.title}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(meeting.status)}>
                            {meeting.status === 'scheduled' && 'Agendada'}
                            {meeting.status === 'in_progress' && 'Em Andamento'}
                            {meeting.status === 'completed' && 'Concluída'}
                            {meeting.status === 'cancelled' && 'Cancelada'}
                          </Badge>
                          <Badge className={getTypeColor(meeting.meeting_type)}>
                            {meeting.meeting_type === 'internal' && 'Interna'}
                            {meeting.meeting_type === 'client' && 'Cliente'}
                            {meeting.meeting_type === 'kickoff' && 'Kickoff'}
                            {meeting.meeting_type === 'review' && 'Revisão'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatTime(meeting.meeting_date)} - {meeting.duration_minutes} min
                        </div>
                        {meeting.meeting_link && (
                          <div className="flex items-center gap-2 text-sm">
                            <Video className="h-4 w-4" />
                            <a 
                              href={meeting.meeting_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Link da Reunião
                            </a>
                          </div>
                        )}
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              <h3 className="text-lg font-semibold">Próximas Reuniões</h3>
              {upcomingMeetings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhuma reunião futura agendada.
                  </CardContent>
                </Card>
              ) : (
                upcomingMeetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          <CardDescription>{meeting.project.title}</CardDescription>
                        </div>
                        <Badge className={getTypeColor(meeting.meeting_type)}>
                          {meeting.meeting_type === 'internal' && 'Interna'}
                          {meeting.meeting_type === 'client' && 'Cliente'}
                          {meeting.meeting_type === 'kickoff' && 'Kickoff'}
                          {meeting.meeting_type === 'review' && 'Revisão'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {formatDate(meeting.meeting_date)} às {formatTime(meeting.meeting_date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {meeting.duration_minutes} minutos
                        </div>
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <h3 className="text-lg font-semibold">Todas as Reuniões</h3>
              {meetings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Nenhuma reunião encontrada.
                  </CardContent>
                </Card>
              ) : (
                meetings.map((meeting) => (
                  <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          <CardDescription>{meeting.project.title}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(meeting.status)}>
                            {meeting.status === 'scheduled' && 'Agendada'}
                            {meeting.status === 'in_progress' && 'Em Andamento'}
                            {meeting.status === 'completed' && 'Concluída'}
                            {meeting.status === 'cancelled' && 'Cancelada'}
                          </Badge>
                          <Badge className={getTypeColor(meeting.meeting_type)}>
                            {meeting.meeting_type === 'internal' && 'Interna'}
                            {meeting.meeting_type === 'client' && 'Cliente'}
                            {meeting.meeting_type === 'kickoff' && 'Kickoff'}
                            {meeting.meeting_type === 'review' && 'Revisão'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          {formatDate(meeting.meeting_date)} às {formatTime(meeting.meeting_date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {meeting.duration_minutes} minutos
                        </div>
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground">
                            {meeting.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Hoje</span>
                  <span className="font-medium">{todayMeetings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Esta Semana</span>
                  <span className="font-medium">{upcomingMeetings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total</span>
                  <span className="font-medium">{meetings.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}