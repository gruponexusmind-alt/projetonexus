import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeEntryModal } from '@/components/TimeEntryModal';
import { supabase } from '@/integrations/supabase/client';
import { TimeEntry, formatDuration } from '@/types/timeEntry';
import {
  Clock,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  Timer as TimerIcon,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TimeEntryWithUser extends TimeEntry {
  user?: {
    nome: string;
  };
}

interface TaskTimeHistoryProps {
  taskId: string;
  onEntriesChange?: () => void;
}

export function TaskTimeHistory({ taskId, onEntriesChange }: TaskTimeHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskData, setTaskData] = useState<{
    actual_time_minutes: number;
    estimated_time_minutes: number | null;
  } | null>(null);

  useEffect(() => {
    fetchTimeData();
  }, [taskId]);

  const fetchTimeData = async () => {
    try {
      setLoading(true);

      // Buscar time entries da tarefa
      const { data: entries, error: entriesError } = await supabase
        .from('gp_time_entries')
        .select(`
          *,
          user:profiles(nome)
        `)
        .eq('task_id', taskId)
        .not('end_time', 'is', null) // Só finalizados
        .order('start_time', { ascending: false });

      if (entriesError) throw entriesError;

      // Buscar dados da tarefa (tempo total)
      const { data: task, error: taskError } = await supabase
        .from('gp_tasks')
        .select('actual_time_minutes, estimated_time_minutes')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      setTimeEntries(entries || []);
      setTaskData(task);
    } catch (error) {
      console.error('Erro ao carregar histórico de tempo:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este registro de tempo?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('gp_time_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast.success('Registro excluído');
      await fetchTimeData();
      onEntriesChange?.();
    } catch (error: any) {
      console.error('Erro ao excluir registro:', error);
      toast.error('Erro ao excluir registro', {
        description: error.message,
      });
    }
  };

  const handleAddSuccess = async () => {
    await fetchTimeData();
    onEntriesChange?.();
  };

  // Calcular variação e status
  const getTimeStats = () => {
    if (!taskData) return null;

    const { actual_time_minutes, estimated_time_minutes } = taskData;

    if (!estimated_time_minutes) {
      return {
        variance: null,
        percentageDiff: null,
        status: 'no_estimate' as const,
        statusLabel: 'Sem Estimativa',
        statusColor: 'text-gray-600 bg-gray-100',
      };
    }

    const variance = actual_time_minutes - estimated_time_minutes;
    const percentageDiff = (variance / estimated_time_minutes) * 100;

    let status: 'on_track' | 'slightly_over' | 'significantly_over';
    let statusLabel: string;
    let statusColor: string;

    if (variance <= 0) {
      status = 'on_track';
      statusLabel = 'No Prazo';
      statusColor = 'text-green-700 bg-green-100 border-green-200';
    } else if (percentageDiff <= 25) {
      status = 'slightly_over';
      statusLabel = 'Levemente Acima';
      statusColor = 'text-yellow-700 bg-yellow-100 border-yellow-200';
    } else {
      status = 'significantly_over';
      statusLabel = 'Muito Acima';
      statusColor = 'text-red-700 bg-red-100 border-red-200';
    }

    return {
      variance,
      percentageDiff,
      status,
      statusLabel,
      statusColor,
    };
  };

  const stats = getTimeStats();
  const totalMinutes = taskData?.actual_time_minutes || 0;
  const estimatedMinutes = taskData?.estimated_time_minutes || 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Tempo
              </CardTitle>
              <CardDescription>
                Sessões de trabalho registradas ({timeEntries.length})
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Manual
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumo de Tempo */}
          {stats && (
            <Card className={cn('border-2', stats.statusColor)}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold">Resumo de Tempo</span>
                    </div>
                    <Badge variant="outline" className={stats.statusColor}>
                      {stats.statusLabel}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tempo Total</p>
                      <p className="text-lg font-bold">{formatDuration(totalMinutes)}</p>
                    </div>
                    {estimatedMinutes > 0 && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Estimado</p>
                          <p className="text-lg font-bold">{formatDuration(estimatedMinutes)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Variação</p>
                          <p className={cn('text-lg font-bold flex items-center gap-1')}>
                            {stats.variance && stats.variance > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {stats.variance && stats.variance > 0 ? '+' : ''}
                            {stats.variance ? formatDuration(Math.abs(stats.variance)) : '-'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Sessões */}
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TimerIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma sessão registrada ainda</p>
              <p className="text-sm mt-1">Inicie o timer ou adicione tempo manualmente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {timeEntries.map((entry, index) => (
                <Card key={entry.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Sessão #{timeEntries.length - index}
                          </Badge>
                          <span className="text-sm font-medium">
                            {format(new Date(entry.start_time), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                          {entry.entry_type === 'timer' ? (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <TimerIcon className="h-3 w-3 mr-1" />
                              Timer
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Manual
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="h-4 w-4" />
                            {formatDuration(entry.duration_minutes || 0)}
                          </div>
                          {entry.user && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              {entry.user.nome}
                            </div>
                          )}
                        </div>

                        {entry.description && (
                          <p className="text-sm text-muted-foreground italic">
                            "{entry.description}"
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Adicionar Tempo Manual */}
      {showAddModal && (
        <TimeEntryModal
          taskId={taskId}
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSuccess={handleAddSuccess}
        />
      )}
    </>
  );
}
