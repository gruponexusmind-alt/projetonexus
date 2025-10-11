import { useState, useEffect } from 'react';
import { Plus, Users, Clock, AlertTriangle, TrendingUp, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectResource {
  id: string;
  name: string;
  email?: string;
  role?: string;
  type: 'internal' | 'external';
  weekly_capacity_hours: number;
  hourly_rate?: number;
  user_id?: string;
  active: boolean;
  notes?: string;
  start_date?: string;
  end_date?: string;
  tasks_count?: number;
  tasks_completed?: number;
  total_estimated_hours?: number;
  total_logged_hours?: number;
  utilization_percentage?: number;
  is_overallocated?: boolean;
}

interface Project {
  id: string;
  title: string;
  company_id?: string;
}

interface ProjectResourcesTabProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectResourcesTab({ project, onRefresh }: ProjectResourcesTabProps) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    email: '',
    role: '',
    type: 'external' as 'internal' | 'external',
    weekly_capacity_hours: 40,
    hourly_rate: 0,
    user_id: '',
    active: true,
    notes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
    fetchAvailableUsers();
  }, [project.id]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('v_project_resources_detailed')
        .select('*')
        .eq('project_id', project.id)
        .order('active', { ascending: false })
        .order('name');

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Erro ao buscar recursos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os recursos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .eq('company_id', project.company_id)
        .eq('ativo', true);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const addResource = async () => {
    // Validações
    if (!newResource.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do recurso é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (newResource.type === 'internal' && !newResource.user_id) {
      toast({
        title: 'Erro',
        description: 'Para recursos internos, selecione um usuário do sistema.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar duplicatas
    if (newResource.user_id) {
      const exists = resources.find(r => r.user_id === newResource.user_id);
      if (exists) {
        toast({
          title: 'Erro',
          description: 'Este usuário já está alocado ao projeto.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const { error } = await supabase.from('gp_project_resources').insert({
        project_id: project.id,
        company_id: project.company_id,
        name: newResource.name.trim(),
        email: newResource.email.trim() || null,
        role: newResource.role.trim() || null,
        type: newResource.type,
        weekly_capacity_hours: newResource.weekly_capacity_hours,
        hourly_rate: newResource.hourly_rate > 0 ? newResource.hourly_rate : null,
        user_id: newResource.user_id || null,
        active: newResource.active,
        notes: newResource.notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Recurso adicionado com sucesso!',
      });

      setShowAddModal(false);
      resetNewResource();
      fetchResources();
      onRefresh();
    } catch (error) {
      console.error('Erro ao adicionar recurso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o recurso.',
        variant: 'destructive',
      });
    }
  };

  const updateResource = async (resourceId: string, updates: Partial<ProjectResource>) => {
    try {
      const { error } = await supabase
        .from('gp_project_resources')
        .update(updates)
        .eq('id', resourceId);

      if (error) throw error;

      fetchResources();
      toast({
        title: 'Sucesso',
        description: 'Recurso atualizado!',
      });
    } catch (error) {
      console.error('Erro ao atualizar recurso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o recurso.',
        variant: 'destructive',
      });
    }
  };

  const removeResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('gp_project_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      fetchResources();
      toast({
        title: 'Sucesso',
        description: 'Recurso removido do projeto!',
      });
    } catch (error) {
      console.error('Erro ao remover recurso:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o recurso.',
        variant: 'destructive',
      });
    }
  };

  const resetNewResource = () => {
    setNewResource({
      name: '',
      email: '',
      role: '',
      type: 'external',
      weekly_capacity_hours: 40,
      hourly_rate: 0,
      user_id: '',
      active: true,
      notes: '',
    });
  };

  const handleTypeChange = (type: 'internal' | 'external') => {
    setNewResource({
      ...newResource,
      type,
      user_id: '',
      name: '',
      email: '',
    });
  };

  const handleUserSelection = (userId: string) => {
    const user = availableUsers.find(u => u.user_id === userId);
    if (user) {
      setNewResource({
        ...newResource,
        user_id: userId,
        name: user.nome,
        email: user.email || '',
      });
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'text-red-600';
    if (percentage > 80) return 'text-orange-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBadgeVariant = (percentage: number): "default" | "destructive" | "secondary" => {
    if (percentage > 100) return 'destructive';
    if (percentage > 80) return 'secondary';
    return 'default';
  };

  // KPIs
  const totalCapacity = resources.reduce((sum, r) => sum + (r.active ? r.weekly_capacity_hours : 0), 0);
  const totalAllocated = resources.reduce((sum, r) => sum + (r.total_estimated_hours || 0), 0);
  const averageUtilization = resources.length > 0
    ? Math.round(resources.reduce((sum, r) => sum + (r.utilization_percentage || 0), 0) / resources.length)
    : 0;
  const overloadedResources = resources.filter(r => (r.utilization_percentage || 0) > 100).length;

  if (loading) {
    return <div className="p-8 text-center">Carregando recursos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recursos do Projeto</h2>
          <p className="text-muted-foreground">Gerencie membros internos e colaboradores externos</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Recurso ao Projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Tipo de Recurso */}
              <div>
                <Label>Tipo de Recurso</Label>
                <RadioGroup
                  value={newResource.type}
                  onValueChange={(value) => handleTypeChange(value as 'internal' | 'external')}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="internal" id="internal" />
                    <Label htmlFor="internal" className="cursor-pointer">
                      Membro da Equipe (Interno)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="external" id="external" />
                    <Label htmlFor="external" className="cursor-pointer">
                      Colaborador Externo/Freelancer
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Se for interno, selecionar usuário */}
              {newResource.type === 'internal' && (
                <div>
                  <Label htmlFor="user_id">Usuário do Sistema</Label>
                  <Select value={newResource.user_id} onValueChange={handleUserSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers
                        .filter(user => !resources.find(r => r.user_id === user.user_id))
                        .map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.nome} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Se for externo, ou se já selecionou usuário interno */}
              {(newResource.type === 'external' || newResource.user_id) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={newResource.name}
                        onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                        placeholder="Ex: João Silva"
                        disabled={newResource.type === 'internal' && !!newResource.user_id}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newResource.email}
                        onChange={(e) => setNewResource({ ...newResource, email: e.target.value })}
                        placeholder="email@exemplo.com"
                        disabled={newResource.type === 'internal' && !!newResource.user_id}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Função no Projeto</Label>
                      <Input
                        id="role"
                        value={newResource.role}
                        onChange={(e) => setNewResource({ ...newResource, role: e.target.value })}
                        placeholder="Ex: Desenvolvedor Frontend"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weekly_capacity_hours">Capacidade Semanal (horas)</Label>
                      <Input
                        id="weekly_capacity_hours"
                        type="number"
                        value={newResource.weekly_capacity_hours}
                        onChange={(e) => setNewResource({ ...newResource, weekly_capacity_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hourly_rate">Taxa por Hora (R$) - Opcional</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={newResource.hourly_rate}
                      onChange={(e) => setNewResource({ ...newResource, hourly_rate: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={newResource.notes}
                      onChange={(e) => setNewResource({ ...newResource, notes: e.target.value })}
                      placeholder="Informações adicionais sobre este recurso..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newResource.active}
                      onCheckedChange={(checked) => setNewResource({ ...newResource, active: checked })}
                    />
                    <Label htmlFor="active">Ativo no projeto</Label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setShowAddModal(false); resetNewResource(); }}>
                  Cancelar
                </Button>
                <Button onClick={addResource}>
                  Adicionar Recurso
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs de Recursos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidade Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}h</div>
            <p className="text-xs text-muted-foreground">por semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Alocadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalAllocated)}h</div>
            <p className="text-xs text-muted-foreground">estimadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilização Média</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUtilization}%</div>
            <p className="text-xs text-muted-foreground">da capacidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sobrecarga</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overloadedResources > 0 ? 'text-red-600' : ''}`}>
              {overloadedResources}
            </div>
            <p className="text-xs text-muted-foreground">recursos</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Recursos */}
      <div className="space-y-4">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {resource.name}
                      {resource.type === 'external' && (
                        <Badge variant="outline" className="text-xs">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Externo
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {resource.email}
                      {resource.role && ` • ${resource.role}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={resource.active ? "default" : "secondary"}>
                      {resource.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant={getUtilizationBadgeVariant(resource.utilization_percentage || 0)}>
                      {Math.round(resource.utilization_percentage || 0)}% utilização
                    </Badge>
                    {resource.is_overallocated && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Sobrecarga
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {resource.tasks_count || 0} tarefas
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {resource.tasks_completed || 0} concluídas
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Capacidade Semanal</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={resource.weekly_capacity_hours}
                      onChange={(e) => updateResource(resource.id, { weekly_capacity_hours: parseInt(e.target.value) || 0 })}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">horas</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Função</Label>
                  <Input
                    value={resource.role || ''}
                    onChange={(e) => updateResource(resource.id, { role: e.target.value })}
                    placeholder="Ex: Desenvolvedor"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={resource.active}
                      onCheckedChange={(checked) => updateResource(resource.id, { active: checked })}
                    />
                    <span className="text-sm">{resource.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Utilização</span>
                  <span className={`text-sm font-medium ${getUtilizationColor(resource.utilization_percentage || 0)}`}>
                    {Math.round(resource.total_estimated_hours || 0)}h / {resource.weekly_capacity_hours}h
                  </span>
                </div>
                <Progress
                  value={Math.min(resource.utilization_percentage || 0, 100)}
                  className="h-2"
                />
                {(resource.utilization_percentage || 0) > 100 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Sobrecarga de {Math.round((resource.utilization_percentage || 0) - 100)}%
                  </p>
                )}
              </div>

              {resource.notes && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <strong>Observações:</strong> {resource.notes}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeResource(resource.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover do Projeto
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {resources.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium text-lg mb-2">Nenhum recurso alocado</h3>
            <p className="text-muted-foreground mb-6">
              Adicione membros da equipe ou colaboradores externos para gerenciar capacidade e alocação.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Recurso
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
