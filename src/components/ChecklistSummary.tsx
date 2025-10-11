import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistSummaryProps {
  taskId: string;
  variant?: 'badge' | 'inline';
  className?: string;
}

export function ChecklistSummary({ taskId, variant = 'badge', className = '' }: ChecklistSummaryProps) {
  const [stats, setStats] = useState<{ completed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklistStats();
  }, [taskId]);

  const fetchChecklistStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gp_task_checklist')
        .select('is_done')
        .eq('task_id', taskId);

      if (error) throw error;

      if (!data || data.length === 0) {
        setStats(null);
        return;
      }

      const completed = data.filter(item => item.is_done).length;
      const total = data.length;

      setStats({ completed, total });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do checklist:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no checklist items
  if (!loading && (!stats || stats.total === 0)) {
    return null;
  }

  // Loading state
  if (loading) {
    return null; // Or a skeleton if preferred
  }

  const isComplete = stats!.completed === stats!.total;
  const Icon = isComplete ? CheckSquare : Square;
  const displayText = `${stats!.completed}/${stats!.total}`;

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{displayText}</span>
      </div>
    );
  }

  // Badge variant (default)
  return (
    <Badge
      variant={isComplete ? "default" : "outline"}
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <Icon className="h-3 w-3" />
      {displayText}
    </Badge>
  );
}
