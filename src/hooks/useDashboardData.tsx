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

export function useDashboardData() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    activeProjects: 0,
    meetingsToday: 0,
    completionRate: 0,
    overdueTasks: 0,
    projectsNearDeadline: 0,
    myPendingTasks: 0,
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

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

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

      // Buscar minhas tarefas pendentes
      const { count: myPendingTasksCount } = await supabase
        .from('gp_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .neq('status', 'completed');

      // Buscar minhas tarefas (top 5 mais urgentes)
      const { data: myTasksData } = await supabase
        .from('gp_tasks')
        .select(`
          id,
          title,
          due_date,
          priority,
          status,
          project:gp_projects(title)
        `)
        .eq('assigned_to', user?.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);

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
    refresh: loadDashboardData,
  };
}