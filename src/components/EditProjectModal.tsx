import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProjectLabelsSelector } from './ProjectLabelsSelector';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['onboarding', 'development', 'testing', 'delivery', 'completed', 'paused', 'archived']),
  priority: z.enum(['low', 'medium', 'high']),
  budget: z.string().optional(),
  complexity: z.string().min(1, 'Complexidade é obrigatória'),
  start_date: z.date().optional(),
  deadline: z.date().optional(),
});

interface Label {
  id: string;
  name: string;
  color: string;
}

interface EditableProject {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  budget: number | null;
  complexity: number;
  start_date?: string | null;
  deadline?: string | null;
  labels?: Label[];
}

interface EditProjectModalProps {
  project: EditableProject;
  onProjectUpdated?: () => void;
  children: React.ReactNode;
}

const statusLabels = {
  onboarding: 'Onboarding',
  development: 'Desenvolvimento', 
  testing: 'Testes',
  delivery: 'Entrega',
  completed: 'Concluído',
  paused: 'Pausado',
  archived: 'Arquivado'
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

export function EditProjectModal({ project, onProjectUpdated, children }: EditProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>(project.labels || []);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project.title,
      description: project.description || '',
      status: project.status as any,
      priority: project.priority as any,
      budget: project.budget?.toString() || '',
      complexity: project.complexity?.toString() || '1',
      start_date: project.start_date ? new Date(project.start_date) : undefined,
      deadline: project.deadline ? new Date(project.deadline) : undefined,
    },
  });

  // Reset form when project changes
  useEffect(() => {
    form.reset({
      title: project.title,
      description: project.description || '',
      status: project.status as any,
      priority: project.priority as any,
      budget: project.budget?.toString() || '',
      complexity: project.complexity?.toString() || '1',
      start_date: project.start_date ? new Date(project.start_date) : undefined,
      deadline: project.deadline ? new Date(project.deadline) : undefined,
    });
    setSelectedLabels(project.labels || []);
  }, [project, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Update project
      const { error: projectError } = await supabase
        .from('gp_projects')
        .update({
          title: values.title,
          description: values.description,
          status: values.status,
          priority: values.priority,
          budget: values.budget ? parseFloat(values.budget) : null,
          complexity: parseInt(values.complexity),
          start_date: values.start_date?.toISOString().split('T')[0],
          deadline: values.deadline?.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (projectError) throw projectError;

      // Update labels
      // Delete existing labels
      await supabase
        .from('gp_project_labels')
        .delete()
        .eq('project_id', project.id);

      // Insert new labels
      if (selectedLabels.length > 0) {
        const { error: labelsError } = await supabase
          .from('gp_project_labels')
          .insert(
            selectedLabels.map(label => ({
              project_id: project.id,
              label_id: label.id
            }))
          );

        if (labelsError) throw labelsError;
      }

      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso.',
      });

      setOpen(false);
      onProjectUpdated?.();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
          <DialogDescription>
            Atualize as informações do projeto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Projeto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sistema de Gestão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o projeto..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 50000" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complexidade (1-5)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(level => (
                          <SelectItem key={level} value={level.toString()}>
                            {level} - {level === 1 ? 'Muito Simples' : 
                                       level === 2 ? 'Simples' :
                                       level === 3 ? 'Médio' :
                                       level === 4 ? 'Complexo' : 'Muito Complexo'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de Entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Labels Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Labels</label>
              <ProjectLabelsSelector
                projectId={project.id}
                selectedLabels={selectedLabels}
                onLabelsChange={setSelectedLabels}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}