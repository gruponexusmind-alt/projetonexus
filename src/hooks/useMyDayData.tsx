import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MyDayTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  progress: number;
  project_id: string;
  project_title?: string;
  is_focused?: boolean;
  focus_priority?: number;
  estimated_time_minutes?: number;
}

export interface MyDayMeeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  duration_minutes: number;
  project_id: string;
  project_title?: string;
}

export interface MyDayStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  estimatedTimeTotal: number;
}

export function useMyDayData() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<MyDayTask[]>([]);
  const [focusedTasks, setFocusedTasks] = useState<MyDayTask[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<MyDayMeeting[]>([]);
  const [stats, setStats] = useState<MyDayStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    estimatedTimeTotal: 0,
  });

  useEffect(() => {
    if (profile?.company_id && profile?.id) {
      fetchMyDayData();
    }
  }, [profile?.company_id, profile?.id]);

  const fetchMyDayData = async () => {
    if (!profile?.company_id || !profile?.id) return;

    try {
      setLoading(true);

      // Buscar tarefas focadas do dia (da tabela gp_daily_task_focus)
      const today = new Date().toISOString().split('T')[0];
      const { data: focusData, error: focusError } = await supabase
        .from('gp_daily_task_focus')
        .select(`
          *,
          task:gp_tasks(
            id,
            title,
            description,
            status,
            priority,
            due_date,
            progress,
            project_id,
            project:gp_projects(title)
          )
        `)
        .eq('user_id', profile.id)
        .eq('focus_date', today)
        .order('priority_order');

      if (focusError) throw focusError;

      // Buscar tarefas com vencimento hoje
      const { data: todayData, error: todayError } = await supabase
        .from('gp_tasks')
        .select(`
          *,
          project:gp_projects(id, title)
        `)
        .eq('company_id', profile.company_id)
        .eq('assigned_to', profile.id)
        .eq('due_date', today)
        .order('priority', { ascending: false });

      if (todayError) throw todayError;

      // Buscar tarefas em progresso
      const { data: inProgressData, error: inProgressError } = await supabase
        .from('gp_tasks')
        .select(`
          *,
          project:gp_projects(id, title)
        `)
        .eq('company_id', profile.company_id)
        .eq('assigned_to', profile.id)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false });

      if (inProgressError) throw inProgressError;

      // Buscar reuniões do dia
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: meetingsData, error: meetingsError } = await supabase
        .from('gp_meetings')
        .select(`
          *,
          project:gp_projects(id, title)
        `)
        .eq('company_id', profile.company_id)
        .gte('meeting_date', todayStart.toISOString())
        .lte('meeting_date', todayEnd.toISOString())
        .order('meeting_date');

      if (meetingsError) throw meetingsError;

      // Processar tarefas focadas
      const focused: MyDayTask[] = (focusData || [])
        .filter(item => item.task)
        .map(item => ({
          ...item.task,
          project_title: item.task.project?.title,
          is_focused: true,
          focus_priority: item.priority_order,
          estimated_time_minutes: item.estimated_time_minutes,
        }));

      // Combinar e deduplificar tarefas
      const allTasksMap = new Map<string, MyDayTask>();

      // Adicionar tarefas focadas primeiro
      focused.forEach(task => allTasksMap.set(task.id, task));

      // Adicionar tarefas do dia
      (todayData || []).forEach(task => {
        if (!allTasksMap.has(task.id)) {
          allTasksMap.set(task.id, {
            ...task,
            project_title: task.project?.title,
          });
        }
      });

      // Adicionar tarefas em progresso
      (inProgressData || []).forEach(task => {
        if (!allTasksMap.has(task.id)) {
          allTasksMap.set(task.id, {
            ...task,
            project_title: task.project?.title,
          });
        }
      });

      const allTasks = Array.from(allTasksMap.values());

      // Calcular estatísticas
      const completed = allTasks.filter(t => t.status === 'completed').length;
      const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
      const pending = allTasks.filter(t => t.status === 'pending').length;
      const total = allTasks.length;
      const estimatedTotal = focused.reduce((sum, task) => sum + (task.estimated_time_minutes || 0), 0);

      setFocusedTasks(focused);
      setTodayTasks(allTasks);
      setTodayMeetings((meetingsData || []).map(meeting => ({
        ...meeting,
        project_title: meeting.project?.title,
      })));
      setStats({
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        estimatedTimeTotal: estimatedTotal,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dia:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTaskToMyDay = async (taskId: string, estimatedTimeMinutes?: number) => {
    if (!profile?.id || !profile?.company_id) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('gp_daily_task_focus')
        .insert({
          user_id: profile.id,
          task_id: taskId,
          company_id: profile.company_id,
          focus_date: today,
          estimated_time_minutes: estimatedTimeMinutes,
          priority_order: focusedTasks.length,
        });

      if (error) throw error;

      await fetchMyDayData();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar tarefa ao meu dia:', error);
      return false;
    }
  };

  const removeTaskFromMyDay = async (taskId: string) => {
    if (!profile?.id) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('gp_daily_task_focus')
        .delete()
        .eq('user_id', profile.id)
        .eq('task_id', taskId)
        .eq('focus_date', today);

      if (error) throw error;

      await fetchMyDayData();
      return true;
    } catch (error) {
      console.error('Erro ao remover tarefa do meu dia:', error);
      return false;
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: number) => {
    if (!profile?.id) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('gp_daily_task_focus')
        .update({ priority_order: newPriority })
        .eq('user_id', profile.id)
        .eq('task_id', taskId)
        .eq('focus_date', today);

      if (error) throw error;

      await fetchMyDayData();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      return false;
    }
  };

  return {
    loading,
    todayTasks,
    focusedTasks,
    todayMeetings,
    stats,
    addTaskToMyDay,
    removeTaskFromMyDay,
    updateTaskPriority,
    refresh: fetchMyDayData,
  };
}
