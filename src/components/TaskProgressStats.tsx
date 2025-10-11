import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckSquare, 
  ListTodo, 
  User,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TaskProgressStatsProps {
  projectId: string;
}

interface TaskProgressStat {
  taskId: string;
  taskTitle: string;
  progress: number;
  source: 'subtasks' | 'checklist' | 'hybrid' | 'status' | 'manual';
  hasSubtasks: boolean;
  hasChecklist: boolean;
}

export function TaskProgressStats({ projectId }: TaskProgressStatsProps) {
  const [stats, setStats] = useState<TaskProgressStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskProgressStats();
  }, [projectId]);

  const fetchTaskProgressStats = async () => {
    try {
      // Fetch all tasks for the project
      const { data: tasks, error: tasksError } = await supabase
        .from('gp_tasks')
        .select('id, title, progress, status')
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      if (!tasks?.length) {
        setStats([]);
        setLoading(false);
        return;
      }

      const taskIds = tasks.map(t => t.id);

      // Fetch checklist counts
      const { data: checklistData } = await supabase
        .from('gp_task_checklist')
        .select('task_id, is_done')
        .in('task_id', taskIds);

      // Fetch subtasks counts
      const { data: subtasksData } = await supabase
        .from('gp_task_subtasks')
        .select('task_id, is_done')
        .in('task_id', taskIds);

      // Group by task
      const checklistByTask = (checklistData || []).reduce((acc, item) => {
        if (!acc[item.task_id]) acc[item.task_id] = { total: 0, completed: 0 };
        acc[item.task_id].total++;
        if (item.is_done) acc[item.task_id].completed++;
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);

      const subtasksByTask = (subtasksData || []).reduce((acc, item) => {
        if (!acc[item.task_id]) acc[item.task_id] = { total: 0, completed: 0 };
        acc[item.task_id].total++;
        if (item.is_done) acc[item.task_id].completed++;
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);

      // Calculate progress source for each task
      const taskStats: TaskProgressStat[] = tasks.map(task => {
        const hasSubtasks = (subtasksByTask[task.id]?.total || 0) > 0;
        const hasChecklist = (checklistByTask[task.id]?.total || 0) > 0;
        
        let source: TaskProgressStat['source'] = 'status';
        let calculatedProgress = task.progress;

        if (hasSubtasks && !hasChecklist) {
          const subtaskStats = subtasksByTask[task.id];
          calculatedProgress = Math.round((subtaskStats.completed / subtaskStats.total) * 100);
          source = 'subtasks';
        } else if (hasChecklist && !hasSubtasks) {
          const checklistStats = checklistByTask[task.id];
          calculatedProgress = Math.round((checklistStats.completed / checklistStats.total) * 100);
          source = 'checklist';
        } else if (hasSubtasks && hasChecklist) {
          const subtaskStats = subtasksByTask[task.id];
          const checklistStats = checklistByTask[task.id];
          const subtaskProgress = (subtaskStats.completed / subtaskStats.total) * 100;
          const checklistProgress = (checklistStats.completed / checklistStats.total) * 100;
          calculatedProgress = Math.round((subtaskProgress + checklistProgress) / 2);
          source = 'hybrid';
        } else {
          // Status-based
          const statusProgress = {
            pending: 10,
            in_progress: 50,
            review: 80,
            completed: 100
          };
          calculatedProgress = statusProgress[task.status as keyof typeof statusProgress] || 0;
        }

        // Check if manual override
        if (Math.abs(task.progress - calculatedProgress) > 5) {
          source = 'manual';
        }

        return {
          taskId: task.id,
          taskTitle: task.title,
          progress: task.progress,
          source,
          hasSubtasks,
          hasChecklist
        };
      });

      setStats(taskStats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: TaskProgressStat['source']) => {
    switch (source) {
      case 'subtasks': return <ListTodo className="h-4 w-4" />;
      case 'checklist': return <CheckSquare className="h-4 w-4" />;
      case 'hybrid': return <Activity className="h-4 w-4" />;
      case 'manual': return <User className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSourceLabel = (source: TaskProgressStat['source']) => {
    const labels = {
      subtasks: 'Subtarefas',
      checklist: 'Checklist',
      hybrid: 'Híbrido',
      manual: 'Manual',
      status: 'Status'
    };
    return labels[source];
  };

  const getSourceColor = (source: TaskProgressStat['source']) => {
    switch (source) {
      case 'subtasks': return 'bg-blue-100 text-blue-800';
      case 'checklist': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      case 'manual': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate summary stats
  const sourceCounts = stats.reduce((acc, stat) => {
    acc[stat.source] = (acc[stat.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageProgress = stats.length > 0 
    ? Math.round(stats.reduce((sum, stat) => sum + stat.progress, 0) / stats.length)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análise de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Nenhuma tarefa encontrada para análise.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Análise de Progresso das Tarefas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{averageProgress}%</div>
            <div className="text-sm text-muted-foreground">Progresso Médio</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.length}</div>
            <div className="text-sm text-muted-foreground">Total de Tarefas</div>
          </div>
        </div>

        {/* Source distribution */}
        <div>
          <h4 className="font-medium mb-2">Fontes de Cálculo</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <Badge 
                key={source} 
                className={getSourceColor(source as TaskProgressStat['source'])}
                variant="secondary"
              >
                {getSourceIcon(source as TaskProgressStat['source'])}
                <span className="ml-1">{getSourceLabel(source as TaskProgressStat['source'])}: {count}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Task list */}
        <div>
          <h4 className="font-medium mb-2">Detalhes por Tarefa</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats.map(stat => (
              <div key={stat.taskId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{stat.taskTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      className={getSourceColor(stat.source)}
                      variant="outline"
                    >
                      {getSourceIcon(stat.source)}
                      <span className="ml-1">{getSourceLabel(stat.source)}</span>
                    </Badge>
                    {stat.hasSubtasks && (
                      <Badge variant="outline" className="text-xs">
                        📝 Subtarefas
                      </Badge>
                    )}
                    {stat.hasChecklist && (
                      <Badge variant="outline" className="text-xs">
                        ✅ Checklist
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-medium">{stat.progress}%</div>
                  <Progress value={stat.progress} className="w-16 h-1 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}