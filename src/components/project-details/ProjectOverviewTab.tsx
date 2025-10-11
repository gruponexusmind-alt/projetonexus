import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { TaskProgressStats } from '@/components/TaskProgressStats';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ManageStagesModal } from '@/components/ManageStagesModal';
import { ManageExpectationsModal } from '@/components/ManageExpectationsModal';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  status: string;
  deadline: string;
  company_id: string;
}

interface ProjectStats {
  total: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
  progress_score: number;
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

interface Document {
  id: string;
  name: string;
  created_at: string;
}

interface ProjectOverviewTabProps {
  project: Project;
  stats: ProjectStats | null;
  onRefresh: () => void;
}

export function ProjectOverviewTab({ project, stats, onRefresh }: ProjectOverviewTabProps) {
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOverviewData();
  }, [project.id]);

  const fetchOverviewData = async () => {
    try {
      const [expectationsRes, stagesRes, documentsRes] = await Promise.all([
        supabase
          .from('gp_project_expectations')
          .select('*')
          .eq('project_id', project.id)
          .order('position'),
        supabase
          .from('gp_project_stages')
          .select('*')
          .eq('project_id', project.id)
          .order('order_index'),
        supabase
          .from('gp_project_documents')
          .select('id, name, created_at')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      setExpectations(expectationsRes.data || []);
      setStages(stagesRes.data || []);
      setRecentDocuments(documentsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar alguns dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpectation = async (expectationId: string, isDone: boolean) => {
    try {
      await supabase
        .from('gp_project_expectations')
        .update({ is_done: isDone })
        .eq('id', expectationId);

      setExpectations(prev => 
        prev.map(exp => 
          exp.id === expectationId ? { ...exp, is_done: isDone } : exp
        )
      );

      toast({
        title: 'Sucesso',
        description: 'Expectativa atualizada.',
      });
    } catch (error) {
      console.error('Erro ao atualizar expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a expectativa.',
        variant: 'destructive',
      });
    }
  };

  const getDaysUntilDeadline = () => {
    if (!project.deadline) return null;
    const deadline = new Date(project.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysUntilDeadline();

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Tarefas Pendentes</p>
            <p className="text-xl font-medium">{stats?.pending || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Em Progresso</p>
            <p className="text-xl font-medium">{stats?.in_progress || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Em Revisão</p>
            <p className="text-xl font-medium">{stats?.review || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Concluídas</p>
            <p className="text-xl font-medium">{stats?.completed || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Timeline/Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Etapas do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stages.length > 0 ? (
              stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    stage.completed_at ? 'bg-green-500' : 
                    stage.is_current ? 'bg-blue-500' : 
                    'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      stage.completed_at ? 'text-green-700' :
                      stage.is_current ? 'text-blue-700' :
                      'text-muted-foreground'
                    }`}>
                      {stage.name}
                    </p>
                    {stage.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Concluída em {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {stage.is_current && !stage.completed_at && (
                      <Badge variant="outline" className="text-xs mt-1">Atual</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma etapa definida</p>
                <ManageStagesModal 
                  projectId={project.id} 
                  companyId={project.company_id}
                  onStagesUpdated={onRefresh}
                >
                  <Button variant="outline" size="sm" className="mt-2">
                    Criar Etapas
                  </Button>
                </ManageStagesModal>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Expectations */}
        <Card>
          <CardHeader>
            <CardTitle>Expectativas do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expectations.length > 0 ? (
              expectations.map((expectation) => (
                <div key={expectation.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox
                    checked={expectation.is_done}
                    onCheckedChange={(checked) => 
                      toggleExpectation(expectation.id, !!checked)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium ${
                      expectation.is_done ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {expectation.title}
                    </p>
                    {expectation.description && (
                      <p className="text-xs text-muted-foreground">
                        {expectation.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma expectativa definida</p>
                <ManageExpectationsModal 
                  projectId={project.id} 
                  companyId={project.company_id}
                  onExpectationsUpdated={onRefresh}
                >
                  <Button variant="outline" size="sm" className="mt-2">
                    Adicionar Expectativas
                  </Button>
                </ManageExpectationsModal>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents and Deadline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Documentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocuments.length > 0 ? (
              <div className="space-y-2">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Ver Todos os Documentos
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum documento enviado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Prazo</CardTitle>
          </CardHeader>
          <CardContent>
            {project.deadline ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-light text-muted-foreground">Data de entrega</p>
                  <p className="text-base font-medium">
                    {new Date(project.deadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-light text-muted-foreground">Dias restantes</p>
                  <p className={`text-xl font-medium ${
                    daysRemaining !== null && daysRemaining < 0 ? 'text-red-500' :
                    daysRemaining !== null && daysRemaining <= 7 ? 'text-orange-500' :
                    'text-green-500'
                  }`}>
                    {daysRemaining !== null ? (
                      daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasado` :
                      daysRemaining === 0 ? 'Hoje' :
                      `${daysRemaining} dias`
                    ) : 'Não definido'}
                  </p>
                </div>

                <Progress
                  value={stats?.progress_score || 0}
                  className="h-1.5"
                />
                <p className="text-xs font-light text-muted-foreground">
                  Progresso atual: {stats?.progress_score || 0}%
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Prazo não definido</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Definir Prazo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Task Progress Analysis */}
        <TaskProgressStats projectId={project.id} />
      </div>
    </div>
  );
}