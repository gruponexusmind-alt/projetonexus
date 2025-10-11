import { useState, useEffect } from 'react';
import { Plus, X, AlertTriangle, Link2, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  progress: number;
}

interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag_days: number;
  dependency_title: string;
  dependency_status: string;
  dependency_due_date: string | null;
  dependency_progress: number;
  is_blocking: boolean;
}

interface TaskDependenciesManagerProps {
  taskId: string;
  projectId: string;
  companyId: string;
  children: React.ReactNode;
  onDependenciesUpdated?: () => void;
}

const DEPENDENCY_TYPES = [
  {
    value: 'finish_to_start',
    label: 'Fim → Início (FS)',
    description: 'Esta tarefa só pode começar quando a predecessor terminar',
    icon: '→',
  },
  {
    value: 'start_to_start',
    label: 'Início → Início (SS)',
    description: 'Esta tarefa pode começar quando a predecessor começar',
    icon: '⇉',
  },
  {
    value: 'finish_to_finish',
    label: 'Fim → Fim (FF)',
    description: 'Esta tarefa termina quando a predecessor terminar',
    icon: '⊣',
  },
  {
    value: 'start_to_finish',
    label: 'Início → Fim (SF)',
    description: 'Esta tarefa termina quando a predecessor começar (raro)',
    icon: '⇄',
  },
];

export function TaskDependenciesManager({
  taskId,
  projectId,
  companyId,
  children,
  onDependenciesUpdated,
}: TaskDependenciesManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [newDependency, setNewDependency] = useState({
    depends_on_task_id: '',
    dependency_type: 'finish_to_start' as const,
    lag_days: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchDependencies();
      fetchAvailableTasks();
    }
  }, [open, taskId]);

  const fetchDependencies = async () => {
    try {
      const { data, error } = await supabase
        .from('v_task_dependencies_detailed')
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;
      setDependencies(data || []);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as dependências.',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_tasks')
        .select('id, title, status, due_date, progress')
        .eq('project_id', projectId)
        .neq('id', taskId)  // Não incluir a própria tarefa
        .order('title');

      if (error) throw error;
      setAvailableTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const addDependency = async () => {
    if (!newDependency.depends_on_task_id) {
      toast({
        title: 'Erro',
        description: 'Selecione uma tarefa predecessor.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe essa dependência
    const exists = dependencies.some(
      d => d.depends_on_task_id === newDependency.depends_on_task_id
    );

    if (exists) {
      toast({
        title: 'Erro',
        description: 'Esta dependência já existe.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('gp_task_dependencies').insert({
        task_id: taskId,
        depends_on_task_id: newDependency.depends_on_task_id,
        dependency_type: newDependency.dependency_type,
        lag_days: newDependency.lag_days,
        company_id: companyId,
      });

      if (error) {
        // Erro de ciclo circular é detectado pelo trigger
        if (error.message.includes('circular')) {
          toast({
            title: 'Dependência Circular Detectada!',
            description: 'Esta dependência criaria um ciclo. Por favor, escolha outra tarefa.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: 'Dependência adicionada!',
        description: 'A dependência foi criada com sucesso.',
      });

      setNewDependency({
        depends_on_task_id: '',
        dependency_type: 'finish_to_start',
        lag_days: 0,
      });

      fetchDependencies();
      onDependenciesUpdated?.();
    } catch (error) {
      console.error('Erro ao adicionar dependência:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a dependência.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeDependency = async (dependencyId: string) => {
    try {
      const { error } = await supabase
        .from('gp_task_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;

      toast({
        title: 'Dependência removida',
        description: 'A dependência foi removida com sucesso.',
      });

      fetchDependencies();
      onDependenciesUpdated?.();
    } catch (error) {
      console.error('Erro ao remover dependência:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a dependência.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      review: 'Em Revisão',
      completed: 'Concluída',
    };
    return labels[status] || status;
  };

  const getDependencyTypeInfo = (type: string) => {
    return DEPENDENCY_TYPES.find(t => t.value === type);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Gerenciar Dependências
          </DialogTitle>
          <DialogDescription>
            Configure quais tarefas devem ser concluídas antes desta poder começar ou finalizar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar Nova Dependência */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar Predecessor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="task">Tarefa Predecessor</Label>
                  <Select
                    value={newDependency.depends_on_task_id}
                    onValueChange={(value) =>
                      setNewDependency({ ...newDependency, depends_on_task_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma tarefa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            <span>{task.title}</span>
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lag">Lag (dias)</Label>
                  <Input
                    id="lag"
                    type="number"
                    value={newDependency.lag_days}
                    onChange={(e) =>
                      setNewDependency({
                        ...newDependency,
                        lag_days: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Positivo = atraso, Negativo = adiantamento
                  </p>
                </div>
              </div>

              <div>
                <Label>Tipo de Dependência</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {DEPENDENCY_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={
                        newDependency.dependency_type === type.value ? 'default' : 'outline'
                      }
                      className="justify-start text-left h-auto py-3"
                      onClick={() =>
                        setNewDependency({
                          ...newDependency,
                          dependency_type: type.value as any,
                        })
                      }
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{type.icon}</span>
                          <span className="font-medium text-sm">{type.label}</span>
                        </div>
                        <span className="text-xs opacity-70 font-normal">{type.description}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={addDependency} disabled={loading} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dependência
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Dependências Existentes */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Dependências Atuais ({dependencies.length})
            </h3>

            {dependencies.length > 0 ? (
              dependencies.map((dep) => {
                const typeInfo = getDependencyTypeInfo(dep.dependency_type);
                return (
                  <Card key={dep.id} className={dep.is_blocking ? 'border-destructive/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{typeInfo?.icon}</span>
                            <span className="font-medium">{dep.dependency_title}</span>
                            <Badge className={getStatusColor(dep.dependency_status)} variant="outline">
                              {getStatusLabel(dep.dependency_status)}
                            </Badge>
                            {dep.is_blocking && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Bloqueando
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              <span>{typeInfo?.label}</span>
                            </div>

                            {dep.lag_days !== 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {dep.lag_days > 0 ? '+' : ''}
                                  {dep.lag_days} dias
                                </span>
                              </div>
                            )}

                            {dep.dependency_due_date && (
                              <div className="flex items-center gap-1">
                                <span>
                                  Prazo: {new Date(dep.dependency_due_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <span>Progresso: {dep.dependency_progress}%</span>
                            </div>
                          </div>

                          {dep.is_blocking && (
                            <div className="text-xs text-destructive flex items-start gap-1 bg-destructive/10 p-2 rounded">
                              <AlertTriangle className="h-3 w-3 mt-0.5" />
                              <span>
                                Esta tarefa está bloqueada porque a predecessor ainda não foi concluída
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDependency(dep.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma dependência configurada</p>
                  <p className="text-xs mt-1">
                    Esta tarefa pode começar a qualquer momento
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informação sobre Caminho Crítico */}
          {dependencies.some(d => d.is_blocking) && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-orange-900">Atenção: Tarefa Bloqueada</h4>
                    <p className="text-sm text-orange-800">
                      Esta tarefa possui dependências não concluídas. Complete as tarefas predecessoras
                      antes de iniciar esta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
