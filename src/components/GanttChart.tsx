import { useMemo } from 'react';
import { TimelineTask } from '@/hooks/useTimelineData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Flag, User } from 'lucide-react';

interface GanttChartProps {
  tasks: TimelineTask[];
  startDate: Date;
  endDate: Date;
  groupBy?: 'project' | 'user' | 'none';
}

export function GanttChart({ tasks, startDate, endDate, groupBy = 'project' }: GanttChartProps) {
  // Calcular número total de dias
  const totalDays = differenceInDays(endDate, startDate);
  const daysArray = Array.from({ length: totalDays + 1 }, (_, i) => i);

  // Agrupar tarefas
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ label: 'Todas as Tarefas', tasks }];
    }

    const groups = new Map<string, TimelineTask[]>();

    tasks.forEach(task => {
      let key: string;
      let label: string;

      if (groupBy === 'project') {
        key = task.project_id;
        label = task.project_title || 'Sem Projeto';
      } else {
        key = task.assigned_to || 'unassigned';
        label = task.assigned_user_name || 'Não Atribuído';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(task);
    });

    return Array.from(groups.entries()).map(([key, groupTasks]) => ({
      label: groupTasks[0]?.project_title || groupTasks[0]?.assigned_user_name || 'Não Atribuído',
      tasks: groupTasks,
    }));
  }, [tasks, groupBy]);

  const getTaskPosition = (task: TimelineTask) => {
    if (!task.due_date) return null;

    const taskStart = task.start_date ? parseISO(task.start_date) : parseISO(task.due_date);
    const taskEnd = parseISO(task.due_date);

    const startOffset = differenceInDays(taskStart, startDate);
    const duration = differenceInDays(taskEnd, taskStart) + 1;

    if (startOffset < 0 || startOffset > totalDays) return null;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.max((duration / totalDays) * 100, 1)}%`,
    };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-400',
      in_progress: 'bg-blue-500',
      review: 'bg-purple-500',
      completed: 'bg-green-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  // Gerar marcadores de mês
  const monthMarkers = useMemo(() => {
    const markers: { label: string; position: number }[] = [];
    let currentMonth = startDate.getMonth();
    let currentYear = startDate.getFullYear();

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();
        markers.push({
          label: format(date, 'MMM yyyy', { locale: ptBR }),
          position: (i / totalDays) * 100,
        });
      }
    }

    return markers;
  }, [startDate, totalDays]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma tarefa encontrada para o período selecionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com timeline de datas */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex">
          <div className="w-64 flex-shrink-0 p-4 font-semibold border-r">
            {groupBy === 'project' ? 'Projeto / Tarefa' : groupBy === 'user' ? 'Responsável / Tarefa' : 'Tarefa'}
          </div>
          <div className="flex-1 relative h-16">
            {/* Marcadores de mês */}
            <div className="absolute inset-0 flex">
              {monthMarkers.map((marker, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 h-full border-l border-gray-300"
                  style={{ left: `${marker.position}%` }}
                >
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {marker.label}
                  </div>
                </div>
              ))}
            </div>
            {/* Grid de dias */}
            <div className="absolute inset-0 flex">
              {daysArray.map((day) => (
                <div
                  key={day}
                  className="flex-1 border-r border-gray-100"
                  style={{ minWidth: '20px' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grupos de tarefas */}
      {groupedTasks.map((group, groupIdx) => (
        <div key={groupIdx} className="border rounded-lg overflow-hidden">
          {/* Nome do grupo */}
          <div className="bg-muted/50 p-3 font-semibold border-b">
            {group.label}
            <Badge variant="outline" className="ml-2">
              {group.tasks.length} {group.tasks.length === 1 ? 'tarefa' : 'tarefas'}
            </Badge>
          </div>

          {/* Tarefas do grupo */}
          <div>
            {group.tasks.map((task) => {
              const position = getTaskPosition(task);

              return (
                <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/30">
                  {/* Nome da tarefa */}
                  <div className="w-64 flex-shrink-0 p-3 border-r">
                    <div className="flex items-start gap-2">
                      <Flag className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.assigned_user_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            <span className="truncate">{task.assigned_user_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline da tarefa */}
                  <div className="flex-1 relative p-3">
                    {/* Grid de fundo */}
                    <div className="absolute inset-0 flex">
                      {daysArray.map((day) => (
                        <div
                          key={day}
                          className="flex-1 border-r border-gray-100"
                          style={{ minWidth: '20px' }}
                        />
                      ))}
                    </div>

                    {/* Barra da tarefa */}
                    {position && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-6"
                        style={{
                          left: position.left,
                          width: position.width,
                        }}
                      >
                        <div
                          className={`h-full rounded ${getStatusColor(task.status)} hover:opacity-80 transition-opacity cursor-pointer relative group`}
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                            <Card className="w-64 shadow-lg">
                              <CardContent className="p-3 space-y-2">
                                <p className="font-semibold">{task.title}</p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between text-xs">
                                  <span>Progresso:</span>
                                  <Badge variant="outline">{task.progress}%</Badge>
                                </div>
                                {task.start_date && (
                                  <div className="text-xs text-muted-foreground">
                                    {format(parseISO(task.start_date), 'dd/MM/yyyy')} -{' '}
                                    {task.due_date && format(parseISO(task.due_date), 'dd/MM/yyyy')}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* Barra de progresso dentro da tarefa */}
                          <div
                            className="h-full bg-black/20 rounded-l"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
