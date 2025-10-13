import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicProjectLayout } from '@/components/PublicProjectLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  Download,
  TrendingUp,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectData {
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

interface Stats {
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
}

export default function PublicProjectView() {
  const { token } = useParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const handleValidate = async () => {
    if (!email.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe seu email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-project-view', {
        body: { token, email: email.trim() },
      });

      if (error) throw error;

      if (!data || !data.valid) {
        toast({
          title: data?.expired ? 'Link Expirado' : 'Acesso Negado',
          description: data?.error || 'Não foi possível validar o acesso.',
          variant: 'destructive',
        });
        return;
      }

      // Acesso validado
      setProject(data.project);
      setStages(data.stages);
      setStats(data.stats);
      setDocuments(data.documents);
      setComments(data.comments);
      setExpiresAt(data.expires_at);
      setValidated(true);

      toast({
        title: 'Acesso Concedido',
        description: 'Você pode visualizar o projeto agora.',
      });
    } catch (error: any) {
      console.error('Error validating access:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao validar acesso',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'on_hold': return 'secondary';
      default: return 'outline';
    }
  };

  if (!validated) {
    return (
      <PublicProjectLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Visualizar Projeto
              </CardTitle>
              <CardDescription>
                Digite seu email para acessar a visualização do projeto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleValidate();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Use o email que foi cadastrado no convite
                </p>
              </div>

              <Button
                onClick={handleValidate}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Acessar Projeto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicProjectLayout>
    );
  }

  if (!project) {
    return (
      <PublicProjectLayout expiresAt={expiresAt || undefined}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </PublicProjectLayout>
    );
  }

  return (
    <PublicProjectLayout expiresAt={expiresAt || undefined}>
      <div className="space-y-6">
        {/* Project Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={getStatusColor(project.status)}>
                {project.status === 'completed' ? 'Concluído' :
                 project.status === 'in_progress' ? 'Em Andamento' :
                 project.status === 'on_hold' ? 'Pausado' : 'Pendente'}
              </Badge>
              <Badge variant={getPriorityColor(project.priority)}>
                {project.priority === 'high' ? 'Alta' :
                 project.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso do Projeto</span>
              <span className="text-muted-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo</p>
                    <p className="text-lg font-semibold">
                      {project.deadline ? format(new Date(project.deadline), "dd/MM/yyyy") : 'Sem prazo'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conclusão</p>
                    <p className="text-lg font-semibold">{project.progress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-sky-500/10 p-3">
                    <Clock className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="text-lg font-semibold">
                      {project.start_date ? format(new Date(project.start_date), "dd/MM/yyyy") : 'Não definido'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="stages">Etapas</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="updates">Atualizações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Tarefas</CardTitle>
                <CardDescription>Progresso das atividades do projeto</CardDescription>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold text-primary">{stats.total}</p>
                        <p className="text-sm text-muted-foreground mt-1">Total</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
                        <p className="text-sm text-muted-foreground mt-1">Concluídas</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold text-sky-600">{stats.in_progress}</p>
                        <p className="text-sm text-muted-foreground mt-1">Em Andamento</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
                        <p className="text-sm text-muted-foreground mt-1">Pendentes</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma estatística disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Etapas do Projeto</CardTitle>
                <CardDescription>Progresso por etapa</CardDescription>
              </CardHeader>
              <CardContent>
                {stages.length > 0 ? (
                  <div className="space-y-4">
                    {stages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          stage.completed_at ? 'bg-emerald-100 text-emerald-600' :
                          stage.is_current ? 'bg-sky-100 text-sky-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {stage.completed_at ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{stage.name}</p>
                            {stage.is_current && <Badge variant="default">Atual</Badge>}
                            {stage.completed_at && <Badge variant="outline">Concluída</Badge>}
                          </div>
                          {stage.completed_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Concluída em {format(new Date(stage.completed_at), "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma etapa cadastrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Compartilhados</CardTitle>
                <CardDescription>Arquivos disponíveis para visualização</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.size_bytes)} • {format(new Date(doc.created_at), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" disabled>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum documento compartilhado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atualizações do Projeto</CardTitle>
                <CardDescription>Últimos comentários e novidades</CardDescription>
              </CardHeader>
              <CardContent>
                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-3 border rounded-lg">
                        <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma atualização disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PublicProjectLayout>
  );
}
