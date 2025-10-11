import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Building2, Users, FolderOpen, Calendar, TrendingUp, Activity, Clock, CheckCircle, AlertTriangle, ListTodo, Target, PieChart as PieChartIcon } from "lucide-react";
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
  const { metrics, projectStats, recentActivity, myTasks, upcomingMeetings } = useDashboardData();

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

        {/* Main Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/clients">
            <Card className="bg-gradient-to-br from-primary/5 via-primary/2 to-transparent border-primary/20 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">
                  Total de Clientes
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {metrics.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-primary">{metrics.totalClients}</div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Clientes cadastrados
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/projects">
            <Card className="bg-gradient-to-br from-accent/5 via-accent/2 to-transparent border-accent/20 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-accent">
                  Projetos Ativos
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                {metrics.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-accent">{metrics.activeProjects}</div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3" />
                  Em andamento
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/meetings">
            <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Reuniões Hoje
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                {metrics.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metrics.meetingsToday}</div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Agendadas hoje
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-success-foreground">
                Taxa de Conclusão
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-success-foreground">{metrics.completionRate}%</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                Tarefas concluídas
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br border-2 hover:shadow-md transition-shadow ${
            metrics.overdueTasks > 0
              ? 'from-destructive/10 via-destructive/5 to-transparent border-destructive/30'
              : 'from-muted/5 via-muted/2 to-transparent border-muted/20'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Tarefas Atrasadas
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${metrics.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-bold ${metrics.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
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
              ? 'from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/30'
              : 'from-muted/5 via-muted/2 to-transparent border-muted/20'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${metrics.projectsNearDeadline > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                Projetos Urgentes
              </CardTitle>
              <Target className={`h-4 w-4 ${metrics.projectsNearDeadline > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-3xl font-bold ${metrics.projectsNearDeadline > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                  {metrics.projectsNearDeadline}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                Próximos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Minhas Tarefas
              </CardTitle>
              <ListTodo className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{metrics.myPendingTasks}</div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ListTodo className="h-3 w-3" />
                Atribuídas a mim
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
