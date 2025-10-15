import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TaskTimeHistory } from '@/components/TaskTimeHistory';
import { useTaskTimer } from '@/hooks/useTaskTimer';
import { Play, Pause, Square, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  taskId: string;
  taskTitle?: string;
  compact?: boolean;
  className?: string;
}

export function TaskTimer({ taskId, taskTitle, compact = false, className }: TaskTimerProps) {
  const {
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
  } = useTaskTimer(taskId);

  const [showStopDialog, setShowStopDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [historyKey, setHistoryKey] = useState(0);

  // Format elapsed time as HH:MM:SS or MM:SS
  const formatElapsed = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (hasOtherActiveTimer) {
      // Show warning but allow user to start anyway
      const confirmed = window.confirm(
        `Você já tem um timer ativo em "${otherActiveTask}". Deseja pausar esse timer e iniciar um novo?`
      );
      if (!confirmed) return;
    }
    await startTimer();
  };

  const handlePause = async () => {
    await pauseTimer();
  };

  const handleStopClick = () => {
    setShowStopDialog(true);
  };

  const handleStopConfirm = async () => {
    await stopTimer(description.trim() || undefined);
    setShowStopDialog(false);
    setDescription('');
    // Atualizar histórico
    setHistoryKey(prev => prev + 1);
  };

  const handleStopCancel = () => {
    setShowStopDialog(false);
    setDescription('');
  };

  // Compact mode: just a row of buttons with timer
  if (compact) {
    return (
      <>
        <div className={cn('flex items-center gap-2', className)}>
          {/* Timer Display */}
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-sm font-semibold',
            isRunning ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
          )}>
            <Clock className="h-3.5 w-3.5" />
            {formatElapsed(elapsed)}
          </div>

          {/* Action Buttons */}
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={loading}
              size="sm"
              variant="default"
              className="gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Iniciar
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePause}
                disabled={loading}
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
                Pausar
              </Button>
              <Button
                onClick={handleStopClick}
                disabled={loading}
                size="sm"
                variant="destructive"
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                Finalizar
              </Button>
            </>
          )}
        </div>

        {/* Stop Dialog */}
        <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Timer</DialogTitle>
              <DialogDescription>
                Adicione uma descrição do trabalho realizado (opcional)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="O que você trabalhou nesta sessão?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Tempo total: <span className="font-semibold">{Math.floor(elapsed / 60)} minutos</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleStopCancel}>
                Cancelar
              </Button>
              <Button onClick={handleStopConfirm} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Finalizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full card mode
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Controle de Tempo
              </CardTitle>
              {taskTitle && (
                <CardDescription>{taskTitle}</CardDescription>
              )}
            </div>
            {isRunning && (
              <Badge variant="default" className="bg-green-600">
                <div className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Em Execução
                </div>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning about other active timer */}
          {hasOtherActiveTimer && !isRunning && (
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Você já tem um timer ativo em: <strong>{otherActiveTask}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className={cn(
              'text-6xl font-mono font-bold tracking-wider',
              isRunning ? 'text-green-600' : 'text-gray-400'
            )}>
              {formatElapsed(elapsed)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isRunning ? 'Timer em execução' : 'Timer parado'}
            </p>
            {sessionCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {isRunning ? `Sessão #${sessionCount + 1}` : `${sessionCount} sessão${sessionCount > 1 ? 'ões' : ''} registrada${sessionCount > 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 gap-2"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                Iniciar Timer
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePause}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Pause className="h-5 w-5" />
                  )}
                  Pausar
                </Button>
                <Button
                  onClick={handleStopClick}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  Finalizar
                </Button>
              </>
            )}
          </div>

          {/* Info */}
          {activeEntry && (
            <div className="text-xs text-muted-foreground text-center">
              Timer iniciado em {new Date(activeEntry.start_time).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Sessões */}
      <div className="mt-6">
        <TaskTimeHistory
          key={historyKey}
          taskId={taskId}
          onEntriesChange={() => setHistoryKey(prev => prev + 1)}
        />
      </div>

      {/* Stop Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Timer</DialogTitle>
            <DialogDescription>
              Adicione uma descrição do trabalho realizado (opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="O que você trabalhou nesta sessão?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Tempo total: <span className="font-semibold">{Math.floor(elapsed / 60)} minutos</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleStopCancel}>
              Cancelar
            </Button>
            <Button onClick={handleStopConfirm} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
