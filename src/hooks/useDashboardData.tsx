import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DashboardMetrics {
  totalClients: number;
  activeProjects: number;
  meetingsToday: number;
  completionRate: number;
  overdueTasks: number;
  projectsNearDeadline: number;
  myPendingTasks: number;
  blockedTasks: number;
  activeRisks: number;
  clientExecutionTasks: number;
  loading: boolean;
}

interface ProjectStats {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'task' | 'meeting' | 'comment';
  title: string;
  description: string;
  created_at: string;
  author?: string;
  link?: string;
}

interface MyTask {
  id: string;
  title: string;
  project_title: string;
  due_date: string | null;
  priority: string;
  status: string;
}

interface UpcomingMeeting {
  id: string;
  title: string;
  meeting_date: string;
  project_title: string;
}

interface TasksByStage {
  stage_id: string | null;
  stage_name: string;
  task_count: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
}

export function useDashboardData() {
  const { user, profile } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    activeProjects: 0,
    meetingsToday: 0,
    completionRate: 0,
    overdueTasks: 0,
    projectsNearDeadline: 0,
    myPendingTasks: 0,
    blockedTasks: 0,
    activeRisks: 0,
    clientExecutionTasks: 0,
    loading: true,
  });

  const [projectStats, setProjectStats] = useState<ProjectStats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [tasksByStage, setTasksByStage] = useState<TasksByStage[]>([]);

  useEffect(() => {
    if (user && profile) {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true }));

      // Buscar total de clientes
      const { count: clientsCount } = await supabase
        .from('gp_clients')
        .select('*', { count: 'exact', head: true });

      // Buscar projetos ativos
      const { count: activeProjectsCount } = await supabase
        .from('gp_projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['onboarding', 'strategy', 'development', 'validation', 'delivery']);

      // Buscar reuniões de hoje
      const today = new Date().toISOString().split('T')[0];
      const { count: meetingsTodayCount } = await supabase
        .from('gp_meetings')
        .select('*', { count: 'exact', head: true })
        .gte('meeting_date', `${today}T00:00:00`)
        .lt('meeting_date', `${today}T23:59:59`)
        .eq('status', 'scheduled');

      // Buscar estatísticas de projetos para taxa de conclusão
      const { data: projectStatsData } = await supabase
        .from('v_project_task_stats')
        .select('total, completed, in_progress, pending, review');

      // Calcular taxa de conclusão geral
      let totalTasks = 0;
      let completedTasks = 0;

      if (projectStatsData) {
        projectStatsData.forEach(project => {
          totalTasks += (project.total || 0);
          completedTasks += (project.completed || 0);
        });
      }

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Buscar projetos por status
      const { data: projectsByStatus } = await supabase
        .from('gp_projects')
        .select('status');

      const statusCounts = projectsByStatus?.reduce((acc, project) => {
        if (project.status === 'completed') acc.completed++;
        else if (project.status === 'paused') acc.pending++;
        else acc.in_progress++;
        return acc;
      }, { completed: 0, in_progress: 0, pending: 0 }) || { completed: 0, in_progress: 0, pending: 0 };

      // Buscar tarefas atrasadas
      const now = new Date().toISOString();
      const { count: overdueTasksCount } = await supabase
        .from('gp_tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', now)
        .neq('status', 'completed');

      // Buscar projetos próximos ao deadline (7 dias)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const { count: projectsNearDeadlineCount } = await supabase
        .from('gp_projects')
        .select('*', { count: 'exact', head: true })
        .lt('end_date', sevenDaysFromNow.toISOString())
        .gt('end_date', now)
        .neq('status', 'completed');

      // Buscar tarefas bloqueadas
      const { count: blockedTasksCount } = await supabase
        .from('gp_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('blocked', true)
        .neq('status', 'completed');

      // Buscar riscos ativos
      const { count: activeRisksCount } = await supabase
        .from('gp_project_risks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'monitoring']);

      // Buscar tarefas de execução do cliente
      const { count: clientExecutionTasksCount } = await supabase
        .from('gp_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('client_execution', true)
        .neq('status', 'completed');

      // Buscar minhas tarefas pendentes
      console.log('🔍 [Dashboard] Buscando tarefas para user:', profile?.id);
      const { count: myPendingTasksCount, error: myTasksCountError } = await supabase
        .from('gp_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', profile?.id)
        .neq('status', 'completed');

      if (myTasksCountError) {
        console.error('❌ [Dashboard] Erro ao contar minhas tarefas:', myTasksCountError);
      } else {
        console.log('✅ [Dashboard] Minhas tarefas pendentes:', myPendingTasksCount);
      }

      // Buscar minhas tarefas (top 5 mais urgentes)
      const { data: myTasksData, error: myTasksError } = await supabase
        .from('gp_tasks')
        .select(`
          id,
          title,
          due_date,
          priority,
          status,
          project:gp_projects(title)
        `)
        .eq('assigned_to', profile?.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);

      if (myTasksError) {
        console.error('❌ [Dashboard] Erro ao buscar minhas tarefas:', myTasksError);
      } else {
        console.log('✅ [Dashboard] Minhas tarefas carregadas:', myTasksData?.length || 0);
      }

      const formattedMyTasks: MyTask[] = (myTasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        project_title: task.project?.title || 'Sem projeto',
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
      }));

      // Buscar próximas reuniões (próximos 7 dias)
      const { data: upcomingMeetingsData } = await supabase
        .from('gp_meetings')
        .select(`
          id,
          title,
          meeting_date,
          project:gp_projects(title)
        `)
        .gte('meeting_date', now)
        .lt('meeting_date', sevenDaysFromNow.toISOString())
        .eq('status', 'scheduled')
        .order('meeting_date', { ascending: true })
        .limit(5);

      const formattedUpcomingMeetings: UpcomingMeeting[] = (upcomingMeetingsData || []).map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title,
        meeting_date: meeting.meeting_date,
        project_title: meeting.project?.title || 'Sem projeto',
      }));

      // Buscar atividade recente (projetos, tarefas, reuniões)
      const { data: recentProjects } = await supabase
        .from('gp_projects')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentTasks } = await supabase
        .from('gp_tasks')
        .select(`
          id,
          title,
          created_at,
          project:gp_projects(id, title)
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(3);

      const { data: recentMeetings } = await supabase
        .from('gp_meetings')
        .select(`
          id,
          title,
          created_at,
          project:gp_projects(id, title)
        `)
        .order('created_at', { ascending: false })
        .limit(2);

      const activity: RecentActivity[] = [
        ...(recentProjects || []).map((project: any) => ({
          id: project.id,
          type: 'project' as const,
          title: project.title,
          description: 'Novo projeto criado',
          created_at: project.created_at,
          link: `/projects/${project.id}`,
        })),
        ...(recentTasks || []).map((task: any) => ({
          id: task.id,
          type: 'task' as const,
          title: task.title,
          description: `Tarefa concluída em ${task.project?.title || 'projeto'}`,
          created_at: task.created_at,
          link: task.project?.id ? `/projects/${task.project.id}` : undefined,
        })),
        ...(recentMeetings || []).map((meeting: any) => ({
          id: meeting.id,
          type: 'meeting' as const,
          title: meeting.title,
          description: `Reunião agendada para ${meeting.project?.title || 'projeto'}`,
          created_at: meeting.created_at,
          link: '/meetings',
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      setMetrics({
        totalClients: clientsCount || 0,
        activeProjects: activeProjectsCount || 0,
        meetingsToday: meetingsTodayCount || 0,
        completionRate,
        overdueTasks: overdueTasksCount || 0,
        projectsNearDeadline: projectsNearDeadlineCount || 0,
        myPendingTasks: myPendingTasksCount || 0,
        blockedTasks: blockedTasksCount || 0,
        activeRisks: activeRisksCount || 0,
        clientExecutionTasks: clientExecutionTasksCount || 0,
        loading: false,
      });

      setProjectStats({
        total: (activeProjectsCount || 0) + statusCounts.completed,
        completed: statusCounts.completed,
        in_progress: statusCounts.in_progress,
        pending: statusCounts.pending,
      });

      setRecentActivity(activity);
      setMyTasks(formattedMyTasks);
      setUpcomingMeetings(formattedUpcomingMeetings);

      // Buscar tarefas por etapa
      const { data: tasksData } = await supabase
        .from('gp_tasks')
        .select(`
          id,
          status,
          stage_id,
          stage:gp_project_stages(id, name)
        `);

      // Agrupar tarefas por etapa
      const stageGroups: { [key: string]: TasksByStage } = {};

      tasksData?.forEach((task: any) => {
        const stageId = task.stage_id || 'no_stage';
        const stageName = task.stage?.name || 'Sem Etapa';

        if (!stageGroups[stageId]) {
          stageGroups[stageId] = {
            stage_id: task.stage_id,
            stage_name: stageName,
            task_count: 0,
            pending: 0,
            in_progress: 0,
            review: 0,
            completed: 0,
          };
        }

        stageGroups[stageId].task_count++;

        if (task.status === 'pending') stageGroups[stageId].pending++;
        else if (task.status === 'in_progress') stageGroups[stageId].in_progress++;
        else if (task.status === 'review') stageGroups[stageId].review++;
        else if (task.status === 'completed') stageGroups[stageId].completed++;
      });

      const tasksByStageArray = Object.values(stageGroups).sort((a, b) => b.task_count - a.task_count);
      setTasksByStage(tasksByStageArray);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    metrics,
    projectStats,
    recentActivity,
    myTasks,
    upcomingMeetings,
    tasksByStage,
    refresh: loadDashboardData,
  };
}