import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Video, Users, Edit, Trash2, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  meeting_type: 'internal' | 'client' | 'kickoff' | 'review';
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link: string | null;
  notes: string | null;
  attendees: any;
  agenda: any;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  company_id?: string;
}

interface ProjectMeetingsTabProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectMeetingsTab({ project, onRefresh }: ProjectMeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
  }, [project.id]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gp_meetings')
        .select('*')
        .eq('project_id', project.id)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as reuniões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('gp_meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Reunião excluída com sucesso.',
      });

      fetchMeetings();
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a reunião.',
        variant: 'destructive',
      });
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      internal: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
      kickoff: 'bg-purple-100 text-purple-800',
      review: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      internal: 'Interna',
      client: 'Cliente',
      kickoff: 'Kickoff',
      review: 'Revisão',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Agendada',
      completed: 'Realizada',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filterType !== 'all' && meeting.meeting_type !== filterType) {
      return false;
    }
    if (filterStatus !== 'all' && meeting.status !== filterStatus) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reuniões do Projeto</h2>
          <p className="text-muted-foreground">Gerencie as reuniões e encontros do projeto</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="internal">Interna</SelectItem>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="kickoff">Kickoff</SelectItem>
            <SelectItem value="review">Revisão</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="completed">Realizada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Reuniões */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {meetings.length === 0
                ? 'Nenhuma reunião cadastrada ainda. Clique em "Nova Reunião" para criar a primeira.'
                : 'Nenhuma reunião encontrada com os filtros aplicados.'}
            </p>
          </Card>
        ) : (
          filteredMeetings.map(meeting => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <Badge variant="secondary" className={getTypeColor(meeting.meeting_type)}>
                        {getTypeLabel(meeting.meeting_type)}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(meeting.status)}>
                        {getStatusLabel(meeting.status)}
                      </Badge>
                    </div>
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground">{meeting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMeeting(meeting);
                        setShowCreateModal(true);
                      }}
                      title="Editar reunião"
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMeetingToDelete(meeting.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Excluir reunião"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(meeting.meeting_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.duration_minutes} minutos</span>
                  </div>
                  {meeting.meeting_link && (
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        Link da reunião
                      </a>
                    </div>
                  )}
                </div>
                {meeting.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium mb-1">Notas da Reunião:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criar/Editar */}
      <CreateMeetingModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setEditingMeeting(null);
          }
        }}
        projectId={project.id}
        meeting={editingMeeting}
        onMeetingCreated={() => {
          fetchMeetings();
          setShowCreateModal(false);
          setEditingMeeting(null);
        }}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!meetingToDelete} onOpenChange={() => setMeetingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (meetingToDelete) {
                  deleteMeeting(meetingToDelete);
                  setMeetingToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
