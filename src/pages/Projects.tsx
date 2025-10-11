import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, MoreVertical, Eye, Archive, Trash2, ArchiveRestore, Tags } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { EditProjectModal } from '@/components/EditProjectModal';
import { ProjectArchiveDialog } from '@/components/ProjectArchiveDialog';
import { ProjectDeleteDialog } from '@/components/ProjectDeleteDialog';

interface Label {
  id: string;
  name: string;
  color: string;
}

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
  start_date?: string;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  labels: Label[];
  created_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      // Query with optimized joins and real stats
      const query = supabase
        .from('gp_projects')
        .select(`
          *,
          client:gp_clients(name, email, phone),
          labels:gp_project_labels(
            label:gp_labels(id, name, color)
          ),
          stats:v_project_task_stats(
            total, pending, in_progress, review, completed, progress_score
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by archived status
      if (!showArchived) {
        query.neq('status', 'archived').neq('status', 'deleted');
      } else {
        query.eq('status', 'archived');
      }

      const { data: projectsData, error } = await query;
      if (error) throw error;

      // Transform the data
      const transformedProjects = (projectsData || []).map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        // Use real progress from stats or fallback to project progress
        progress: project.stats?.[0]?.progress_score || project.progress || 0,
        deadline: project.deadline || '',
        budget: project.budget || 0,
        complexity: project.complexity || 1,
        start_date: project.start_date,
        created_at: project.created_at,
        client: {
          name: project.client?.name || 'Cliente não informado',
          email: project.client?.email || '',
          phone: project.client?.phone || undefined
        },
        labels: project.labels?.map((l: any) => l.label).filter(Boolean) || []
      }));

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os projetos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [showArchived, toast]);

  const filterProjects = useCallback(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.labels.some(label =>
          label.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const handleProjectView = (projectId: string) => {
    window.location.href = `/projects/${projectId}`;
  };

  const handleArchive = (project: Project) => {
    setSelectedProject(project);
    setShowArchiveDialog(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
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
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projetos" 
        description="Gerencie todos os seus projetos em um só lugar"
      >
        <CreateProjectModal onProjectCreated={fetchProjects}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </CreateProjectModal>
      </PageHeader>
      
      <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por projeto, cliente ou label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('onboarding')}>
                Onboarding
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('development')}>
                Desenvolvimento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('testing')}>
                Testes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('delivery')}>
                Entrega
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                Concluído
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Prioridade
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                Alta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                Média
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                Baixa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="group cursor-pointer overflow-hidden"
            onClick={() => handleProjectView(project.id)}
          >
            <CardHeader className="space-y-3">
              {/* Header with Title and Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <CardTitle className="truncate">{project.title}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{project.client.name}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProjectView(project.id); }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <EditProjectModal
                      project={project}
                      onProjectUpdated={fetchProjects}
                    >
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Eye className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </EditProjectModal>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(project); }}>
                      {project.status === 'archived' ? (
                        <>
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Desarquivar
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleDelete(project); }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 font-light">
                  {project.description}
                </p>
              )}

              {/* Status and Priority Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {getStatusLabel(project.status)}
                </Badge>
                <Badge
                  variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {project.priority === 'low' && 'Baixa'}
                  {project.priority === 'medium' && 'Média'}
                  {project.priority === 'high' && 'Alta'}
                </Badge>
              </div>

              {/* Labels */}
              {project.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.labels.slice(0, 3).map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      style={{
                        backgroundColor: `${label.color}15`,
                        borderColor: `${label.color}40`,
                        color: label.color
                      }}
                      className="text-xs"
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {project.labels.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.labels.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-light">Progresso</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/40 pt-4">
                {project.deadline && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground font-light">Prazo</div>
                    <div className="font-medium">{new Date(project.deadline).toLocaleDateString('pt-BR')}</div>
                  </div>
                )}
                {project.budget > 0 && (
                  <div className="space-y-1">
                    <div className="text-muted-foreground font-light">Orçamento</div>
                    <div className="font-medium">R$ {project.budget.toLocaleString('pt-BR')}</div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-muted-foreground font-light">Complexidade</div>
                  <div className="font-medium">{project.complexity}/5</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showArchived ? 'Nenhum projeto arquivado encontrado.' : 'Nenhum projeto encontrado.'}
          </p>
        </div>
      )}

      </div>

      {/* Archive Dialog */}
      {selectedProject && (
        <ProjectArchiveDialog
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          isArchived={selectedProject.status === 'archived'}
          open={showArchiveDialog}
          onOpenChange={setShowArchiveDialog}
          onSuccess={fetchProjects}
        />
      )}

      {/* Delete Dialog */}
      {selectedProject && (
        <ProjectDeleteDialog
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onSuccess={fetchProjects}
        />
      )}
    </div>
  );
}