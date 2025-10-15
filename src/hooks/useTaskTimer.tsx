import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, ActiveTimer } from '@/types/timeEntry';
import { toast } from 'sonner';

interface UseTaskTimerReturn {
  // Estado
  isRunning: boolean;
  elapsed: number;  // segundos
  activeEntry: TimeEntry | null;
  loading: boolean;
  sessionCount: number;  // Número de sessões concluídas

  // Ações
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  stopTimer: (description?: string) => Promise<void>;

  // Verificações
  hasOtherActiveTimer: boolean;
  otherActiveTask: string | null;
}

export function useTaskTimer(taskId: string): UseTaskTimerReturn {
  const { profile } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);  // em segundos
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasOtherActiveTimer, setHasOtherActiveTimer] = useState(false);
  const [otherActiveTask, setOtherActiveTask] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar se há timer ativo ao montar
  useEffect(() => {
    checkActiveTimer();
    checkOtherActiveTimers();
    fetchSessionCount();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId, profile?.id]);

  // Atualizar elapsed a cada segundo quando timer está rodando
  useEffect(() => {
    if (isRunning && activeEntry) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const start = new Date(activeEntry.start_time);
        const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsed(elapsedSeconds);
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, activeEntry]);

  // Buscar número de sessões concluídas
  const fetchSessionCount = async () => {
    if (!profile?.id) return;

    try {
      const { count, error } = await supabase
        .from('gp_time_entries')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', taskId)
        .eq('user_id', profile.id)
        .not('end_time', 'is', null);

      if (error) throw error;

      setSessionCount(count || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem de sessões:', error);
    }
  };

  // Verificar se já existe timer ativo para esta tarefa
  const checkActiveTimer = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('gp_time_entries')
        .select('*')
        .eq('user_id', profile.id)
        .eq('task_id', taskId)
        .is('end_time', null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setActiveEntry(data);
        setIsRunning(true);

        // Calcular tempo decorrido
        const now = new Date();
        const start = new Date(data.start_time);
        const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsed(elapsedSeconds);
      }
    } catch (error) {
      console.error('Erro ao verificar timer ativo:', error);
    }
  };

  // Verificar se há timer ativo em OUTRAS tarefas
  const checkOtherActiveTimers = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('gp_time_entries')
        .select(`
          *,
          task:gp_tasks(title)
        `)
        .eq('user_id', profile.id)
        .neq('task_id', taskId)
        .is('end_time', null);

      if (error) throw error;

      if (data && data.length > 0) {
        setHasOtherActiveTimer(true);
        setOtherActiveTask(data[0].task?.title || 'Outra tarefa');
      } else {
        setHasOtherActiveTimer(false);
        setOtherActiveTask(null);
      }
    } catch (error) {
      console.error('Erro ao verificar outros timers:', error);
    }
  };

  // Iniciar timer
  const startTimer = useCallback(async () => {
    if (!profile?.id || !profile?.company_id || isRunning) return;

    setLoading(true);

    try {
      // Verificar se há timer ativo em outra tarefa
      await checkOtherActiveTimers();

      // Criar novo time entry
      const { data, error } = await supabase
        .from('gp_time_entries')
        .insert({
          task_id: taskId,
          user_id: profile.id,
          company_id: profile.company_id,
          start_time: new Date().toISOString(),
          entry_type: 'timer',
        })
        .select()
        .single();

      if (error) throw error;

      setActiveEntry(data);
      setIsRunning(true);
      setElapsed(0);

      toast.success('Timer iniciado!', {
        description: 'Seu tempo está sendo registrado.',
      });
    } catch (error: any) {
      console.error('Erro ao iniciar timer:', error);
      toast.error('Erro ao iniciar timer', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, profile, isRunning]);

  // Pausar timer (finalizar entry sem descrição)
  const pauseTimer = useCallback(async () => {
    if (!activeEntry || !isRunning) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('gp_time_entries')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', activeEntry.id);

      if (error) throw error;

      setIsRunning(false);
      setActiveEntry(null);
      setElapsed(0);

      toast.success('Timer pausado!', {
        description: `Tempo registrado: ${Math.floor(elapsed / 60)} minutos`,
      });
    } catch (error: any) {
      console.error('Erro ao pausar timer:', error);
      toast.error('Erro ao pausar timer', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [activeEntry, isRunning, elapsed]);

  // Parar timer com descrição
  const stopTimer = useCallback(async (description?: string) => {
    if (!activeEntry || !isRunning) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('gp_time_entries')
        .update({
          end_time: new Date().toISOString(),
          description: description || null,
        })
        .eq('id', activeEntry.id);

      if (error) throw error;

      const minutes = Math.floor(elapsed / 60);

      // Buscar tempo total atualizado da tarefa
      const { data: taskData } = await supabase
        .from('gp_tasks')
        .select('actual_time_minutes')
        .eq('id', taskId)
        .single();

      setIsRunning(false);
      setActiveEntry(null);
      setElapsed(0);

      // Atualizar contagem de sessões
      await fetchSessionCount();

      const totalMinutes = taskData?.actual_time_minutes || 0;
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const totalFormatted = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

      toast.success('Timer finalizado!', {
        description: `Sessão: ${minutes}min | Total acumulado: ${totalFormatted}`,
      });
    } catch (error: any) {
      console.error('Erro ao parar timer:', error);
      toast.error('Erro ao parar timer', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [activeEntry, isRunning, elapsed, taskId]);

  return {
    isRunning,
    elapsed,
    activeEntry,
    loading,
    sessionCount,
    startTimer,
    pauseTimer,
    stopTimer,
    hasOtherActiveTimer,
    otherActiveTask,
  };
}
