import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Building2, Users, FolderOpen, Calendar, TrendingUp, Activity, Clock, CheckCircle, AlertTriangle, ListTodo, Target, PieChart as PieChartIcon, ShieldAlert, LockIcon, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { metrics, projectStats, recentActivity, myTasks, upcomingMeetings, tasksByStage } = useDashboardData();

  // Funções de navegação com filtros
  const navigateToTasksWithFilters = (filters: any) => {
    navigate('/tasks', { state: { filters } });
  };

  // Redirecionar clientes para o dashboard do cliente
  useEffect(() => {
    if (profile && profile.role === 'cliente') {
      navigate('/client/dashboard');
    }
  }, [profile, navigate]);

  // Dados para o gráfico de pizza
  const projectDistributionData = [
    { name: 'Concluídos', value: projectStats.completed, color: 'hsl(var(--success))' },
    { name: 'Em Andamento', value: projectStats.in_progress, color: 'hsl(var(--primary))' },
    { name: 'Pausados', value: projectStats.pending, color: 'hsl(var(--muted-foreground))' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Bem-vindo de volta, ${profile?.nome}!`}
      />
      <div className="p-6 space-y-8">

        {/* Main Metrics Cards - Linha 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/clients">
            <Card className="bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-transparent border-indigo-200 dark:from-indigo-950/30 dark:via-indigo-950/10 dark:border-indigo-900 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                  Total de Clientes
                </CardTitle>
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-500" />
              </CardHeader>
              <CardContent>
                {metrics.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-400">{metrics.totalClients}</div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Clientes cadastrados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/projects">
            <Card className="bg-gradient-to-br from-fuchsia-50 via-fuchsia-50/50 to-transparent border-fuchsia-200 dark:from-fuchsia-950/30 dark:via-fuchsia-950/10 dark:border-fuchsia-900 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-fuchsia-700 dark:text-fuchsia-400">
                  Projetos Ativos
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-500" />
              </CardHeader>
              <CardContent>
                {metrics.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-extrabold tracking-tight text-fuchsia-700 dark:text-fuchsia-400">{metrics.activeProjects}</div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3" />
                  Em andamento
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/meetings">
            <Card className="bg-gradient-to-br from-sky-50 via-sky-50/50 to-transparent border-sky-200 dark:from-sky-950/30 dark:via-sky-950/10 dark:border-sky-900 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-sky-700 dark:text-sky-400">
                  Reuniões Hoje
                </CardTitle>
                <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-500" />
              </CardHeader>
              <CardContent>
                {metrics.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-extrabold tracking-tight text-sky-700 dark:text-sky-400">{metrics.meetingsToday}</div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Agendadas hoje
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-transparent border-emerald-200 dark:from-emerald-950/30 dark:via-emerald-950/10 dark:border-emerald-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Taxa de Conclusão
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">{metrics.completionRate}%</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Tarefas concluídas
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br border-2 hover:shadow-md transition-shadow cursor-pointer ${
              metrics.overdueTasks > 0
                ? 'from-red-50 via-red-50/50 to-transparent border-red-200 dark:from-red-950/30 dark:via-red-950/10 dark:border-red-900'
                : 'from-slate-50 via-slate-50/50 to-transparent border-slate-200 dark:from-slate-950/30 dark:via-slate-950/10 dark:border-slate-900'
            }`}
            onClick={() => navigateToTasksWithFilters({ overdue: true, status: ['pending', 'in_progress', 'review'] })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.overdueTasks > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Tarefas Atrasadas
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${metrics.overdueTasks > 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-extrabold tracking-tight ${metrics.overdueTasks > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {metrics.overdueTasks}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {metrics.overdueTasks > 0 ? 'Requer atenção' : 'Tudo em dia'}
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br border-2 hover:shadow-md transition-shadow ${
            metrics.projectsNearDeadline > 0
              ? 'from-amber-50 via-amber-50/50 to-transparent border-amber-200 dark:from-amber-950/30 dark:via-amber-950/10 dark:border-amber-900'
              : 'from-slate-50 via-slate-50/50 to-transparent border-slate-200 dark:from-slate-950/30 dark:via-slate-950/10 dark:border-slate-900'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.projectsNearDeadline > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Projetos Urgentes
              </CardTitle>
              <Target className={`h-4 w-4 ${metrics.projectsNearDeadline > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500 dark:text-slate-400'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-extrabold tracking-tight ${metrics.projectsNearDeadline > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {metrics.projectsNearDeadline}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                Próximos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-violet-50 via-violet-50/50 to-transparent border-violet-200 dark:from-violet-950/30 dark:via-violet-950/10 dark:border-violet-900 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigateToTasksWithFilters({ assignedTo: profile?.id, status: ['pending', 'in_progress', 'review'] })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-400">
                Minhas Tarefas
              </CardTitle>
              <ListTodo className="h-4 w-4 text-violet-600 dark:text-violet-500" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-extrabold tracking-tight text-violet-700 dark:text-violet-400">{metrics.myPendingTasks}</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ListTodo className="h-3 w-3" />
                Atribuídas a mim
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Metrics Cards - Linha 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Tarefas Bloqueadas */}
          <Card
            className={`bg-gradient-to-br border-2 hover:shadow-md transition-shadow cursor-pointer ${
              metrics.blockedTasks > 0
                ? 'from-orange-50 via-orange-50/50 to-transparent border-orange-200 dark:from-orange-950/30 dark:via-orange-950/10 dark:border-orange-900'
                : 'from-slate-50 via-slate-50/50 to-transparent border-slate-200 dark:from-slate-950/30 dark:via-slate-950/10 dark:border-slate-900'
            }`}
            onClick={() => navigateToTasksWithFilters({ blocked: true, status: ['pending', 'in_progress', 'review'] })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.blockedTasks > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Tarefas Bloqueadas
              </CardTitle>
              <LockIcon className={`h-4 w-4 ${metrics.blockedTasks > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-slate-500 dark:text-slate-400'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-extrabold tracking-tight ${metrics.blockedTasks > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {metrics.blockedTasks}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <LockIcon className="h-3 w-3" />
                {metrics.blockedTasks > 0 ? 'Requer desbloqueio' : 'Nada bloqueado'}
              </p>
            </CardContent>
          </Card>

          {/* Card Riscos Ativos */}
          <Card
            className={`bg-gradient-to-br border-2 hover:shadow-md transition-shadow ${
              metrics.activeRisks > 0
                ? 'from-yellow-50 via-yellow-50/50 to-transparent border-yellow-200 dark:from-yellow-950/30 dark:via-yellow-950/10 dark:border-yellow-900'
                : 'from-slate-50 via-slate-50/50 to-transparent border-slate-200 dark:from-slate-950/30 dark:via-slate-950/10 dark:border-slate-900'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.activeRisks > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Riscos Ativos
              </CardTitle>
              <ShieldAlert className={`h-4 w-4 ${metrics.activeRisks > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-slate-500 dark:text-slate-400'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-extrabold tracking-tight ${metrics.activeRisks > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {metrics.activeRisks}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ShieldAlert className="h-3 w-3" />
                {metrics.activeRisks > 0 ? 'Em monitoramento' : 'Nenhum risco'}
              </p>
            </CardContent>
          </Card>

          {/* Card Tarefas do Cliente */}
          <Card
            className={`bg-gradient-to-br border-2 hover:shadow-md transition-shadow cursor-pointer ${
              metrics.clientExecutionTasks > 0
                ? 'from-cyan-50 via-cyan-50/50 to-transparent border-cyan-200 dark:from-cyan-950/30 dark:via-cyan-950/10 dark:border-cyan-900'
                : 'from-slate-50 via-slate-50/50 to-transparent border-slate-200 dark:from-slate-950/30 dark:via-slate-950/10 dark:border-slate-900'
            }`}
            onClick={() => navigateToTasksWithFilters({ clientExecution: true, status: ['pending', 'in_progress', 'review'] })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.clientExecutionTasks > 0 ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Tarefas do Cliente
              </CardTitle>
              <UserCheck className={`h-4 w-4 ${metrics.clientExecutionTasks > 0 ? 'text-cyan-600 dark:text-cyan-500' : 'text-slate-500 dark:text-slate-400'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-extrabold tracking-tight ${metrics.clientExecutionTasks > 0 ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {metrics.clientExecutionTasks}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <UserCheck className="h-3 w-3" />
                {metrics.clientExecutionTasks > 0 ? 'Aguardando cliente' : 'Nenhuma pendente'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project Overview with Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Visão Geral dos Projetos
              </CardTitle>
              <CardDescription>
                Status atual dos projetos no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total de Projetos</span>
                <Badge variant="outline">{projectStats.total}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Concluídos
                  </span>
                  <span className="font-medium">{projectStats.completed}</span>
                </div>
                <Progress
                  value={projectStats.total > 0 ? (projectStats.completed / projectStats.total) * 100 : 0}
                  className="h-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Em Andamento
                  </span>
                  <span className="font-medium">{projectStats.in_progress}</span>
                </div>
                <Progress
                  value={projectStats.total > 0 ? (projectStats.in_progress / projectStats.total) * 100 : 0}
                  className="h-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    Pausados
                  </span>
                  <span className="font-medium">{projectStats.pending}</span>
                </div>
                <Progress
                  value={projectStats.total > 0 ? (projectStats.pending / projectStats.total) * 100 : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuição de Projetos
              </CardTitle>
              <CardDescription>
                Visualização proporcional por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectStats.total === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <PieChartIcon className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum projeto cadastrado
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma atividade recente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.slice(0, 6).map((activity) => {
                    const icon = activity.type === 'project'
                      ? <FolderOpen className="h-4 w-4" />
                      : activity.type === 'task'
                      ? <CheckCircle className="h-4 w-4" />
                      : <Calendar className="h-4 w-4" />;

                    const bgColor = activity.type === 'project'
                      ? 'bg-primary/10 text-primary'
                      : activity.type === 'task'
                      ? 'bg-success/10 text-success'
                      : 'bg-blue-500/10 text-blue-600';

                    const content = (
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-md ${bgColor} flex-shrink-0`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );

                    return activity.link ? (
                      <Link key={activity.id} to={activity.link}>
                        {content}
                      </Link>
                    ) : (
                      <div key={activity.id}>
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Tarefas por Etapa do Projeto
              </CardTitle>
              <CardDescription>
                Distribuição de tarefas por etapas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasksByStage.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Target className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa atribuída a etapas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasksByStage.slice(0, 6).map((stage) => (
                    <div key={stage.stage_id || 'no_stage'} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{stage.stage_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {stage.task_count} {stage.task_count === 1 ? 'tarefa' : 'tarefas'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {stage.pending > 0 && (
                          <div
                            className="h-2 bg-slate-400 rounded-full transition-all"
                            style={{ width: `${(stage.pending / stage.task_count) * 100}%` }}
                            title={`${stage.pending} pendente(s)`}
                          />
                        )}
                        {stage.in_progress > 0 && (
                          <div
                            className="h-2 bg-primary rounded-full transition-all"
                            style={{ width: `${(stage.in_progress / stage.task_count) * 100}%` }}
                            title={`${stage.in_progress} em progresso`}
                          />
                        )}
                        {stage.review > 0 && (
                          <div
                            className="h-2 bg-amber-500 rounded-full transition-all"
                            style={{ width: `${(stage.review / stage.task_count) * 100}%` }}
                            title={`${stage.review} em revisão`}
                          />
                        )}
                        {stage.completed > 0 && (
                          <div
                            className="h-2 bg-success rounded-full transition-all"
                            style={{ width: `${(stage.completed / stage.task_count) * 100}%` }}
                            title={`${stage.completed} concluída(s)`}
                          />
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {stage.pending > 0 && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full"></div>{stage.pending} pendente</span>}
                        {stage.in_progress > 0 && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full"></div>{stage.in_progress} em progresso</span>}
                        {stage.review > 0 && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div>{stage.review} revisão</span>}
                        {stage.completed > 0 && <span className="flex items-center gap-1"><div className="w-2 h-2 bg-success rounded-full"></div>{stage.completed} concluída</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meus Itens - Tarefas e Reuniões */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Minhas Tarefas
              </CardTitle>
              <CardDescription>
                Suas próximas tarefas mais urgentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa pendente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">Alta</Badge>
                          )}
                          {task.priority === 'medium' && (
                            <Badge variant="outline" className="text-xs text-orange-600">Média</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{task.project_title}</p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Reuniões
              </CardTitle>
              <CardDescription>
                Reuniões agendadas nos próximos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma reunião agendada
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <Link key={meeting.id} to="/meetings">
                      <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 flex-shrink-0">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{meeting.project_title}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(meeting.meeting_date), "EEEE, dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Index;
