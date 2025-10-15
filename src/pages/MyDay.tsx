import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyDayData } from '@/hooks/useMyDayData';
import { DayTimeline } from '@/components/DayTimeline';
import { DraggableTaskCard } from '@/components/DraggableTaskCard';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp,
  Calendar,
  Flag,
  FolderOpen,
  RefreshCw,
  Target,
  AlertCircle,
  List,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MyDayTask } from '@/hooks/useMyDayData';

export default function MyDay() {
  const {
    loading,
    todayTasks,
    focusedTasks,
    todayMeetings,
    stats,
    refresh,
    scheduleTaskToTime,
    removeTaskFromSchedule,
    getUnscheduledTasks,
    getScheduledTasks,
    calculateDayCapacity,
  } = useMyDayData();

  const [activeTask, setActiveTask] = useState<MyDayTask | null>(null);

  const unscheduledTasks = getUnscheduledTasks();
  const scheduledTasks = getScheduledTasks();
  const dayCapacity = calculateDayCapacity();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = todayTasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    // Check if dropping on a timeslot
    if (over.data.current?.type === 'timeslot') {
      const taskId = active.id as string;
      const hour = over.data.current.hour;

      const result = await scheduleTaskToTime(taskId, hour);

      if (result?.success) {
        toast.success(`Tarefa agendada para ${hour.toString().padStart(2, '0')}:00`);
      } else {
        toast.error(result?.error || 'Erro ao agendar tarefa');
      }
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    const result = await removeTaskFromSchedule(taskId);

    if (result?.success) {
      toast.success('Tarefa removida do horário');
    } else {
      toast.error(result?.error || 'Erro ao remover tarefa do horário');
    }
  };

  const getCapacityColor = () => {
    switch (dayCapacity.status) {
      case 'light':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'full':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'impossible':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCapacityLabel = () => {
    switch (dayCapacity.status) {
      case 'light':
        return 'Dia Leve';
      case 'normal':
        return 'Dia Normal';
      case 'full':
        return 'Dia Cheio';
      case 'impossible':
        return 'Sobrecarregado';
      default:
        return 'Capacidade';
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      review: 'Em Revisão',
      completed: 'Concluída',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meu Dia" description="Carregando..." />
        <div className="p-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <PageHeader
          title="Meu Dia"
          description={`Suas tarefas e compromissos para ${format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}`}
        >
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </PageHeader>

        <div className="p-6 space-y-6">
          {/* Estatísticas do Dia */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-violet-50 via-violet-50/50 to-transparent border-violet-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet-700">Total</CardTitle>
                <Target className="h-4 w-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-violet-700">
                  {stats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tarefas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 via-green-50/50 to-transparent border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Concluídas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-green-700">
                  {stats.completedTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats.completionRate}%</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Em Progresso</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-blue-700">
                  {stats.inProgressTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ativas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 via-amber-50/50 to-transparent border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">Tempo</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-amber-700">
                  {Math.round(stats.estimatedTimeTotal / 60)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stats.estimatedTimeTotal % 60}min</p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${getCapacityColor()}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{getCapacityLabel()}</CardTitle>
                {dayCapacity.status === 'impossible' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">
                  {dayCapacity.occupancyRate}%
                </div>
                <p className="text-xs mt-1">
                  {dayCapacity.remainingTime > 0
                    ? `${Math.round(dayCapacity.remainingTime / 60)}h livres`
                    : 'Sem tempo livre'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progresso do Dia */}
          {stats.totalTasks > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progresso do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Conclusão das tarefas</span>
                    <span className="font-semibold">{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stats.completedTasks} concluídas</span>
                    <span>{stats.pendingTasks + stats.inProgressTasks} restantes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layout 2 Colunas: Tarefas e Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda: Tarefas não agendadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Tarefas para Agendar
                </CardTitle>
                <CardDescription>
                  Arraste as tarefas para a timeline para agendá-las
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unscheduledTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Todas as tarefas estão agendadas!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {unscheduledTasks.map((task) => (
                      <DraggableTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coluna Direita: Timeline com tarefas agendadas e reuniões */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline do Dia
                </CardTitle>
                <CardDescription>
                  Suas tarefas e reuniões agendadas por horário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DayTimeline
                  meetings={todayMeetings}
                  tasks={todayTasks}
                  onRemoveTask={handleRemoveTask}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && <DraggableTaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
