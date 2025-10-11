import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
  position: number;
}

interface TaskChecklistEditorProps {
  taskId: string;
  companyId: string;
  onUpdate?: () => void;
}

export function TaskChecklistEditor({ taskId, companyId, onUpdate }: TaskChecklistEditorProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, [taskId]);

  const fetchChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_task_checklist')
        .select('*')
        .eq('task_id', taskId)
        .order('position');

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
    }
  };

  const addItem = async () => {
    if (!newItemTitle.trim()) return;

    try {
      setLoading(true);
      const maxPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) : 0;

      const { error } = await supabase
        .from('gp_task_checklist')
        .insert({
          task_id: taskId,
          company_id: companyId,
          title: newItemTitle.trim(),
          is_done: false,
          position: maxPosition + 1,
        });

      if (error) throw error;

      setNewItemTitle('');
      await fetchChecklist();
      onUpdate?.();

      toast({
        title: 'Sucesso',
        description: 'Item adicionado ao checklist.',
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o item.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: string, isDone: boolean) => {
    try {
      const { error } = await supabase
        .from('gp_task_checklist')
        .update({ is_done: isDone })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, is_done: isDone } : item
        )
      );
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o item.',
        variant: 'destructive',
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('gp_task_checklist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchChecklist();
      onUpdate?.();

      toast({
        title: 'Sucesso',
        description: 'Item removido do checklist.',
      });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item.',
        variant: 'destructive',
      });
    }
  };

  const completedCount = items.filter(i => i.is_done).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {completedCount} de {items.length} itens concluídos
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Add New Item */}
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar novo item..."
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          disabled={loading}
        />
        <Button onClick={addItem} disabled={loading || !newItemTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum item no checklist. Adicione o primeiro!
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

              <Checkbox
                checked={item.is_done}
                onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
              />

              <span
                className={`flex-1 ${
                  item.is_done ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item.title}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
