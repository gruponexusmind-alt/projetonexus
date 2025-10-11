import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, TrendingUp } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  created_at: string;
  assignee?: {
    nome: string;
  };
}

interface ProjectGanttProps {
  projectId: string;
}

export function ProjectGantt({ projectId }: ProjectGanttProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          estimated_hours,
          actual_hours,
          created_at,
          assignee:profiles(nome)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o cronograma.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-200',
      in_progress: 'bg-blue-500',
      review: 'bg-yellow-500',
      completed: 'bg-green-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      review: 'Em Revisão',
      completed: 'Concluído'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getTaskDuration = (task: Task) => {
    const startDate = new Date(task.created_at);
    const endDate = task.due_date ? new Date(task.due_date) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (task: Task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'review') return 80;
    if (task.status === 'in_progress') return 50;
    return 10;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando cronograma...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Cronograma do Projeto</h3>
        <p className="text-muted-foreground text-sm">
          Timeline das tarefas e marcos do projeto
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma tarefa cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-4">
            <div className="col-span-4">Tarefa</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Responsável</div>
            <div className="col-span-2">Prazo</div>
            <div className="col-span-2">Progresso</div>
          </div>

          {/* Task Timeline */}
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Task Info */}
                    <div className="col-span-4">
                      <div className="flex items-start space-y-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          <h4 className="font-medium text-sm">{task.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          {task.estimated_hours && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {task.estimated_hours}h
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>

                    {/* Assignee */}
                    <div className="col-span-2">
                      {task.assignee ? (
                        <div className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          {task.assignee.nome}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não atribuído</span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="col-span-2">
                      {task.due_date ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem prazo</span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getStatusColor(task.status)}`}
                            style={{ width: `${getProgressPercentage(task)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {getProgressPercentage(task)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gantt Bar Visualization */}
                  <div className="mt-3">
                    <div className="relative">
                      <div className="flex items-center gap-1 mb-2">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Duração: {getTaskDuration(task)} dias
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
                        {/* Task Duration Bar */}
                        <div 
                          className={`h-full ${getStatusColor(task.status)} opacity-20`}
                          style={{ width: '100%' }}
                        />
                        
                        {/* Progress Bar */}
                        <div 
                          className={`absolute top-0 left-0 h-full ${getStatusColor(task.status)} transition-all duration-300`}
                          style={{ width: `${getProgressPercentage(task)}%` }}
                        />

                        {/* Milestones */}
                        <div className="absolute inset-0 flex justify-between items-center px-2">
                          <span className="text-xs font-medium text-white mix-blend-difference">
                            {new Date(task.created_at).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </span>
                          {task.due_date && (
                            <span className="text-xs font-medium text-white mix-blend-difference">
                              {new Date(task.due_date).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: 'short' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Resumo do Cronograma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Em andamento</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {tasks.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Concluídas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {tasks.filter(t => t.status === 'review').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Em revisão</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {tasks.filter(t => t.status === 'pending').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}