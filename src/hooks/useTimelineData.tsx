import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  start_date: string | null;
  due_date: string | null;
  progress: number;
  project_id: string;
  project_title?: string;
  project_color?: string;
  assigned_to: string | null;
  assigned_user_name?: string;
  stage_name?: string;
  estimated_hours?: number;
  dependencies?: string[];
}

export interface TimelineFilters {
  projectIds: string[];
  userIds: string[];
  startDate: Date;
  endDate: Date;
  showCompleted: boolean;
}

export interface TimelineProject {
  id: string;
  title: string;
  color?: string;
  taskCount: number;
}

export function useTimelineData() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [filters, setFilters] = useState<TimelineFilters>({
    projectIds: [],
    userIds: [],
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 dias atrás
    endDate: new Date(new Date().setDate(new Date().getDate() + 60)), // 60 dias à frente
    showCompleted: true,
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchTimelineData();
    }
  }, [profile?.company_id, filters]);

  const fetchTimelineData = async () => {
    if (!profile?.company_id) return;

    try {
      setLoading(true);

      // Buscar projetos
      const { data: projectsData, error: projectsError } = await supabase
        .from('gp_projects')
        .select('id, title')
        .eq('company_id', profile.company_id)
        .order('title');

      if (projectsError) throw projectsError;

      // Buscar tarefas com dependências e informações relacionadas
      let query = supabase
        .from('gp_tasks')
        .select(`
          *,
          project:gp_projects(id, title),
          assigned_user:profiles!gp_tasks_assigned_to_fkey(id, nome),
          stage:gp_project_stages(name)
        `)
        .eq('company_id', profile.company_id)
        .not('due_date', 'is', null);

      // Aplicar filtros
      if (filters.projectIds.length > 0) {
        query = query.in('project_id', filters.projectIds);
      }

      if (filters.userIds.length > 0) {
        query = query.in('assigned_to', filters.userIds);
      }

      if (!filters.showCompleted) {
        query = query.neq('status', 'completed');
      }

      // Filtrar por período
      query = query
        .gte('due_date', filters.startDate.toISOString().split('T')[0])
        .lte('due_date', filters.endDate.toISOString().split('T')[0]);

      const { data: tasksData, error: tasksError } = await query.order('due_date');

      if (tasksError) throw tasksError;

      // Buscar dependências das tarefas
      const taskIds = (tasksData || []).map(t => t.id);
      let dependencies: any[] = [];

      if (taskIds.length > 0) {
        const { data: depsData, error: depsError } = await supabase
          .from('gp_task_dependencies')
          .select('task_id, depends_on_task_id')
          .in('task_id', taskIds);

        if (!depsError && depsData) {
          dependencies = depsData;
        }
      }

      // Processar tarefas
      const processedTasks: TimelineTask[] = (tasksData || []).map(task => {
        const taskDeps = dependencies
          .filter(d => d.task_id === task.id)
          .map(d => d.depends_on_task_id);

        return {
          ...task,
          project_title: task.project?.title,
          assigned_user_name: task.assigned_user?.nome,
          stage_name: task.stage?.name,
          dependencies: taskDeps,
        };
      });

      // Calcular contagem de tarefas por projeto
      const projectsWithCount: TimelineProject[] = (projectsData || []).map(project => ({
        id: project.id,
        title: project.title,
        taskCount: processedTasks.filter(t => t.project_id === project.id).length,
      }));

      setTasks(processedTasks);
      setProjects(projectsWithCount);
    } catch (error) {
      console.error('Erro ao carregar dados da timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<TimelineFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getTasksByProject = () => {
    const grouped = new Map<string, TimelineTask[]>();

    tasks.forEach(task => {
      const projectId = task.project_id;
      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }
      grouped.get(projectId)?.push(task);
    });

    return Array.from(grouped.entries()).map(([projectId, projectTasks]) => ({
      projectId,
      projectTitle: projectTasks[0]?.project_title || 'Sem Projeto',
      tasks: projectTasks,
    }));
  };

  const getTasksByUser = () => {
    const grouped = new Map<string, TimelineTask[]>();

    tasks.forEach(task => {
      const userId = task.assigned_to || 'unassigned';
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId)?.push(task);
    });

    return Array.from(grouped.entries()).map(([userId, userTasks]) => ({
      userId,
      userName: userTasks[0]?.assigned_user_name || 'Não Atribuído',
      tasks: userTasks,
    }));
  };

  const getTimelineStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    const now = new Date();
    const overdue = tasks.filter(t => {
      if (t.status === 'completed') return false;
      const dueDate = t.due_date ? new Date(t.due_date) : null;
      return dueDate && dueDate < now;
    }).length;

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  return {
    loading,
    tasks,
    projects,
    filters,
    updateFilters,
    getTasksByProject,
    getTasksByUser,
    getTimelineStats,
    refresh: fetchTimelineData,
  };
}
