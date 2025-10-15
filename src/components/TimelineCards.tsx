import { useMemo } from 'react';
import { TimelineTask } from '@/hooks/useTimelineData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '@/components/TaskCard';
import { FolderOpen, User } from 'lucide-react';

interface TimelineCardsProps {
  tasks: TimelineTask[];
  groupBy: 'project' | 'user' | 'none';
  onTaskClick: (task: TimelineTask) => void;
}

interface TaskGroup {
  id: string;
  label: string;
  tasks: TimelineTask[];
  completedTasks: number;
  totalTasks: number;
  progress: number;
}

export function TimelineCards({ tasks, groupBy, onTaskClick }: TimelineCardsProps) {
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      const avgProgress = tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0;

      return [{
        id: 'all',
        label: 'Todas as Tarefas',
        tasks: tasks.sort((a, b) => {
          const dateA = new Date(a.start_date || a.due_date || '9999-12-31');
          const dateB = new Date(b.start_date || b.due_date || '9999-12-31');
          return dateA.getTime() - dateB.getTime();
        }),
        completedTasks: completedCount,
        totalTasks: tasks.length,
        progress: avgProgress,
      }];
    }

    const groups = new Map<string, TimelineTask[]>();

    tasks.forEach(task => {
      let key: string;
      if (groupBy === 'project') {
        key = task.project_id;
      } else {
        key = task.assigned_to || 'unassigned';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(task);
    });

    return Array.from(groups.entries()).map(([key, groupTasks]) => {
      const sortedTasks = groupTasks.sort((a, b) => {
        const dateA = new Date(a.start_date || a.due_date || '9999-12-31');
        const dateB = new Date(b.start_date || b.due_date || '9999-12-31');
        return dateA.getTime() - dateB.getTime();
      });

      const completedCount = sortedTasks.filter(t => t.status === 'completed').length;
      const avgProgress = sortedTasks.length > 0
        ? Math.round(sortedTasks.reduce((sum, t) => sum + t.progress, 0) / sortedTasks.length)
        : 0;

      return {
        id: key,
        label: groupBy === 'project'
          ? (sortedTasks[0]?.project_title || 'Sem Projeto')
          : (sortedTasks[0]?.assigned_user_name || 'Não Atribuído'),
        tasks: sortedTasks,
        completedTasks: completedCount,
        totalTasks: sortedTasks.length,
        progress: avgProgress,
      };
    });
  }, [tasks, groupBy]);

  if (groupedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ajuste os filtros para ver mais tarefas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedTasks.map((group) => (
        <Card key={group.id} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {groupBy === 'project' ? (
                  <FolderOpen className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
                <div>
                  <CardTitle className="text-xl">{group.label}</CardTitle>
                  <CardDescription className="mt-1">
                    {group.completedTasks} de {group.totalTasks} tarefas concluídas
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {group.totalTasks} {group.totalTasks === 1 ? 'tarefa' : 'tarefas'}
                </Badge>
                <div className="w-32 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-semibold">{group.progress}%</span>
                  </div>
                  <Progress value={group.progress} className="h-2" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-3">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={onTaskClick}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
