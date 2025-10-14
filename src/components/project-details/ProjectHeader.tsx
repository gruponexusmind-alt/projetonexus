import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Upload, Edit, User, Calendar, BarChart3, List, Share2 } from 'lucide-react';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { DocumentDetailsModal } from '@/components/DocumentDetailsModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { ManageStagesModal } from '@/components/ManageStagesModal';
import { ShareProjectModal } from '@/components/ShareProjectModal';
import { ExportProjectPDFButton } from '@/components/ExportProjectPDFButton';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  deadline: string;
  budget: number;
  complexity: number;
  company_id: string;
  start_date: string | null;
  client: {
    name: string;
    email: string;
  };
}

interface ProjectStats {
  total: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
  progress_score: number;
}

interface Stage {
  id: string;
  name: string;
  order_index: number;
  is_current: boolean;
  completed_at: string | null;
}

interface ProjectHeaderProps {
  project: Project;
  stats: ProjectStats | null;
  onRefresh: () => void;
}

export function ProjectHeader({ project, stats, onRefresh }: ProjectHeaderProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);

  useEffect(() => {
    fetchStages();
  }, [project.id]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_project_stages')
        .select('*')
        .eq('project_id', project.id)
        .order('order_index');

      if (error) throw error;

      setStages(data || []);
      const current = (data || []).find((stage: Stage) => stage.is_current);
      setCurrentStage(current || null);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  const handleStagesUpdated = () => {
    fetchStages();
    onRefresh();
  };
  const getStatusColor = (status: string) => {
    const colors = {
      onboarding: 'bg-blue-500',
      development: 'bg-orange-500',
      testing: 'bg-purple-500',
      delivery: 'bg-green-500',
      completed: 'bg-gray-500',
      paused: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
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
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getDaysRemaining = () => {
    if (!project.deadline) return null;
    const deadline = new Date(project.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground max-w-2xl font-light">{project.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {getPriorityLabel(project.priority)}
            </Badge>

            {/* Current Custom Stage */}
            {currentStage ? (
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  currentStage.completed_at ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                {currentStage.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(project.status)}`} />
                {getStatusLabel(project.status)}
              </Badge>
            )}

            <Badge variant="outline" className="text-xs">
              Complexidade {project.complexity}/5
            </Badge>

            {/* Manage Stages Button */}
            <ManageStagesModal
              projectId={project.id}
              companyId={project.company_id}
              onStagesUpdated={handleStagesUpdated}
            >
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <List className="h-3 w-3 mr-1" />
                {currentStage ? 'Gerenciar Etapas' : 'Criar Etapas'}
              </Button>
            </ManageStagesModal>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CreateTaskModal
            projectId={project.id}
            companyId={project.company_id}
            onTaskCreated={onRefresh}
          >
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </CreateTaskModal>
          <DocumentDetailsModal
            projectId={project.id}
            companyId={project.company_id}
            onDocumentUploaded={onRefresh}
          >
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DocumentDetailsModal>
          <EditProjectModal project={project} onProjectUpdated={onRefresh}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </EditProjectModal>
          <ShareProjectModal projectId={project.id} projectTitle={project.title}>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </ShareProjectModal>
          <ExportProjectPDFButton
            projectId={project.id}
            companyId={project.company_id}
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-light text-muted-foreground">Progresso Geral</span>
          <span className="text-xl font-medium">{stats?.progress_score || project.progress}%</span>
        </div>
        <Progress value={stats?.progress_score || project.progress} className="h-1.5" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Cliente</p>
            <p className="text-base font-medium truncate">{project.client.name}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Prazo</p>
            <p className="text-base font-medium">
              {project.deadline ?
                new Date(project.deadline).toLocaleDateString('pt-BR') :
                'Não definido'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Dias Restantes</p>
            <p className={`text-base font-medium ${
              getDaysRemaining() !== null && getDaysRemaining()! < 0 ? 'text-red-500' :
              getDaysRemaining() !== null && getDaysRemaining()! <= 7 ? 'text-orange-500' :
              'text-green-500'
            }`}>
              {getDaysRemaining() !== null ? (
                getDaysRemaining()! < 0 ? `${Math.abs(getDaysRemaining()!)} dias atrasado` :
                getDaysRemaining() === 0 ? 'Hoje' :
                `${getDaysRemaining()} dias`
              ) : 'Não definido'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-light text-muted-foreground">Total de Tarefas</p>
            <p className="text-base font-medium">{stats?.total || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}