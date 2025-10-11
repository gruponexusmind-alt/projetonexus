import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientLayout } from '@/components/client/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  MessageSquare,
  Download,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string;
  start_date: string;
  created_at: string;
}

interface Stage {
  id: string;
  name: string;
  order_index: number;
  is_current: boolean;
  completed_at: string | null;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
  progress_score: number;
}

interface Document {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
}

export default function ClientProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Buscar projeto
      const { data: projectData, error: projectError } = await supabase
        .from('gp_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Buscar stages
      const { data: stagesData } = await supabase
        .from('gp_project_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      setStages(stagesData || []);

      // Buscar stats
      const { data: statsData } = await supabase
        .from('v_project_task_stats')
        .select('*')
        .eq('project_id', projectId)
        .single();

      setStats(statsData);

      // Buscar documentos
      const { data: documentsData } = await supabase
        .from('gp_project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      setDocuments(documentsData || []);

      // Buscar comentários não-internos
      const { data: commentsData } = await supabase
        .from('gp_comments')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_internal', false)
        .order('created_at', { ascending: false })
        .limit(10);

      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o projeto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      onboarding: 'Onboarding',
      strategy: 'Estratégia',
      development: 'Desenvolvimento',
      testing: 'Testes',
      delivery: 'Entrega',
      monitoring: 'Monitoramento',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ClientLayout>
    );
  }

  if (!project) {
    return (
      <ClientLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Projeto não encontrado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar este projeto
            </p>
            <Button className="mt-4" onClick={() => navigate('/client/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/client/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Project Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="mt-2 text-muted-foreground">{project.description}</p>
            </div>
            <Badge variant="outline" className="ml-4">
              {getStatusLabel(project.status)}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Progresso Geral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progress}%</div>
                <Progress value={project.progress} className="mt-2" />
              </CardContent>
            </Card>

            {stats && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Tarefas Totais</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Concluídas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div className="text-2xl font-bold">{stats.completed}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Em Andamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <div className="text-2xl font-bold">{stats.in_progress}</div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vis

ão Geral</TabsTrigger>
            <TabsTrigger value="stages">Etapas</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="updates">Atualizações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {project.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data de Início</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {project.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Prazo de Entrega</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stages Tab */}
          <TabsContent value="stages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Etapas</CardTitle>
                <CardDescription>Acompanhe o progresso pelas etapas do projeto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            stage.completed_at
                              ? 'bg-green-500'
                              : stage.is_current
                              ? 'bg-blue-500'
                              : 'bg-muted'
                          }`}
                        >
                          {stage.completed_at ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <div className="h-3 w-3 rounded-full bg-white" />
                          )}
                        </div>
                        {index < stages.length - 1 && (
                          <div className="h-12 w-0.5 bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{stage.name}</h4>
                          {stage.is_current && (
                            <Badge variant="secondary">Em Andamento</Badge>
                          )}
                        </div>
                        {stage.completed_at && (
                          <p className="text-sm text-muted-foreground">
                            Concluído em{' '}
                            {format(new Date(stage.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos do Projeto</CardTitle>
                <CardDescription>Arquivos disponíveis para download</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-12 w-12" />
                    <p>Nenhum documento disponível</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(doc.size_bytes)} •{' '}
                              {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atualizações Recentes</CardTitle>
                <CardDescription>Últimas comunicações da equipe</CardDescription>
              </CardHeader>
              <CardContent>
                {comments.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto mb-2 h-12 w-12" />
                    <p>Nenhuma atualização ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>
                            {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <p className="rounded-lg bg-muted p-4">{comment.content}</p>
                        <Separator />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
