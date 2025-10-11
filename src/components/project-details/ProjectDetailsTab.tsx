import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2,
  CheckCircle2,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  budget: number;
  complexity: number;
  start_date: string;
  deadline: string;
  company_id?: string;
  client: {
    id: string;
    name: string;
  };
}

interface Expectation {
  id: string;
  title: string;
  description: string;
  is_done: boolean;
  position: number;
}

interface Stage {
  id: string;
  name: string;
  order_index: number;
  is_current: boolean;
  completed_at: string | null;
}

interface ProjectDetailsTabProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectDetailsTab({ project, onRefresh }: ProjectDetailsTabProps) {
  const [editing, setEditing] = useState(false);
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [newExpectation, setNewExpectation] = useState({ title: '', description: '' });
  const [newStage, setNewStage] = useState('');
  const [formData, setFormData] = useState({
    title: project.title || '',
    description: project.description || '',
    status: project.status || 'onboarding',
    priority: project.priority || 'medium',
    budget: project.budget || 0,
    complexity: project.complexity || 1,
    start_date: project.start_date || '',
    deadline: project.deadline || ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectDetails();
  }, [project.id]);

  const fetchProjectDetails = async () => {
    try {
      const [expectationsRes, stagesRes] = await Promise.all([
        supabase
          .from('gp_project_expectations')
          .select('*')
          .eq('project_id', project.id)
          .order('position'),
        supabase
          .from('gp_project_stages')
          .select('*')
          .eq('project_id', project.id)
          .order('order_index')
      ]);

      setExpectations(expectationsRes.data || []);
      setStages(stagesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('gp_projects')
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          budget: formData.budget,
          complexity: formData.complexity,
          start_date: formData.start_date,
          deadline: formData.deadline
        })
        .eq('id', project.id);

      if (error) throw error;

      setEditing(false);
      onRefresh();

      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'onboarding',
      priority: project.priority || 'medium',
      budget: project.budget || 0,
      complexity: project.complexity || 1,
      start_date: project.start_date || '',
      deadline: project.deadline || ''
    });
    setEditing(false);
  };

  const addExpectation = async () => {
    if (!newExpectation.title.trim()) return;

    try {
      const { error } = await supabase
        .from('gp_project_expectations')
        .insert({
          project_id: project.id,
          company_id: project.company_id, // Usar company_id do projeto
          title: newExpectation.title,
          description: newExpectation.description,
          position: expectations.length
        });

      if (error) throw error;

      setNewExpectation({ title: '', description: '' });
      fetchProjectDetails();

      toast({
        title: 'Sucesso',
        description: 'Expectativa adicionada.',
      });
    } catch (error) {
      console.error('Erro ao adicionar expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a expectativa.',
        variant: 'destructive',
      });
    }
  };

  const deleteExpectation = async (expectationId: string) => {
    try {
      const { error } = await supabase
        .from('gp_project_expectations')
        .delete()
        .eq('id', expectationId);

      if (error) throw error;

      setExpectations(prev => prev.filter(exp => exp.id !== expectationId));

      toast({
        title: 'Sucesso',
        description: 'Expectativa removida.',
      });
    } catch (error) {
      console.error('Erro ao remover expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a expectativa.',
        variant: 'destructive',
      });
    }
  };

  const addStage = async () => {
    if (!newStage.trim()) return;

    try {
      const { error } = await supabase
        .from('gp_project_stages')
        .insert({
          project_id: project.id,
          company_id: project.company_id, // Usar company_id do projeto
          name: newStage,
          order_index: stages.length
        });

      if (error) throw error;

      setNewStage('');
      fetchProjectDetails();

      toast({
        title: 'Sucesso',
        description: 'Etapa adicionada.',
      });
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a etapa.',
        variant: 'destructive',
      });
    }
  };

  const setCurrentStage = async (stageId: string) => {
    try {
      // Primeiro, remove is_current de todas as etapas
      await supabase
        .from('gp_project_stages')
        .update({ is_current: false })
        .eq('project_id', project.id);

      // Depois, define a etapa atual
      const { error } = await supabase
        .from('gp_project_stages')
        .update({ is_current: true })
        .eq('id', stageId);

      if (error) throw error;

      fetchProjectDetails();

      toast({
        title: 'Sucesso',
        description: 'Etapa atual atualizada.',
      });
    } catch (error) {
      console.error('Erro ao definir etapa atual:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a etapa atual.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Detalhes do Projeto</h2>
          <p className="text-muted-foreground">
            Gerencie metadados, expectativas e etapas do projeto
          </p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Projeto
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              {editing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              ) : (
                <p className="text-sm">{project.title}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              {editing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              ) : (
                <p className="text-sm">{project.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                {editing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="development">Desenvolvimento</SelectItem>
                      <SelectItem value="testing">Testes</SelectItem>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{project.status}</Badge>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Prioridade</label>
                {editing ? (
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{project.priority}</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Orçamento</label>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  />
                ) : (
                  <p className="text-sm">
                    {project.budget ? `R$ ${project.budget.toLocaleString()}` : 'Orçamento não informado'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Complexidade</label>
                {editing ? (
                  <Select
                    value={formData.complexity.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, complexity: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}/5</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{project.complexity}/5</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data de Início</label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'Não definida'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Prazo de Entrega</label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Cliente</label>
              <p className="text-sm">{project.client?.name || 'Cliente não informado'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Project Expectations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Expectativas do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {expectations.map((expectation) => (
                <div key={expectation.id} className="flex items-start gap-3 p-2 rounded-lg border">
                  <Checkbox
                    checked={expectation.is_done}
                    onCheckedChange={(checked) => {
                      // Handle expectation toggle
                    }}
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${expectation.is_done ? 'line-through text-muted-foreground' : ''}`}>
                      {expectation.title}
                    </p>
                    {expectation.description && (
                      <p className="text-xs text-muted-foreground">
                        {expectation.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExpectation(expectation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Título da expectativa"
                value={newExpectation.title}
                onChange={(e) => setNewExpectation(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newExpectation.description}
                onChange={(e) => setNewExpectation(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
              <Button onClick={addExpectation} size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Expectativa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Etapas do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`p-4 rounded-lg border ${
                  stage.is_current ? 'border-primary bg-primary/5' : 
                  stage.completed_at ? 'border-green-200 bg-green-50' :
                  'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{stage.name}</h4>
                  {stage.is_current && (
                    <Badge variant="default" className="text-xs">Atual</Badge>
                  )}
                  {stage.completed_at && (
                    <Badge variant="outline" className="text-xs bg-green-100">Concluída</Badge>
                  )}
                </div>
                
                {stage.completed_at && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Concluída em {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                  </p>
                )}

                {!stage.completed_at && !stage.is_current && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentStage(stage.id)}
                    className="w-full"
                  >
                    Definir como Atual
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova etapa"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
            />
            <Button onClick={addStage}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Arquivar Projeto</h4>
              <p className="text-sm text-muted-foreground">
                O projeto será movido para o arquivo e ficará somente leitura.
              </p>
            </div>
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
              Arquivar
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-red-600">Excluir Projeto</h4>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. Todos os dados serão perdidos.
              </p>
            </div>
            <Button variant="destructive">
              Excluir Projeto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}