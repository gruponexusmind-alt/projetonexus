import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyDayData } from '@/hooks/useMyDayData';
import { DayTimeline } from '@/components/DayTimeline';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyDay() {
  const {
    loading,
    todayTasks,
    focusedTasks,
    todayMeetings,
    stats,
    refresh,
  } = useMyDayData();

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-50 via-violet-50/50 to-transparent border-violet-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-700">Total de Tarefas</CardTitle>
              <Target className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-violet-700">
                {stats.totalTasks}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Para hoje
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completionRate}% do total
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Trabalhando agora
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 via-amber-50/50 to-transparent border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">Tempo Estimado</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-amber-700">
                {Math.round(stats.estimatedTimeTotal / 60)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.estimatedTimeTotal % 60}min total
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarefas Focadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Tarefas Focadas
              </CardTitle>
              <CardDescription>
                Tarefas priorizadas para hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {focusedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa focada para hoje</p>
                  <p className="text-xs mt-1">Adicione tarefas ao seu dia para focar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {focusedTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              <Flag className="h-3 w-3 mr-1" />
                              Alta
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {task.project_title && (
                            <>
                              <FolderOpen className="h-3 w-3" />
                              <span>{task.project_title}</span>
                            </>
                          )}
                          {task.estimated_time_minutes && (
                            <>
                              <Clock className="h-3 w-3 ml-2" />
                              <span>{task.estimated_time_minutes}min</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Todas as Tarefas do Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Todas as Tarefas
              </CardTitle>
              <CardDescription>
                Todas suas tarefas para hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa para hoje</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-transparent hover:border-primary"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(task.status)} variant="secondary">
                            {getStatusLabel(task.status)}
                          </Badge>
                          {task.is_focused && (
                            <Badge variant="outline" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              Foco
                            </Badge>
                          )}
                        </div>
                        {task.project_title && (
                          <p className="text-xs text-muted-foreground mt-1">{task.project_title}</p>
                        )}
                      </div>
                      <div className={`flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                        <Flag className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline de Reuniões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reuniões do Dia
            </CardTitle>
            <CardDescription>
              Sua agenda de reuniões para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DayTimeline meetings={todayMeetings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
