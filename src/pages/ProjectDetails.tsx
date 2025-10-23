import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, Edit, BarChart3, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectHeader } from '@/components/project-details/ProjectHeader';
import { ProjectOverviewTab } from '@/components/project-details/ProjectOverviewTab';
import { ProjectTasksTab } from '@/components/project-details/ProjectTasksTab';
import { ProjectTimelineTab } from '@/components/project-details/ProjectTimelineTab';
import { ProjectDocumentsTab } from '@/components/project-details/ProjectDocumentsTab';
import { ProjectDetailsTab } from '@/components/project-details/ProjectDetailsTab';
import { ProjectSprintsTab } from '@/components/project-details/ProjectSprintsTab';
import { ProjectRisksTab } from '@/components/project-details/ProjectRisksTab';
import { ProjectResourcesTab } from '@/components/project-details/ProjectResourcesTab';
import { ProjectMeetingsTab } from '@/components/project-details/ProjectMeetingsTab';
import { ProjectCommunicationTab } from '@/components/project-details/ProjectCommunicationTab';

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
  start_date: string;
  company_id: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
}

interface ProjectStats {
  total: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
  progress_score: number;
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('gp_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch client data
      let clientData = null;
      if (projectData.client_id) {
        const { data: clientResponse } = await supabase
          .from('gp_clients')
          .select('id, name, email, phone')
          .eq('id', projectData.client_id)
          .single();

        if (clientResponse) {
          clientData = clientResponse;
        }
      }

      // Fetch project statistics
      const { data: statsData } = await supabase
        .from('v_project_task_stats')
        .select('*')
        .eq('project_id', projectId)
        .single();

      setProject({
        ...projectData,
        client: clientData || {
          id: '',
          name: 'Cliente não informado',
          email: '',
          phone: undefined,
        }
      });

      setStats(statsData || {
        total: 0,
        pending: 0,
        in_progress: 0,
        review: 0,
        completed: 0,
        progress_score: 0
      });

    } catch (error) {
      console.error('Erro ao buscar dados do projeto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  const handleBack = () => {
    navigate('/projects');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Projeto não encontrado</h1>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={project.title} 
        description={`Gerenciar projeto: ${project.description || 'Sem descrição'}`}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Projetos
        </Button>
      </PageHeader>
      
      <div className="p-6 space-y-6">

        {/* Project Header */}
        <ProjectHeader 
          project={project} 
          stats={stats}
          onRefresh={fetchProjectData}
        />

        {/* Project Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-auto w-full justify-start gap-6 bg-transparent border-b border-border/40 rounded-none p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="sprints"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Sprints
            </TabsTrigger>
            <TabsTrigger
              value="risks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Risks
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Resources
            </TabsTrigger>
            <TabsTrigger
              value="meetings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Reuniões
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Comunicação
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-light data-[state=active]:font-medium"
            >
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProjectOverviewTab 
              project={project} 
              stats={stats}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <ProjectTasksTab 
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ProjectTimelineTab 
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <ProjectDocumentsTab 
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="sprints" className="space-y-6">
            <ProjectSprintsTab 
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <ProjectRisksTab 
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <ProjectResourcesTab
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            <ProjectMeetingsTab
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <ProjectCommunicationTab
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <ProjectDetailsTab
              project={project}
              onRefresh={fetchProjectData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}