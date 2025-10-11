import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskProgressData {
  progress: number;
  checklistCount: number;
  checklistCompleted: number;
  subtasksCount: number;
  subtasksCompleted: number;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
}

interface TaskProgressInfo {
  source: 'subtasks' | 'checklist' | 'hybrid' | 'status' | 'manual';
  calculatedProgress: number;
  description: string;
  isManual: boolean;
}

export function useTaskProgress(taskId: string) {
  const [progressData, setProgressData] = useState<TaskProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastKnownProgress, setLastKnownProgress] = useState<number>(0);
  const { toast } = useToast();

  const fetchProgressData = useCallback(async () => {
    if (!taskId) return;
    
    try {
      // Fetch task data
      const { data: taskData, error: taskError } = await supabase
        .from('gp_tasks')
        .select('progress, status')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Fetch checklist data
      const { data: checklistData } = await supabase
        .from('gp_task_checklist')
        .select('is_done')
        .eq('task_id', taskId);

      // Fetch subtasks data
      const { data: subtasksData } = await supabase
        .from('gp_task_subtasks')
        .select('is_done')
        .eq('task_id', taskId);

      const checklistCount = checklistData?.length || 0;
      const checklistCompleted = checklistData?.filter(item => item.is_done).length || 0;
      const subtasksCount = subtasksData?.length || 0;
      const subtasksCompleted = subtasksData?.filter(item => item.is_done).length || 0;

      const newProgressData: TaskProgressData = {
        progress: taskData.progress,
        checklistCount,
        checklistCompleted,
        subtasksCount,
        subtasksCompleted,
        status: taskData.status as 'pending' | 'in_progress' | 'review' | 'completed'
      };

      // Check if progress changed automatically
      if (lastKnownProgress > 0 && lastKnownProgress !== taskData.progress) {
        const progressInfo = calculateProgressInfo(newProgressData);
        if (!progressInfo.isManual) {
          toast({
            title: 'Progresso Atualizado',
            description: `Progresso recalculado automaticamente: ${taskData.progress}% (${progressInfo.source})`,
          });
        }
      }

      setProgressData(newProgressData);
      setLastKnownProgress(taskData.progress);
    } catch (error) {
      console.error('Erro ao buscar dados de progresso:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId, lastKnownProgress, toast]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  // Listen for real-time updates
  useEffect(() => {
    if (!taskId) return;

    const tasksChannel = supabase
      .channel('task-progress-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gp_tasks',
          filter: `id=eq.${taskId}`
        },
        () => {
          fetchProgressData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp_task_checklist',
          filter: `task_id=eq.${taskId}`
        },
        () => {
          fetchProgressData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp_task_subtasks',
          filter: `task_id=eq.${taskId}`
        },
        () => {
          fetchProgressData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, [taskId, fetchProgressData]);

  const calculateProgressInfo = (data: TaskProgressData): TaskProgressInfo => {
    let calculatedProgress = data.progress;
    let source: TaskProgressInfo['source'] = 'status';
    let description = 'Baseado no status da tarefa';

    // Priority: subtasks > checklist > hybrid > status
    if (data.subtasksCount > 0 && data.checklistCount === 0) {
      calculatedProgress = Math.round((data.subtasksCompleted / data.subtasksCount) * 100);
      source = 'subtasks';
      description = `${data.subtasksCompleted}/${data.subtasksCount} subtarefas concluídas`;
    } else if (data.checklistCount > 0 && data.subtasksCount === 0) {
      calculatedProgress = Math.round((data.checklistCompleted / data.checklistCount) * 100);
      source = 'checklist';
      description = `${data.checklistCompleted}/${data.checklistCount} itens concluídos`;
    } else if (data.subtasksCount > 0 && data.checklistCount > 0) {
      const subtaskProgress = (data.subtasksCompleted / data.subtasksCount) * 100;
      const checklistProgress = (data.checklistCompleted / data.checklistCount) * 100;
      calculatedProgress = Math.round((subtaskProgress + checklistProgress) / 2);
      source = 'hybrid';
      description = `Média entre subtarefas (${Math.round(subtaskProgress)}%) e checklist (${Math.round(checklistProgress)}%)`;
    } else {
      // Status-based fallback
      const statusProgress = {
        pending: 10,
        in_progress: 50,
        review: 80,
        completed: 100
      };
      calculatedProgress = statusProgress[data.status];
      description = `Progresso baseado no status: ${data.status}`;
    }

    // Check if manual override (difference > 5%)
    const isManual = Math.abs(data.progress - calculatedProgress) > 5;
    if (isManual) {
      source = 'manual';
      description = 'Progresso definido manualmente';
    }

    return {
      source,
      calculatedProgress,
      description,
      isManual
    };
  };

  const updateManualProgress = async (newProgress: number): Promise<boolean> => {
    if (!progressData || newProgress < 0 || newProgress > 100) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('gp_tasks')
        .update({ progress: newProgress })
        .eq('id', taskId);

      if (error) throw error;

      setProgressData(prev => prev ? { ...prev, progress: newProgress } : null);
      setLastKnownProgress(newProgress);

      toast({
        title: 'Progresso atualizado',
        description: `Progresso definido manualmente para ${newProgress}%.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o progresso.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const resetToAutoProgress = async (): Promise<boolean> => {
    if (!progressData) return false;

    const progressInfo = calculateProgressInfo(progressData);
    
    try {
      const { error } = await supabase
        .from('gp_tasks')
        .update({ progress: progressInfo.calculatedProgress })
        .eq('id', taskId);

      if (error) throw error;

      setProgressData(prev => prev ? { ...prev, progress: progressInfo.calculatedProgress } : null);
      setLastKnownProgress(progressInfo.calculatedProgress);

      toast({
        title: 'Progresso resetado',
        description: 'Progresso voltou ao cálculo automático.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao resetar progresso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar o progresso.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const progressInfo = progressData ? calculateProgressInfo(progressData) : null;

  return {
    progressData,
    progressInfo,
    loading,
    updateManualProgress,
    resetToAutoProgress,
    refresh: fetchProgressData
  };
}