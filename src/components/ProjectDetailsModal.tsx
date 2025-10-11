import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectKanban } from './ProjectKanban';
import { ProjectGantt } from './ProjectGantt';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  TrendingUp,
  BarChart3,
  Calendar as CalendarIcon,
  Kanban
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string;
  budget: number;
  company_id: string;
  complexity: number;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
}

interface ProjectDetailsModalProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailsModal({ projectId, open, onOpenChange }: ProjectDetailsModalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && open) {
      fetchProjectDetails();
    }
  }, [projectId, open]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // First get the project
      const { data: projectData, error: projectError } = await supabase
        .from('gp_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Then get the client data separately
      let clientData = null;
      if (projectData.client_id) {
        const { data: clientResponse, error: clientError } = await supabase
          .from('nm_clientes')
          .select('nome, email, telefone')
          .eq('id', projectData.client_id)
          .single();
        
        if (!clientError) {
          clientData = clientResponse;
        }
      }

      setProject({
        ...projectData,
        client: {
          name: clientData?.nome || 'Cliente não informado',
          email: clientData?.email || '',
          phone: clientData?.telefone || undefined,
        }
      });
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      onboarding: 'Onboarding',
      development: 'Desenvolvimento',
      testing: 'Testes',
      delivery: 'Entrega',
      completed: 'Concluído',
      paused: 'Pausado'
    };
    return labels[status as keyof typeof labels] || status;
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
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  if (!project && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project?.title || 'Carregando...'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando detalhes do projeto...</div>
          </div>
        ) : project ? (
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Cronograma
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-6">
              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(project.priority)}>
                      {getPriorityLabel(project.priority)}
                    </Badge>
                    <Badge variant="outline">
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Progresso</div>
                  <div className="text-2xl font-bold">{project.progress}%</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={project.progress} className="h-3" />
              </div>

              {/* Project Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{project.client.name}</div>
                    <p className="text-xs text-muted-foreground">{project.client.email}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prazo</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {project.deadline ? 
                        new Date(project.deadline).toLocaleDateString('pt-BR') : 
                        'Não definido'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.deadline && new Date(project.deadline) > new Date() ? 
                        `${Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes` :
                        project.deadline ? 'Prazo vencido' : ''
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {project.budget ? `R$ ${project.budget.toLocaleString()}` : 'Não informado'}
                    </div>
                    <p className="text-xs text-muted-foreground">Valor total do projeto</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Complexidade</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">{project.complexity}/5</div>
                    <p className="text-xs text-muted-foreground">Nível de complexidade</p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timeline do Projeto
                  </CardTitle>
                  <CardDescription>Principais marcos e fases do projeto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Onboarding', 'Desenvolvimento', 'Testes', 'Entrega', 'Acompanhamento'].map((phase, index) => (
                      <div key={phase} className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          index < (['onboarding', 'development', 'testing', 'delivery', 'completed'].indexOf(project.status) + 1) 
                            ? 'bg-primary' 
                            : 'bg-muted'
                        }`} />
                        <span className={
                          index < (['onboarding', 'development', 'testing', 'delivery', 'completed'].indexOf(project.status) + 1)
                            ? 'font-medium' 
                            : 'text-muted-foreground'
                        }>
                          {phase}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kanban" className="flex-1">
              <ProjectKanban projectId={project.id} companyId={project.company_id} />
            </TabsContent>

            <TabsContent value="gantt" className="flex-1">
              <ProjectGantt projectId={project.id} />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}