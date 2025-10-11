import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, User, Calendar, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateTaskModal } from './CreateTaskModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  assigned_to?: string;
  assignee?: {
    nome: string;
  };
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface ProjectKanbanProps {
  projectId: string;
  companyId: string;
}

const columns = [
  { id: 'pending', title: 'Pendente', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-100' },
  { id: 'review', title: 'Em Revisão', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Concluído', color: 'bg-green-100' },
];

export function ProjectKanban({ projectId, companyId }: ProjectKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<{ [taskId: string]: ChecklistItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchChecklists();
    fetchStages();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          estimated_hours,
          actual_hours,
          assigned_to,
          assignee:profiles(nome)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
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
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  const fetchChecklists = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_checklist_items')
        .select('id, title, completed, project_id')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;

      // Group checklist items by task (using project_id as task reference for now)
      const checklistsByTask: { [taskId: string]: ChecklistItem[] } = {};
      data?.forEach(item => {
        if (!checklistsByTask[item.project_id]) {
          checklistsByTask[item.project_id] = [];
        }
        checklistsByTask[item.project_id].push({
          id: item.id,
          title: item.title,
          completed: item.completed
        });
      });

      setChecklists(checklistsByTask);
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('gp_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      toast({
        title: 'Status atualizado!',
        description: 'O status da tarefa foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  const toggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('gp_checklist_items')
        .update({ completed: !completed })
        .eq('id', itemId);

      if (error) throw error;

      setChecklists(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(taskId => {
          updated[taskId] = updated[taskId].map(item =>
            item.id === itemId ? { ...item, completed: !completed } : item
          );
        });
        return updated;
      });
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o item.',
        variant: 'destructive',
      });
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando tarefas...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Quadro Kanban</h3>
        <CreateTaskModal projectId={projectId} companyId={companyId} onTaskCreated={fetchTasks}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </CreateTaskModal>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 h-full">
        {columns.map(column => {
          const columnTasks = tasks.filter(task => task.status === column.id);
          
          return (
            <div key={column.id} className="min-w-[300px] flex-shrink-0">
              <div className={`${column.color} rounded-lg p-3 mb-4`}>
                <h4 className="font-medium text-sm">
                  {column.title} ({columnTasks.length})
                </h4>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {columnTasks.map(task => {
                  const taskChecklist = checklists[projectId] || [];
                  const completedItems = taskChecklist.filter(item => item.completed).length;
                  const progress = taskChecklist.length > 0 ? (completedItems / taskChecklist.length) * 100 : 0;

                  return (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm">{task.title}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {columns.map(col => (
                                <DropdownMenuItem
                                  key={col.id}
                                  onClick={() => updateTaskStatus(task.id, col.id)}
                                  disabled={task.status === col.id}
                                >
                                  Mover para {col.title}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {task.description && (
                          <CardDescription className="text-xs line-clamp-2">
                            {task.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </div>

                        {task.assignee && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.assignee.nome}
                          </div>
                        )}

                        {task.due_date && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}

                        {taskChecklist.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-1" />
                            
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {taskChecklist.slice(0, 3).map(item => (
                                <div key={item.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={item.completed}
                                    onCheckedChange={() => toggleChecklistItem(item.id, item.completed)}
                                    className="h-3 w-3"
                                  />
                                  <span className={`text-xs ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.title}
                                  </span>
                                </div>
                              ))}
                              {taskChecklist.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{taskChecklist.length - 3} itens
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma tarefa nesta coluna
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}