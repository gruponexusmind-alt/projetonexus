import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign,
  Users,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Resource {
  id: string;
  nome: string;
  email: string;
  tipo_contratacao: string;
  salario_base: number;
  status: string;
  setor_id?: string;
  cargo_id?: string;
  telefone?: string;
  weekly_capacity_hours?: number;
  hourly_rate?: number;
  skills?: string[];
}

interface ResourceFormData {
  nome: string;
  email: string;
  tipo_contratacao: 'clt' | 'pj' | 'freelancer';
  salario_base: string;
  telefone: string;
  weekly_capacity_hours: string;
  hourly_rate: string;
  skills: string;
}

const statusLabels = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  ferias: 'Férias',
  afastado: 'Afastado',
};

const statusColors = {
  ativo: 'default',
  inativo: 'secondary',
  ferias: 'outline',
  afastado: 'destructive',
} as const;

const contractTypes = {
  clt: 'CLT',
  pj: 'Pessoa Jurídica',
  freelancer: 'Freelancer',
};

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ResourceFormData>({
    nome: '',
    email: '',
    tipo_contratacao: 'clt',
    salario_base: '',
    telefone: '',
    weekly_capacity_hours: '40',
    hourly_rate: '',
    skills: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('nm_funcionarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar recursos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        nome: resource.nome,
        email: resource.email,
        tipo_contratacao: resource.tipo_contratacao as any,
        salario_base: resource.salario_base.toString(),
        telefone: resource.telefone || '',
        weekly_capacity_hours: (resource.weekly_capacity_hours || 40).toString(),
        hourly_rate: (resource.hourly_rate || 0).toString(),
        skills: (resource.skills || []).join(', '),
      });
    } else {
      setEditingResource(null);
      setFormData({
        nome: '',
        email: '',
        tipo_contratacao: 'clt',
        salario_base: '',
        telefone: '',
        weekly_capacity_hours: '40',
        hourly_rate: '',
        skills: '',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const payload = {
        nome: formData.nome,
        email: formData.email,
        tipo_contratacao: formData.tipo_contratacao,
        salario_base: parseFloat(formData.salario_base) || 0,
        telefone: formData.telefone,
        weekly_capacity_hours: parseInt(formData.weekly_capacity_hours) || 40,
        hourly_rate: parseFloat(formData.hourly_rate) || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        status: 'ativo',
      };

      if (editingResource) {
        const { error } = await supabase
          .from('nm_funcionarios')
          .update(payload)
          .eq('id', editingResource.id);

        if (error) throw error;
        toast({
          title: 'Sucesso',
          description: 'Recurso atualizado com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('nm_funcionarios')
          .insert([{
            ...payload,
            documento: formData.email, // Temporary using email as document
            data_inicio: new Date().toISOString().split('T')[0]
          }]);

        if (error) throw error;
        toast({
          title: 'Sucesso',
          description: 'Recurso criado com sucesso',
        });
      }

      setModalOpen(false);
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar recurso',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este recurso?')) return;

    try {
      const { error } = await supabase
        .from('nm_funcionarios')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Recurso excluído com sucesso',
      });

      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir recurso',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (resourceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('nm_funcionarios')
        .update({ status: newStatus })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Recurso ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
      });

      loadResources();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            Recursos e Capacidade
          </h2>
          <p className="text-muted-foreground">
            Gerencie funcionários, capacidade e alocação de recursos
          </p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? 'Editar Recurso' : 'Adicionar Novo Recurso'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="funcionario@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_contratacao">Tipo de Contratação</Label>
                  <Select
                    value={formData.tipo_contratacao}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_contratacao: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salario_base">Salário Base (R$)</Label>
                  <Input
                    id="salario_base"
                    type="number"
                    step="0.01"
                    value={formData.salario_base}
                    onChange={(e) => setFormData(prev => ({ ...prev, salario_base: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekly_capacity_hours">Capacidade Semanal (h)</Label>
                  <Input
                    id="weekly_capacity_hours"
                    type="number"
                    min="1"
                    max="80"
                    value={formData.weekly_capacity_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekly_capacity_hours: e.target.value }))}
                    placeholder="40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Custo/Hora (R$) - Opcional</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Competências/Skills</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, TypeScript, Design, separados por vírgula"
                />
                <p className="text-xs text-muted-foreground">
                  Separe as competências por vírgula
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving || !formData.nome || !formData.email}
                >
                  {saving ? 'Salvando...' : (editingResource ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Recursos</p>
                <p className="text-2xl font-bold">{resources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Capacidade Total/Semana</p>
                <p className="text-2xl font-bold">
                  {resources.reduce((acc, r) => acc + (r.weekly_capacity_hours || 40), 0)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Recursos Ativos</p>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.status === 'ativo').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Recursos</CardTitle>
          <CardDescription>
            Gerencie todos os recursos da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{resource.nome}</h4>
                    <Badge variant={statusColors[resource.status as keyof typeof statusColors] || 'secondary'} className="text-xs">
                      {statusLabels[resource.status as keyof typeof statusLabels]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {contractTypes[resource.tipo_contratacao as keyof typeof contractTypes]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{resource.email}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {resource.weekly_capacity_hours || 40}h/semana
                    </div>
                    {resource.hourly_rate && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        R$ {resource.hourly_rate}/h
                      </div>
                    )}
                    {resource.skills && resource.skills.length > 0 && (
                      <div className="flex gap-1">
                        {resource.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {resource.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{resource.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenModal(resource)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(resource.id, resource.status)}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      {resource.status === 'ativo' ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(resource.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {resources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum recurso cadastrado</p>
                <p className="text-sm">Clique em "Adicionar Recurso" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}