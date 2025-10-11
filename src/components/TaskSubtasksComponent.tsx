import { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Subtask {
  id: string;
  title: string;
  is_done: boolean;
  position: number;
}

interface TaskSubtasksComponentProps {
  taskId: string;
  companyId: string;
  onProgressUpdate?: () => void;
}

export function TaskSubtasksComponent({ 
  taskId, 
  companyId, 
  onProgressUpdate 
}: TaskSubtasksComponentProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const fetchSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_task_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar subtarefas:', error);
    }
  };

  const createSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_task_subtasks')
        .insert({
          company_id: companyId,
          task_id: taskId,
          title: newSubtaskTitle.trim(),
          position: subtasks.length,
        });

      if (error) throw error;

      setNewSubtaskTitle('');
      await fetchSubtasks();
      onProgressUpdate?.();

      toast({
        title: 'Subtarefa criada',
        description: 'Subtarefa adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar subtarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a subtarefa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtask = async (subtaskId: string, isDone: boolean) => {
    try {
      const { error } = await supabase
        .from('gp_task_subtasks')
        .update({ is_done: isDone })
        .eq('id', subtaskId);

      if (error) throw error;

      setSubtasks(prev => 
        prev.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, is_done: isDone }
            : subtask
        )
      );
      onProgressUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a subtarefa.',
        variant: 'destructive',
      });
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('gp_task_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      await fetchSubtasks();
      onProgressUpdate?.();

      toast({
        title: 'Subtarefa removida',
        description: 'Subtarefa removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover subtarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a subtarefa.',
        variant: 'destructive',
      });
    }
  };

  const completedCount = subtasks.filter(s => s.is_done).length;
  const progressPercentage = subtasks.length > 0 
    ? Math.round((completedCount / subtasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Subtarefas</h4>
        <div className="text-sm text-muted-foreground">
          {completedCount}/{subtasks.length} ({progressPercentage}%)
        </div>
      </div>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-md border">
            <Checkbox
              checked={subtask.is_done}
              onCheckedChange={(checked) => toggleSubtask(subtask.id, !!checked)}
            />
            <span 
              className={`flex-1 text-sm ${
                subtask.is_done ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSubtask(subtask.id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new subtask */}
      <div className="flex gap-2">
        <Input
          placeholder="Nova subtarefa..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createSubtask()}
          className="flex-1"
        />
        <Button 
          onClick={createSubtask} 
          disabled={loading || !newSubtaskTitle.trim()}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}