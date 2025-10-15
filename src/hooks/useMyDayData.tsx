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
  scheduled_time?: string | null; // "09:00:00", "14:30:00"
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
      console.log('1️⃣ Buscando tarefas focadas...');
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

      if (focusError) {
        console.error('❌ Erro em tarefas focadas:', focusError);
        throw focusError;
      }
      console.log('✅ Tarefas focadas:', focusData?.length || 0);

      // Buscar tarefas com vencimento hoje
      console.log('2️⃣ Buscando tarefas com vencimento hoje...');
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

      if (todayError) {
        console.error('❌ Erro em tarefas de hoje:', todayError);
        throw todayError;
      }
      console.log('✅ Tarefas de hoje:', todayData?.length || 0);

      // Buscar tarefas em progresso
      console.log('3️⃣ Buscando tarefas em progresso...');
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

      if (inProgressError) {
        console.error('❌ Erro em tarefas em progresso:', inProgressError);
        throw inProgressError;
      }
      console.log('✅ Tarefas em progresso:', inProgressData?.length || 0);

      // Buscar todas as tarefas não concluídas do usuário (para ter uma visão completa)
      console.log('4️⃣ Buscando todas as tarefas não concluídas...');
      const { data: myTasksData, error: myTasksError } = await supabase
        .from('gp_tasks')
        .select(`
          *,
          project:gp_projects(id, title)
        `)
        .eq('company_id', profile.company_id)
        .eq('assigned_to', profile.id)
        .in('status', ['pending', 'in_progress', 'review'])
        .order('priority', { ascending: false })
        .limit(50);

      if (myTasksError) {
        console.error('❌ Erro em todas as tarefas:', myTasksError);
        throw myTasksError;
      }
      console.log('✅ Todas as minhas tarefas:', myTasksData?.length || 0);

      // Debug logs
      console.log('🔍 Debug Meu Dia:', {
        profile_id: profile.id,
        company_id: profile.company_id,
        focusData: focusData?.length || 0,
        todayData: todayData?.length || 0,
        inProgressData: inProgressData?.length || 0,
        myTasksData: myTasksData?.length || 0,
        today: today,
      });

      // Buscar reuniões do dia
      console.log('5️⃣ Buscando reuniões do dia...');
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

      if (meetingsError) {
        console.error('❌ Erro em reuniões:', meetingsError);
        throw meetingsError;
      }
      console.log('✅ Reuniões do dia:', meetingsData?.length || 0);

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

      // Adicionar todas as minhas tarefas não concluídas
      (myTasksData || []).forEach(task => {
        if (!allTasksMap.has(task.id)) {
          allTasksMap.set(task.id, {
            ...task,
            project_title: task.project?.title,
          });
        }
      });

      const allTasks = Array.from(allTasksMap.values());

      // Debug: mostrar tarefas finais
      console.log('📋 Total de tarefas processadas:', allTasks.length);
      console.log('📋 Tarefas:', allTasks);

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

  const scheduleTaskToTime = async (taskId: string, hour: number, minute: number = 0) => {
    if (!profile?.id || !profile?.company_id) return { success: false, error: 'Perfil não encontrado' };

    const today = new Date().toISOString().split('T')[0];
    const scheduledTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

    try {
      // Verificar se já existe registro para esta tarefa
      const { data: existing } = await supabase
        .from('gp_daily_task_focus')
        .select('id')
        .eq('user_id', profile.id)
        .eq('task_id', taskId)
        .eq('focus_date', today)
        .single();

      if (existing) {
        // Atualizar horário agendado
        const { error } = await supabase
          .from('gp_daily_task_focus')
          .update({ scheduled_time: scheduledTime })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo registro com horário agendado
        const { error } = await supabase
          .from('gp_daily_task_focus')
          .insert({
            user_id: profile.id,
            task_id: taskId,
            company_id: profile.company_id,
            focus_date: today,
            scheduled_time: scheduledTime,
            priority_order: focusedTasks.length,
          });

        if (error) throw error;
      }

      await fetchMyDayData();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao agendar tarefa:', error);
      return { success: false, error: error.message };
    }
  };

  const removeTaskFromSchedule = async (taskId: string) => {
    if (!profile?.id) return { success: false, error: 'Perfil não encontrado' };

    const today = new Date().toISOString().split('T')[0];

    try {
      // Apenas remove o horário agendado, mantém a tarefa no dia
      const { error } = await supabase
        .from('gp_daily_task_focus')
        .update({ scheduled_time: null })
        .eq('user_id', profile.id)
        .eq('task_id', taskId)
        .eq('focus_date', today);

      if (error) throw error;

      await fetchMyDayData();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover tarefa do horário:', error);
      return { success: false, error: error.message };
    }
  };

  const getScheduledTasks = () => {
    return todayTasks.filter(task => task.scheduled_time != null);
  };

  const getUnscheduledTasks = () => {
    return todayTasks.filter(task => task.scheduled_time == null);
  };

  const getTasksByHour = () => {
    const tasksByHour = new Map<number, MyDayTask[]>();

    todayTasks.forEach(task => {
      if (task.scheduled_time) {
        const hour = parseInt(task.scheduled_time.split(':')[0]);
        if (!tasksByHour.has(hour)) {
          tasksByHour.set(hour, []);
        }
        tasksByHour.get(hour)?.push(task);
      }
    });

    return tasksByHour;
  };

  const calculateDayCapacity = () => {
    // Total disponível: 12 horas (8h-20h) = 720 minutos
    const totalAvailable = 720;

    // Tempo de tarefas agendadas
    const tasksTime = todayTasks.reduce((sum, task) => {
      return sum + (task.estimated_time_minutes || 0);
    }, 0);

    // Tempo de reuniões
    const meetingsTime = todayMeetings.reduce((sum, meeting) => {
      return sum + meeting.duration_minutes;
    }, 0);

    const totalScheduled = tasksTime + meetingsTime;
    const occupancyRate = Math.round((totalScheduled / totalAvailable) * 100);

    let status: 'light' | 'normal' | 'full' | 'impossible';
    if (occupancyRate <= 70) status = 'light';
    else if (occupancyRate <= 100) status = 'normal';
    else if (occupancyRate <= 120) status = 'full';
    else status = 'impossible';

    return {
      totalAvailable,
      totalScheduled,
      occupancyRate,
      status,
      remainingTime: Math.max(totalAvailable - totalScheduled, 0),
    };
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
    scheduleTaskToTime,
    removeTaskFromSchedule,
    getScheduledTasks,
    getUnscheduledTasks,
    getTasksByHour,
    calculateDayCapacity,
    refresh: fetchMyDayData,
  };
}
