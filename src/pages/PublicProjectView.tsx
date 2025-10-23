import { useState } from 'react';
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
  Target,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PublicProjectCharts } from '@/components/public-project/PublicProjectCharts';
import { PublicProjectMeetings } from '@/components/public-project/PublicProjectMeetings';
import { PublicProjectExpectations } from '@/components/public-project/PublicProjectExpectations';
import { PublicProjectRisks } from '@/components/public-project/PublicProjectRisks';
import { PublicProjectClientTasks } from '@/components/public-project/PublicProjectClientTasks';
import { ClientFileUpload } from '@/components/public-project/ClientFileUpload';

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

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  meeting_type: 'internal' | 'client' | 'kickoff' | 'review';
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link: string | null;
}

interface Expectation {
  id: string;
  title: string;
  description: string | null;
  is_done: boolean;
  position: number;
}

interface Risk {
  id: string;
  title: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string | null;
  status: 'open' | 'monitoring' | 'mitigated' | 'closed';
}

interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [clientTasks, setClientTasks] = useState<ClientTask[]>([]);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Calculate actual project progress based on tasks
  const calculateProgress = (): number => {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

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
      console.log('🔍 [PublicProjectView] Sending validation request...');
      console.log('📧 [PublicProjectView] Email:', email.trim());
      console.log('🔑 [PublicProjectView] Token:', token?.substring(0, 20) + '...');

      // Usar supabase.functions.invoke que adiciona automaticamente o Authorization header
      const { data, error: invokeError } = await supabase.functions.invoke('validate-project-view', {
        body: { token, email: email.trim() },
      });

      console.log('📡 [PublicProjectView] Response received');

      if (invokeError) {
        console.error('❌ [PublicProjectView] Error response:', invokeError);
        throw new Error(invokeError.message || 'Erro ao validar acesso');
      }

      console.log('✅ [PublicProjectView] Data received:', data?.valid ? 'valid' : 'invalid');

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
      setMeetings(data.meetings || []);
      setExpectations(data.expectations || []);
      setRisks(data.risks || []);
      setClientTasks(data.clientTasks || []);
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
      <div className="space-y-8">
        {/* Hero Section - Clean White Design */}
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-8">
            {/* Title and Badges */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">{project.title}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">{project.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                  {project.status === 'completed' ? '✓ Concluído' :
                   project.status === 'in_progress' ? '● Em Andamento' :
                   project.status === 'on_hold' ? '⏸ Pausado' : '○ Pendente'}
                </Badge>
                <Badge variant="outline" className={`bg-white ${
                  project.priority === 'high' ? 'border-red-200 text-red-700 hover:bg-red-50' :
                  project.priority === 'medium' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' :
                  'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}>
                  {project.priority === 'high' ? '🔴 Alta' :
                   project.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'} Prioridade
                </Badge>
              </div>
            </div>

            {/* Progress Spotlight */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">Progresso do Projeto</span>
                </div>
                <span className="text-4xl font-bold text-blue-600">{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-4 bg-white" />
              <p className="text-sm text-gray-600 mt-3">
                {stats && stats.total > 0 ? (
                  <>
                    <span className="font-medium text-gray-900">{stats.completed} de {stats.total}</span> tarefas concluídas
                  </>
                ) : 'Aguardando início das tarefas'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics - Clean Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Prazo Final</p>
                  <p className="text-xl font-bold text-gray-900">
                    {project.deadline ? format(new Date(project.deadline), "dd/MM/yyyy") : 'Sem prazo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Taxa de Conclusão</p>
                  <p className="text-xl font-bold text-gray-900">{calculateProgress()}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Data de Início</p>
                  <p className="text-xl font-bold text-gray-900">
                    {project.start_date ? format(new Date(project.start_date), "dd/MM/yyyy") : 'Não definido'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Reorganized with Priority */}
        <Tabs defaultValue="client-tasks" className="w-full">
          <TabsList className="bg-white border w-full overflow-x-auto flex lg:grid lg:grid-cols-8 gap-1">
            <TabsTrigger value="client-tasks" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Suas Tarefas</TabsTrigger>
            <TabsTrigger value="overview" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Visão Geral</TabsTrigger>
            <TabsTrigger value="expectations" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Expectativas</TabsTrigger>
            <TabsTrigger value="meetings" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Reuniões</TabsTrigger>
            <TabsTrigger value="stages" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Etapas</TabsTrigger>
            <TabsTrigger value="risks" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Riscos</TabsTrigger>
            <TabsTrigger value="documents" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Documentos</TabsTrigger>
            <TabsTrigger value="updates" className="flex-shrink-0 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Atualizações</TabsTrigger>
          </TabsList>

          <TabsContent value="client-tasks" className="space-y-4 mt-6">
            <PublicProjectClientTasks clientTasks={clientTasks} />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Charts */}
            <PublicProjectCharts stats={stats} stages={stages} />

            {/* Task Statistics */}
            <Card className="bg-white border shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-gray-900">Estatísticas de Tarefas</CardTitle>
                <CardDescription className="text-gray-600">Progresso detalhado das atividades do projeto</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {stats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">Total</p>
                      </div>
                      <div className="text-center p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
                        <p className="text-3xl font-bold text-emerald-700">{stats.completed}</p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">Concluídas</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <p className="text-3xl font-bold text-blue-700">{stats.in_progress}</p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">Em Andamento</p>
                        <p className="text-xs text-blue-600 font-semibold mt-1">
                          {stats.total > 0 ? Math.round((stats.in_progress / stats.total) * 100) : 0}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                        <p className="text-3xl font-bold text-gray-700">{stats.pending}</p>
                        <p className="text-sm text-gray-600 mt-1 font-medium">Pendentes</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">
                          {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                        </p>
                      </div>
                    </div>

                    {/* Progress Summary */}
                    <div className="mt-6 p-5 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Resumo do Progresso
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {stats.completed > 0 && stats.completed === stats.total
                          ? '🎉 Todas as tarefas foram concluídas!'
                          : stats.in_progress > 0
                          ? `Atualmente trabalhando em ${stats.in_progress} tarefa${stats.in_progress > 1 ? 's' : ''}. `
                          : stats.pending > 0
                          ? `${stats.pending} tarefa${stats.pending > 1 ? 's' : ''} aguardando início. `
                          : 'Nenhuma tarefa em andamento no momento.'}
                        {stats.completed > 0 && stats.completed < stats.total &&
                          ` ${stats.completed} de ${stats.total} tarefa${stats.total > 1 ? 's' : ''} já ${stats.completed > 1 ? 'foram concluídas' : 'foi concluída'}.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhuma estatística disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expectations" className="mt-6">
            <PublicProjectExpectations expectations={expectations} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <PublicProjectMeetings meetings={meetings} />
          </TabsContent>

          <TabsContent value="stages" className="space-y-4 mt-6">
            <Card className="bg-white border shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="text-gray-900">Etapas do Projeto</CardTitle>
                <CardDescription className="text-gray-600">Acompanhe o progresso por etapa</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {stages.length > 0 ? (
                  <div className="space-y-3">
                    {stages.map((stage, index) => (
                      <div key={stage.id} className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        stage.completed_at ? 'bg-emerald-50 border-emerald-200' :
                        stage.is_current ? 'bg-blue-50 border-blue-300 shadow-sm' :
                        'bg-white border-gray-200'
                      }`}>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${
                          stage.completed_at ? 'bg-emerald-600 text-white' :
                          stage.is_current ? 'bg-blue-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {stage.completed_at ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{stage.name}</p>
                            {stage.is_current && (
                              <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                                ● Em Progresso
                              </Badge>
                            )}
                            {stage.completed_at && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                ✓ Concluída
                              </Badge>
                            )}
                          </div>
                          {stage.completed_at && (
                            <p className="text-sm text-gray-600 mt-1">
                              Finalizada em {format(new Date(stage.completed_at), "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhuma etapa cadastrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="mt-6">
            <PublicProjectRisks risks={risks} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-6">
            {/* Upload Section */}
            <ClientFileUpload token={token!} email={email} />

            {/* Shared Documents */}
            <Card className="bg-white border shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Documentos Compartilhados pela Equipe</CardTitle>
                    <CardDescription className="text-gray-600">Arquivos disponíveis para visualização</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(doc.size_bytes)} • {format(new Date(doc.created_at), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" disabled title="Download em breve" className="text-gray-500">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum documento compartilhado pela equipe</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updates" className="space-y-4 mt-6">
            <Card className="bg-white border shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900">Atualizações do Projeto</CardTitle>
                    <CardDescription className="text-gray-600">Últimos comentários e novidades da equipe</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="p-2 bg-blue-50 rounded-lg h-fit">
                          <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 leading-relaxed">{comment.content}</p>
                          <p className="text-sm text-gray-600 mt-2 font-medium">
                            {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhuma atualização disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PublicProjectLayout>
  );
}
