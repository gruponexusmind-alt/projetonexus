import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TimeEntryModal } from '@/components/TimeEntryModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, formatDuration } from '@/types/timeEntry';
import {
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserTimeSummary {
  today_minutes: number;
  week_minutes: number;
  month_minutes: number;
}

interface TimeEntryWithTask extends TimeEntry {
  task?: {
    title: string;
    project?: {
      title: string;
    };
  };
}

export default function TimeReports() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<UserTimeSummary>({
    today_minutes: 0,
    week_minutes: 0,
    month_minutes: 0,
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchTimeData();
    }
  }, [profile?.id]);

  const fetchTimeData = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Fetch user time summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('v_user_time_summary')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        throw summaryError;
      }

      if (summaryData) {
        setSummary({
          today_minutes: summaryData.today_minutes || 0,
          week_minutes: summaryData.week_minutes || 0,
          month_minutes: summaryData.month_minutes || 0,
        });
      }

      // Fetch recent time entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: entriesData, error: entriesError } = await supabase
        .from('gp_time_entries')
        .select(`
          *,
          task:gp_tasks(
            title,
            project:gp_projects(title)
          )
        `)
        .eq('user_id', profile.id)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .order('start_time', { ascending: false })
        .limit(50);

      if (entriesError) throw entriesError;

      setTimeEntries(entriesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados de tempo:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este registro de tempo?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('gp_time_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', profile?.id); // Security check

      if (error) throw error;

      toast.success('Registro excluído');
      fetchTimeData();
    } catch (error: any) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro', {
        description: error.message,
      });
    }
  };

  const getEntryTypeLabel = (type: string) => {
    return type === 'timer' ? 'Timer' : 'Manual';
  };

  const getEntryTypeBadge = (type: string) => {
    return type === 'timer' ? (
      <Badge variant="default" className="bg-green-600">Timer</Badge>
    ) : (
      <Badge variant="outline">Manual</Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Relatórios de Tempo" description="Carregando..." />
        <div className="p-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Relatórios de Tempo"
          description="Visualize e gerencie seu tempo registrado"
        >
          <Button onClick={fetchTimeData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </PageHeader>

        <div className="p-6 space-y-6">
          {/* Time Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Hoje</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-blue-700">
                  {formatDuration(summary.today_minutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.today_minutes} minutos trabalhados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 via-green-50/50 to-transparent border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Esta Semana</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-green-700">
                  {formatDuration(summary.week_minutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.week_minutes} minutos trabalhados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 via-violet-50/50 to-transparent border-violet-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet-700">Este Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-violet-700">
                  {formatDuration(summary.month_minutes)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.month_minutes} minutos trabalhados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time Entries Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Registros de Tempo Recentes
                  </CardTitle>
                  <CardDescription>Últimos 30 dias</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedTaskId(null);
                    setShowAddModal(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum registro de tempo encontrado</p>
                  <p className="text-sm mt-1">Comece registrando seu tempo de trabalho</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tarefa</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Término</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {format(new Date(entry.start_time), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {entry.task?.title || 'Tarefa excluída'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate text-muted-foreground text-sm">
                              {entry.task?.project?.title || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.start_time), "HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {entry.end_time
                              ? format(new Date(entry.end_time), "HH:mm", { locale: ptBR })
                              : <Badge variant="default" className="bg-green-600">Em execução</Badge>
                            }
                          </TableCell>
                          <TableCell className="font-semibold">
                            {entry.duration_minutes ? formatDuration(entry.duration_minutes) : '-'}
                          </TableCell>
                          <TableCell>{getEntryTypeBadge(entry.entry_type)}</TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {entry.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Time Entry Modal */}
      {showAddModal && (
        <TimeEntryModal
          taskId={selectedTaskId || ''}
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSuccess={fetchTimeData}
        />
      )}
    </>
  );
}
