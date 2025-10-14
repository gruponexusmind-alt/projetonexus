import { useState, useEffect } from 'react';
import { Plus, Calendar, Target, TrendingUp, X, MoreVertical, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  start_date: string;
  end_date: string;
  velocity_target?: number;
  closed: boolean;
  created_at: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  story_points?: number;
  sprint_id?: string;
}

interface Project {
  id: string;
  title: string;
  company_id?: string;
}

interface ProjectSprintsTabProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectSprintsTab({ project, onRefresh }: ProjectSprintsTabProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprintToDelete, setSprintToDelete] = useState<string | null>(null);
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
    velocity_target: 10
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSprints();
    fetchBacklogTasks();
  }, [project.id]);

  const fetchSprints = async () => {
    const { data, error } = await supabase
      .from('gp_sprints')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar sprints:', error);
      return;
    }

    // Para cada sprint, buscar as tarefas associadas (exceto concluídas)
    const sprintsWithTasks = await Promise.all(
      (data || []).map(async (sprint) => {
        const { data: tasks } = await supabase
          .from('gp_tasks')
          .select('id, title, status, story_points')
          .eq('sprint_id', sprint.id)
          .neq('status', 'completed');  // Não mostrar tarefas concluídas nos sprints

        return { ...sprint, tasks: tasks || [] };
      })
    );

    setSprints(sprintsWithTasks);
  };

  const fetchBacklogTasks = async () => {
    const { data, error } = await supabase
      .from('gp_tasks')
      .select('id, title, status, story_points, sprint_id')
      .eq('project_id', project.id)
      .is('sprint_id', null)
      .neq('status', 'completed');  // Não mostrar tarefas concluídas no backlog

    if (error) {
      console.error('Erro ao buscar backlog:', error);
      return;
    }

    setBacklogTasks(data || []);
    setLoading(false);
  };

  const createSprint = async () => {
    if (!newSprint.name || !newSprint.start_date || !newSprint.end_date) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('gp_sprints')
      .insert({
        project_id: project.id,
        company_id: project.company_id,
        name: newSprint.name,
        goal: newSprint.goal || null,
        start_date: newSprint.start_date,
        end_date: newSprint.end_date,
        velocity_target: newSprint.velocity_target
      });

    if (error) {
      console.error('Erro ao criar sprint:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o sprint.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Sprint criado com sucesso!',
    });

    setShowCreateModal(false);
    setNewSprint({
      name: '',
      goal: '',
      start_date: '',
      end_date: '',
      velocity_target: 10
    });
    fetchSprints();
  };

  const addTaskToSprint = async (taskId: string, sprintId: string) => {
    const { error } = await supabase
      .from('gp_tasks')
      .update({ sprint_id: sprintId })
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao adicionar tarefa ao sprint:', error);
      return;
    }

    fetchSprints();
    fetchBacklogTasks();
    toast({
      title: 'Sucesso',
      description: 'Tarefa adicionada ao sprint!',
    });
  };

  const removeTaskFromSprint = async (taskId: string) => {
    const { error } = await supabase
      .from('gp_tasks')
      .update({ sprint_id: null })
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao remover tarefa do sprint:', error);
      return;
    }

    fetchSprints();
    fetchBacklogTasks();
    toast({
      title: 'Sucesso',
      description: 'Tarefa removida do sprint!',
    });
  };

  const deleteSprint = async (sprintId: string) => {
    // Primeiro, remover sprint_id de todas as tarefas associadas
    const { error: updateError } = await supabase
      .from('gp_tasks')
      .update({ sprint_id: null })
      .eq('sprint_id', sprintId);

    if (updateError) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover tarefas do sprint.',
        variant: 'destructive',
      });
      return;
    }

    // Depois, excluir o sprint
    const { error } = await supabase
      .from('gp_sprints')
      .delete()
      .eq('id', sprintId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o sprint.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Sprint excluído com sucesso!',
    });

    fetchSprints();
    fetchBacklogTasks();
  };

  const openEditModal = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setShowEditModal(true);
  };

  const updateSprint = async () => {
    if (!editingSprint || !editingSprint.name || !editingSprint.start_date || !editingSprint.end_date) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('gp_sprints')
      .update({
        name: editingSprint.name,
        goal: editingSprint.goal,
        start_date: editingSprint.start_date,
        end_date: editingSprint.end_date,
        velocity_target: editingSprint.velocity_target,
        closed: editingSprint.closed
      })
      .eq('id', editingSprint.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o sprint.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Sprint atualizado com sucesso!',
    });

    setShowEditModal(false);
    setEditingSprint(null);
    fetchSprints();
  };

  const getSprintProgress = (sprint: Sprint) => {
    if (!sprint.tasks || sprint.tasks.length === 0) return 0;
    const completed = sprint.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / sprint.tasks.length) * 100);
  };

  const getSprintVelocity = (sprint: Sprint) => {
    if (!sprint.tasks) return 0;
    return sprint.tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.story_points || 0), 0);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Carregando sprints...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">Gerencie sprints e planning do projeto</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Sprint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Sprint *</Label>
                <Input
                  id="name"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  placeholder="Sprint 1"
                />
              </div>
              <div>
                <Label htmlFor="goal">Objetivo do Sprint</Label>
                <Textarea
                  id="goal"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  placeholder="Objetivo ou meta deste sprint..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newSprint.start_date}
                    onChange={(e) => setNewSprint({ ...newSprint, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Data de Fim *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newSprint.end_date}
                    onChange={(e) => setNewSprint({ ...newSprint, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="velocity_target">Meta de Velocity (Story Points)</Label>
                <Input
                  id="velocity_target"
                  type="number"
                  value={newSprint.velocity_target}
                  onChange={(e) => setNewSprint({ ...newSprint, velocity_target: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={createSprint}>
                  Criar Sprint
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Sprint Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sprint</DialogTitle>
          </DialogHeader>
          {editingSprint && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Nome do Sprint *</Label>
                <Input
                  id="edit_name"
                  value={editingSprint.name}
                  onChange={(e) => setEditingSprint({ ...editingSprint, name: e.target.value })}
                  placeholder="Sprint 1"
                />
              </div>
              <div>
                <Label htmlFor="edit_goal">Objetivo do Sprint</Label>
                <Textarea
                  id="edit_goal"
                  value={editingSprint.goal || ''}
                  onChange={(e) => setEditingSprint({ ...editingSprint, goal: e.target.value })}
                  placeholder="Objetivo ou meta deste sprint..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_start_date">Data de Início *</Label>
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={editingSprint.start_date}
                    onChange={(e) => setEditingSprint({ ...editingSprint, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_end_date">Data de Fim *</Label>
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={editingSprint.end_date}
                    onChange={(e) => setEditingSprint({ ...editingSprint, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_velocity_target">Meta de Velocity (Story Points)</Label>
                <Input
                  id="edit_velocity_target"
                  type="number"
                  value={editingSprint.velocity_target || 0}
                  onChange={(e) => setEditingSprint({ ...editingSprint, velocity_target: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={updateSprint}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sprints Grid */}
      <div className="grid gap-6">
        {sprints.map((sprint) => (
          <Card key={sprint.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {sprint.name}
                    <Badge variant={sprint.closed ? "secondary" : "default"} className={!sprint.closed ? "bg-green-500" : ""}>
                      {sprint.closed ? "Fechado" : "Ativo"}
                    </Badge>
                  </CardTitle>
                  {sprint.goal && (
                    <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openEditModal(sprint)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Sprint
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                            <span className="text-red-600">Excluir Sprint</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este sprint? Todas as tarefas serão movidas de volta para o backlog. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSprint(sprint.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Progresso: </span>
                    <span className="font-medium">{getSprintProgress(sprint)}%</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Velocity: </span>
                    <span className="font-medium">{getSprintVelocity(sprint)}/{sprint.velocity_target || 0}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tarefas: </span>
                    <span className="font-medium">{sprint.tasks?.length || 0}</span>
                  </div>
                </div>
              </div>
              <Progress value={getSprintProgress(sprint)} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Tarefas do Sprint:</h4>
                {sprint.tasks && sprint.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {sprint.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{task.title}</span>
                          <Badge variant="secondary" className={getStatusColor(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                          {task.story_points && (
                            <Badge variant="secondary">
                              {task.story_points} pts
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTaskFromSprint(task.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa neste sprint</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Backlog */}
      {backlogTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backlog (Tarefas sem Sprint)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backlogTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{task.title}</span>
                    <Badge variant="secondary" className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    {task.story_points && (
                      <Badge variant="secondary">
                        {task.story_points} pts
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {sprints.filter(s => !s.closed).map((sprint) => (
                      <Button
                        key={sprint.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addTaskToSprint(task.id, sprint.id)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        {sprint.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}