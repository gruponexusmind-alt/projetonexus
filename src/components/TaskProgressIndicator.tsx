import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Settings, 
  CheckSquare, 
  ListTodo, 
  Activity, 
  User 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskProgressIndicatorProps {
  taskId: string;
  currentProgress: number;
  checklistCount?: number;
  checklistCompleted?: number;
  subtasksCount?: number;
  subtasksCompleted?: number;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  onProgressUpdate?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

type ProgressSource = 'subtasks' | 'checklist' | 'hybrid' | 'status' | 'manual';

export function TaskProgressIndicator({
  taskId,
  currentProgress,
  checklistCount = 0,
  checklistCompleted = 0,
  subtasksCount = 0,
  subtasksCompleted = 0,
  status,
  onProgressUpdate,
  size = 'md'
}: TaskProgressIndicatorProps) {
  const [manualProgress, setManualProgress] = useState(currentProgress);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Determine progress source and calculated progress
  const getProgressInfo = () => {
    let calculatedProgress = currentProgress;
    let source: ProgressSource = 'status';
    let sourceIcon = <Activity className="h-3 w-3" />;
    let sourceLabel = 'Status';
    let sourceDescription = 'Baseado no status da tarefa';

    // Check if has subtasks
    if (subtasksCount > 0) {
      calculatedProgress = Math.round((subtasksCompleted / subtasksCount) * 100);
      source = 'subtasks';
      sourceIcon = <ListTodo className="h-3 w-3" />;
      sourceLabel = 'Subtarefas';
      sourceDescription = `${subtasksCompleted}/${subtasksCount} subtarefas concluídas`;
    }
    // Check if has checklist
    else if (checklistCount > 0) {
      calculatedProgress = Math.round((checklistCompleted / checklistCount) * 100);
      source = 'checklist';
      sourceIcon = <CheckSquare className="h-3 w-3" />;
      sourceLabel = 'Checklist';
      sourceDescription = `${checklistCompleted}/${checklistCount} itens concluídos`;
    }
    // Check if has both (hybrid)
    else if (subtasksCount > 0 && checklistCount > 0) {
      const subtaskProgress = (subtasksCompleted / subtasksCount) * 100;
      const checklistProgress = (checklistCompleted / checklistCount) * 100;
      calculatedProgress = Math.round((subtaskProgress + checklistProgress) / 2);
      source = 'hybrid';
      sourceIcon = <Activity className="h-3 w-3" />;
      sourceLabel = 'Híbrido';
      sourceDescription = `Média entre subtarefas (${Math.round(subtaskProgress)}%) e checklist (${Math.round(checklistProgress)}%)`;
    }
    // Fallback to status-based progress
    else {
      const statusProgress = {
        pending: 10,
        in_progress: 50,
        review: 80,
        completed: 100
      };
      calculatedProgress = statusProgress[status];
      sourceDescription = `Progresso baseado no status: ${status}`;
    }

    // Check if current progress differs significantly from calculated (manual override)
    const isManual = Math.abs(currentProgress - calculatedProgress) > 5;
    if (isManual) {
      source = 'manual';
      sourceIcon = <User className="h-3 w-3" />;
      sourceLabel = 'Manual';
      sourceDescription = 'Progresso definido manualmente';
    }

    return {
      calculatedProgress,
      source,
      sourceIcon,
      sourceLabel,
      sourceDescription,
      isManual
    };
  };

  const progressInfo = getProgressInfo();

  const updateManualProgress = async () => {
    if (manualProgress < 0 || manualProgress > 100) {
      toast({
        title: 'Erro',
        description: 'O progresso deve estar entre 0 e 100%.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_tasks')
        .update({ progress: manualProgress })
        .eq('id', taskId);

      if (error) throw error;

      setIsManualOverride(true);
      setDialogOpen(false);
      onProgressUpdate?.();

      toast({
        title: 'Progresso atualizado',
        description: `Progresso definido manualmente para ${manualProgress}%.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o progresso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToAutoProgress = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_tasks')
        .update({ progress: progressInfo.calculatedProgress })
        .eq('id', taskId);

      if (error) throw error;

      setIsManualOverride(false);
      setDialogOpen(false);
      onProgressUpdate?.();

      toast({
        title: 'Progresso resetado',
        description: 'Progresso voltou ao cálculo automático.',
      });
    } catch (error) {
      console.error('Erro ao resetar progresso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar o progresso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="space-y-2">
      {/* Progress header with source info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={textSizeClasses[size]}>Progresso</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="h-5 px-1.5 text-xs flex items-center gap-1"
                >
                  {progressInfo.sourceIcon}
                  {progressInfo.sourceLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{progressInfo.sourceDescription}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={textSizeClasses[size]}>{currentProgress}%</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Progresso</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Progresso atual: <strong>{currentProgress}%</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {progressInfo.sourceDescription}
                  </p>
                </div>

                {progressInfo.source !== 'manual' && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Progresso Calculado</p>
                    <p className="text-sm text-muted-foreground">
                      {progressInfo.calculatedProgress}% - {progressInfo.sourceDescription}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Definir Progresso Manual
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={manualProgress}
                      onChange={(e) => setManualProgress(Number(e.target.value))}
                      placeholder="0-100"
                    />
                    <Button 
                      onClick={updateManualProgress}
                      disabled={loading}
                      size="sm"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>

                {progressInfo.isManual && (
                  <Button 
                    variant="outline" 
                    onClick={resetToAutoProgress}
                    disabled={loading}
                    className="w-full"
                  >
                    Voltar ao Cálculo Automático
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress bar */}
      <Progress 
        value={currentProgress} 
        className={sizeClasses[size]}
      />

      {/* Warning for manual override */}
      {progressInfo.isManual && (
        <p className="text-xs text-orange-600">
          ⚠️ Progresso definido manualmente
        </p>
      )}
    </div>
  );
}