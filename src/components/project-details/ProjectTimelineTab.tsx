import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Flag, Clock, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GanttTask {
  task_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  start_date: string;
  due_date: string | null;
  progress: number;
  stage_id: string | null;
  stage_name: string | null;
  stage_order: number | null;
  is_overdue: boolean;
  duration_days: number;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  title: string;
}

interface ProjectTimelineTabProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectTimelineTab({ project }: ProjectTimelineTabProps) {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectsOpen, setSelectsOpen] = useState({ stage: false, status: false });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchStages();
  }, [project.id]);

  // Cleanup: Fechar Selects antes do unmount para evitar race condition com Radix Presence
  useEffect(() => {
    return () => {
      setSelectsOpen({ stage: false, status: false });
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: tasksData, error } = await supabase
        .from('v_project_gantt')
        .select('*')
        .eq('project_id', project.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTasks(tasksData?.map(task => ({
        ...task,
        status: task.status as GanttTask['status'],
        priority: task.priority as GanttTask['priority']
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_project_stages')
        .select('*')
        .eq('project_id', project.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  const getStatusColor = (status: GanttTask['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: GanttTask['status']) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      review: 'Em Revisão',
      completed: 'Concluída'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: GanttTask['priority']) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: GanttTask['priority']) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return labels[priority] || priority;
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const stageMatch = selectedStage === 'all' || task.stage_id === selectedStage;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return stageMatch && statusMatch;
  });

  // Calculate chart dimensions and scale
  const chartHeight = Math.max(400, filteredTasks.length * 60);
  const today = new Date();

  // Filter tasks with valid dates
  const tasksWithDates = filteredTasks.filter(t => t.start_date && (t.due_date || t.duration_days));

  const earliestDate = tasksWithDates.length > 0
    ? new Date(Math.min(...tasksWithDates.map(t => new Date(t.start_date).getTime())))
    : today;
  const latestDate = tasksWithDates.length > 0
    ? new Date(Math.max(...tasksWithDates.map(t => {
        const start = new Date(t.start_date);
        if (t.due_date) {
          return new Date(t.due_date).getTime();
        }
        // Fallback: add duration to start_date
        const fallbackEnd = new Date(start);
        fallbackEnd.setDate(fallbackEnd.getDate() + (t.duration_days || 1));
        return fallbackEnd.getTime();
      })))
    : today;

  const totalDays = Math.max(7, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const dayWidth = Math.max(20, Math.min(40, 800 / totalDays));

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timeline - Cronograma</h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Timeline - Cronograma</h2>
        <p className="text-muted-foreground">
          Visualize o cronograma e progresso das tarefas do projeto
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select
          value={selectedStage}
          onValueChange={setSelectedStage}
          open={selectsOpen.stage}
          onOpenChange={(open) => setSelectsOpen(prev => ({ ...prev, stage: open }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={setSelectedStatus}
          open={selectsOpen.status}
          onOpenChange={(open) => setSelectsOpen(prev => ({ ...prev, status: open }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="review">Em Revisão</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredTasks.length}</p>
              <p className="text-sm text-muted-foreground">Total Filtradas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredTasks.filter(t => t.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {filteredTasks.filter(t => t.status === 'in_progress').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Progresso</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {filteredTasks.filter(t => t.is_overdue).length}
              </p>
              <p className="text-sm text-muted-foreground">Atrasadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      {filteredTasks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma Gantt
            </CardTitle>
            {filteredTasks.length !== tasksWithDates.length && (
              <div className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {filteredTasks.length - tasksWithDates.length} tarefa(s) sem datas definidas não aparecem no cronograma
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]" style={{ height: chartHeight }}>
                {/* Time header */}
                <div className="flex mb-4 border-b pb-2">
                  <div className="w-80 text-sm font-medium">Tarefa</div>
                  <div className="flex-1 relative">
                    <div className="flex border-l">
                      {Array.from({ length: totalDays }, (_, i) => {
                        const date = new Date(earliestDate);
                        date.setDate(date.getDate() + i);
                        const isToday = date.toDateString() === today.toDateString();
                        
                        return (
                          <div
                            key={i}
                            className={`flex-shrink-0 border-r text-xs p-1 text-center ${
                              isToday ? 'bg-primary/10 font-medium' : ''
                            }`}
                            style={{ width: dayWidth }}
                          >
                            {date.getDate()}
                            {date.getDate() === 1 && (
                              <div className="text-xs text-muted-foreground">
                                {date.toLocaleDateString('pt-BR', { month: 'short' })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tasks with Gantt bars */}
                <div className="space-y-2">
                  {tasksWithDates.map((task, index) => {
                    const startDate = new Date(task.start_date);
                    const endDate = task.due_date
                      ? new Date(task.due_date)
                      : (() => {
                          const end = new Date(startDate);
                          end.setDate(end.getDate() + (task.duration_days || 1) - 1);
                          return end;
                        })();
                    const startOffset = Math.max(0, Math.ceil((startDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
                    const duration = Math.max(1, task.duration_days || 1);

                    return (
                      <div key={task.task_id} className="flex items-center">
                        {/* Task info */}
                        <div className="w-80 pr-4">
                          <div className="text-sm font-medium truncate">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              className={getPriorityColor(task.priority)} 
                              variant="outline"
                            >
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            <Badge 
                              className={getStatusColor(task.status)} 
                              variant="outline"
                            >
                              {getStatusLabel(task.status)}
                            </Badge>
                            {task.is_overdue && (
                              <Badge variant="destructive">
                                Atrasada
                              </Badge>
                            )}
                          </div>
                          {task.stage_name && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Etapa: {task.stage_name}
                            </div>
                          )}
                        </div>

                        {/* Gantt bar */}
                        <div className="flex-1 relative h-8 border-l">
                          <div
                            className={`absolute h-6 mt-1 rounded ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                              task.status === 'review' ? 'bg-purple-500' :
                              task.is_overdue ? 'bg-red-500' :
                              'bg-gray-400'
                            } ${task.is_overdue ? 'animate-pulse' : ''}`}
                            style={{
                              left: startOffset * dayWidth,
                              width: duration * dayWidth,
                              maxWidth: `calc(100% - ${startOffset * dayWidth}px)`
                            }}
                          >
                            {/* Progress fill */}
                            <div
                              className="h-full bg-white/30 rounded"
                              style={{ width: `${task.progress}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium px-2">
                              <span className="truncate">
                                {task.progress}%
                              </span>
                            </div>
                          </div>

                          {/* Today line */}
                          {(() => {
                            const todayOffset = Math.ceil((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
                            if (todayOffset >= 0 && todayOffset <= totalDays) {
                              return (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                  style={{ left: todayOffset * dayWidth }}
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-muted-foreground">
              Adicione tarefas ao projeto para visualizar o cronograma.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}