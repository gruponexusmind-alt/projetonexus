import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientLayout } from '@/components/client/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  FolderKanban,
  Calendar,
  TrendingUp,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string;
  created_at: string;
  client: {
    name: string;
  };
  currentStage?: {
    name: string;
    is_current: boolean;
  };
  stats?: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
  };
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      // Buscar projetos compartilhados com o cliente
      const { data: projectsData, error: projectsError } = await supabase
        .from('gp_projects')
        .select(`
          *,
          client:gp_clients!gp_projects_client_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Para cada projeto, buscar stage atual e stats
      const projectsWithDetails = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Buscar stage atual
          const { data: stagesData } = await supabase
            .from('gp_project_stages')
            .select('name, is_current')
            .eq('project_id', project.id)
            .eq('is_current', true)
            .single();

          // Buscar estatísticas das tarefas
          const { data: statsData } = await supabase
            .from('v_project_task_stats')
            .select('*')
            .eq('project_id', project.id)
            .single();

          return {
            ...project,
            currentStage: stagesData || undefined,
            stats: statsData || undefined,
          };
        })
      );

      setProjects(projectsWithDetails);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os projetos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      onboarding: 'Onboarding',
      strategy: 'Estratégia',
      development: 'Desenvolvimento',
      testing: 'Testes',
      delivery: 'Entrega',
      monitoring: 'Monitoramento',
      archived: 'Arquivado',
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      high: 'destructive',
      medium: 'warning',
      low: 'secondary',
    };
    return colorMap[priority] || 'secondary';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const isProjectDelayed = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <ClientLayout>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Nenhum Projeto Disponível</h3>
            <p className="text-center text-muted-foreground">
              Você ainda não tem acesso a nenhum projeto.
              <br />
              Entre em contato com nossa equipe para mais informações.
            </p>
          </CardContent>
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Projetos</h1>
          <p className="text-muted-foreground">
            Acompanhe o andamento dos seus projetos em tempo real
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-all hover:shadow-lg"
              onClick={() => navigate(`/client/project/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 text-lg">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {project.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{getStatusLabel(project.status)}</Badge>
                  {project.currentStage && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {project.currentStage.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Task Stats */}
                {project.stats && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">
                        {project.stats.completed} concluídas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">
                        {project.stats.in_progress} em andamento
                      </span>
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {project.deadline && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      isProjectDelayed(project.deadline)
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isProjectDelayed(project.deadline) ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )}
                    <span>
                      Prazo:{' '}
                      {formatDistanceToNow(new Date(project.deadline), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}

                {/* View Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/client/project/${project.id}`);
                  }}
                >
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
}
