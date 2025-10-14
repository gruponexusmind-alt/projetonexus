import { useState } from 'react';
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
  User,
  RefreshCw
} from 'lucide-react';
import { useTaskProgress } from '@/hooks/useTaskProgress';

interface TaskProgressIndicatorV2Props {
  taskId: string;
  onProgressUpdate?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function TaskProgressIndicatorV2({
  taskId,
  onProgressUpdate,
  size = 'md'
}: TaskProgressIndicatorV2Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualProgress, setManualProgress] = useState(0);
  const { 
    progressData, 
    progressInfo, 
    loading, 
    updateManualProgress, 
    resetToAutoProgress,
    refresh
  } = useTaskProgress(taskId);

  if (loading || !progressData || !progressInfo) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Progresso</span>
          <div className="h-4 w-8 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-2 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const getSourceIcon = () => {
    switch (progressInfo.source) {
      case 'subtasks':
        return <ListTodo className="h-3 w-3" />;
      case 'checklist':
        return <CheckSquare className="h-3 w-3" />;
      case 'hybrid':
        return <Activity className="h-3 w-3" />;
      case 'manual':
        return <User className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getSourceLabel = () => {
    const labels = {
      subtasks: 'Subtarefas',
      checklist: 'Checklist',
      hybrid: 'Híbrido',
      manual: 'Manual',
      status: 'Status'
    };
    return labels[progressInfo.source];
  };

  const handleManualUpdate = async () => {
    const success = await updateManualProgress(manualProgress);
    if (success) {
      setDialogOpen(false);
      onProgressUpdate?.();
    }
  };

  const handleReset = async () => {
    const success = await resetToAutoProgress();
    if (success) {
      setDialogOpen(false);
      onProgressUpdate?.();
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
                <div className="inline-flex">
                  <Badge
                    variant={progressInfo.isManual ? "default" : "outline"}
                    className="h-5 px-1.5 text-xs flex items-center gap-1"
                  >
                    {getSourceIcon()}
                    {getSourceLabel()}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{progressInfo.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={textSizeClasses[size]}>{progressData.progress}%</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0"
            onClick={() => {
              refresh();
              onProgressUpdate?.();
            }}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0"
                onClick={() => setManualProgress(progressData.progress)}
              >
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
                    Progresso atual: <strong>{progressData.progress}%</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {progressInfo.description}
                  </p>
                </div>

                {!progressInfo.isManual && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Progresso Calculado</p>
                    <p className="text-sm text-muted-foreground">
                      {progressInfo.calculatedProgress}% - {progressInfo.description}
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
                      onClick={handleManualUpdate}
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
                    onClick={handleReset}
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
        value={progressData.progress} 
        className={sizeClasses[size]}
      />

      {/* Status indicators */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {progressData.subtasksCount > 0 && (
            <span>
              📝 {progressData.subtasksCompleted}/{progressData.subtasksCount} subtarefas
            </span>
          )}
          {progressData.checklistCount > 0 && (
            <span>
              ✅ {progressData.checklistCompleted}/{progressData.checklistCount} checklist
            </span>
          )}
        </div>
        
        {progressInfo.isManual && (
          <span className="text-orange-600 font-medium">
            Manual
          </span>
        )}
      </div>
    </div>
  );
}