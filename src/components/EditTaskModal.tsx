import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskLabelsSelector } from '@/components/TaskLabelsSelector';
import { TaskDependenciesManager } from '@/components/TaskDependenciesManager';
import { TaskChecklistEditor } from '@/components/TaskChecklistEditor';
import { CalendarIcon, Edit, Save, Link2, Info, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  estimated_hours: z.number().min(0, 'Horas estimadas inválidas').max(999, 'Máximo 999 horas').optional(),
  due_date: z.date().optional(),
  stage_id: z.string().optional()
});

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  assigned_to?: string;
  project_id: string;
  company_id: string;
  stage_id?: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface EditTaskModalProps {
  task: Task;
  onTaskUpdated: () => void;
  children: React.ReactNode;
}

export function EditTaskModal({ task, onTaskUpdated, children }: EditTaskModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    estimated_hours: task.estimated_hours || '',
    start_date: task.start_date ? new Date(task.start_date) : undefined,
    due_date: task.due_date ? new Date(task.due_date) : undefined,
    assigned_to: task.assigned_to || 'unassigned',
    stage_id: task.stage_id || ''
  });
  const [profiles, setProfiles] = useState<Array<{id: string, nome: string}>>([]);
  const [stages, setStages] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTaskLabels();
      fetchProfiles();
      fetchStages();
    }
  }, [open, task.id]);

  const fetchTaskLabels = async () => {
    try {
      const { data } = await supabase
        .from('gp_task_labels')
        .select(`
          label:gp_labels(id, name, color)
        `)
        .eq('task_id', task.id);

      const labels = data?.map(item => item.label).filter(Boolean) || [];
      setSelectedLabels(labels as Label[]);
    } catch (error) {
      console.error('Erro ao buscar labels da tarefa:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('company_id', task.company_id)
        .eq('ativo', true);

      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchStages = async () => {
    try {
      const { data } = await supabase
        .from('gp_project_stages')
        .select('id, name')
        .eq('project_id', task.project_id)
        .order('order_index', { ascending: true });

      setStages(data || []);
    } catch (error) {
      console.error('Erro ao buscar etapas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar dados
      const validatedData = taskSchema.parse({
        ...formData,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined
      });

      setLoading(true);

      // Atualizar tarefa
      const { error: taskError } = await supabase
        .from('gp_tasks')
        .update({
          title: validatedData.title,
          description: validatedData.description || null,
          status: validatedData.status,
          priority: validatedData.priority,
          estimated_hours: validatedData.estimated_hours || null,
          start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : null,
          due_date: validatedData.due_date ? validatedData.due_date.toISOString().split('T')[0] : null,
          assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to,
          stage_id: formData.stage_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Atualizar labels
      await supabase
        .from('gp_task_labels')
        .delete()
        .eq('task_id', task.id);

      if (selectedLabels.length > 0) {
        const { error: labelsError } = await supabase
          .from('gp_task_labels')
          .insert(
            selectedLabels.map(label => ({
              task_id: task.id,
              label_id: label.id
            }))
          );

        if (labelsError) throw labelsError;
      }

      toast({
        title: 'Sucesso',
        description: 'Tarefa atualizada com sucesso.',
      });

      setOpen(false);
      onTaskUpdated();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a tarefa.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Tarefa
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da tarefa
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Checklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Digite o título da tarefa"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Digite a descrição da tarefa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Em Revisão</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável */}
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => handleChange('assigned_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Nenhum</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horas Estimadas */}
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                max="999"
                value={formData.estimated_hours}
                onChange={(e) => handleChange('estimated_hours', e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data de Início */}
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date
                      ? format(formData.start_date, "PPP", { locale: ptBR })
                      : "Selecionar data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => handleChange('start_date', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date
                      ? format(formData.due_date, "PPP", { locale: ptBR })
                      : "Selecionar data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => handleChange('due_date', date)}
                    disabled={(date) => formData.start_date && date < formData.start_date}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <TaskLabelsSelector
              taskId={task.id}
              selectedLabels={selectedLabels}
              onLabelsChange={setSelectedLabels}
            />
          </div>

          {/* Etapa do Projeto */}
          <div className="space-y-2">
            <Label>Etapa do Projeto</Label>
            <Select value={formData.stage_id || undefined} onValueChange={(value) => handleChange('stage_id', value === 'none' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dependências */}
          <div className="space-y-2">
            <Label>Dependências</Label>
            <TaskDependenciesManager
              taskId={task.id}
              projectId={task.project_id}
              companyId={task.company_id}
              onDependenciesUpdated={onTaskUpdated}
            >
              <Button type="button" variant="outline" className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Gerenciar Dependências
              </Button>
            </TaskDependenciesManager>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
            </form>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <TaskChecklistEditor
              taskId={task.id}
              companyId={task.company_id}
              onUpdate={onTaskUpdated}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}