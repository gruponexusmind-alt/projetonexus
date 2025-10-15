import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimelineData } from '@/hooks/useTimelineData';
import { GanttChart } from '@/components/GanttChart';
import { TimelineCards } from '@/components/TimelineCards';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Filter,
  Users,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  List,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Timeline() {
  const { profile } = useAuth();
  const {
    loading,
    tasks,
    projects,
    filters,
    updateFilters,
    getTimelineStats,
    refresh,
  } = useTimelineData();

  const [groupBy, setGroupBy] = useState<'project' | 'user' | 'none'>('project');
  const [users, setUsers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'cards' | 'gantt'>('cards');

  const stats = getTimelineStats();

  useEffect(() => {
    if (profile?.company_id) {
      fetchUsers();
    }
  }, [profile?.company_id]);

  const fetchUsers = async () => {
    if (!profile?.company_id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('company_id', profile.company_id)
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleProjectFilter = (projectId: string) => {
    const currentProjects = filters.projectIds;
    const newProjects = currentProjects.includes(projectId)
      ? currentProjects.filter(id => id !== projectId)
      : [...currentProjects, projectId];

    updateFilters({ projectIds: newProjects });
  };

  const handleUserFilter = (userId: string) => {
    const currentUsers = filters.userIds;
    const newUsers = currentUsers.includes(userId)
      ? currentUsers.filter(id => id !== userId)
      : [...currentUsers, userId];

    updateFilters({ userIds: newUsers });
  };

  const setPeriod = (period: 'month' | 'quarter' | 'custom' | 'today') => {
    const now = new Date();

    switch (period) {
      case 'today':
        setCurrentDate(new Date());
        updateFilters({
          startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        });
        break;
      case 'month':
        updateFilters({
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        });
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        updateFilters({
          startDate: quarterStart,
          endDate: quarterEnd,
        });
        break;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
    updateFilters({
      startDate: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()),
      endDate: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()),
    });
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Timeline" description="Carregando..." />
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
        title="Timeline"
        description="Visualização de linha do tempo das tarefas e projetos"
      >
        <div className="flex gap-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Navegação de Data */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 flex-1 justify-center">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">
                  {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setPeriod('today')}
              >
                Hoje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-violet-50 via-violet-50/50 to-transparent border-violet-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-700">Total</CardTitle>
              <Calendar className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-violet-700">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tarefas no período</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 via-green-50/50 to-transparent border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-green-700">
                {stats.completed}
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
                {stats.inProgress}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Trabalhando</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 via-gray-50/50 to-transparent border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight text-gray-700">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br border-2 ${
            stats.overdue > 0
              ? 'from-red-50 via-red-50/50 to-transparent border-red-200'
              : 'from-slate-50 via-slate-50/50 to-transparent border-slate-200'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stats.overdue > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                Atrasadas
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.overdue > 0 ? 'text-red-600' : 'text-slate-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-extrabold tracking-tight ${stats.overdue > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                {stats.overdue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdue > 0 ? 'Requer atenção' : 'Tudo em dia'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avançados */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Período */}
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPeriod('month')}>
                    Este Mês
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPeriod('quarter')}>
                    Este Trimestre
                  </Button>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                  <span>até</span>
                  <span>{format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              </div>

              {/* Projetos */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Projetos
                </label>
                <div className="flex flex-wrap gap-2">
                  {projects.map(project => (
                    <Badge
                      key={project.id}
                      variant={filters.projectIds.includes(project.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleProjectFilter(project.id)}
                    >
                      {project.title} ({project.taskCount})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Responsáveis */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Responsáveis
                </label>
                <div className="flex flex-wrap gap-2">
                  {users.map(user => (
                    <Badge
                      key={user.id}
                      variant={filters.userIds.includes(user.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleUserFilter(user.id)}
                    >
                      {user.nome}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Mostrar concluídas */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showCompleted"
                  checked={filters.showCompleted}
                  onChange={(e) => updateFilters({ showCompleted: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="showCompleted" className="text-sm cursor-pointer">
                  Mostrar tarefas concluídas
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visualização */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visualização Timeline
                </CardTitle>
                <CardDescription>
                  {tasks.length} tarefas agendadas no período selecionado
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle View Mode */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="gap-2"
                  >
                    <List className="h-4 w-4" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('gantt')}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Gantt
                  </Button>
                </div>

                {/* Group By */}
                <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Por Projeto</SelectItem>
                    <SelectItem value="user">Por Responsável</SelectItem>
                    <SelectItem value="none">Sem Agrupamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'cards' ? (
              <TimelineCards
                tasks={tasks}
                groupBy={groupBy}
                onTaskClick={handleTaskClick}
              />
            ) : (
              <div className="overflow-x-auto">
                <GanttChart
                  tasks={tasks}
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  groupBy={groupBy}
                  onTaskClick={handleTaskClick}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  );
}
