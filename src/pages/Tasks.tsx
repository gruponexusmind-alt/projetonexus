import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TaskTable } from '@/components/TaskTable';
import { TaskFilters } from '@/components/TaskFilters';
import { CreateGlobalTaskModal } from '@/components/CreateGlobalTaskModal';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  progress: number;
  assigned_to: string | null;
  project_id: string;
  company_id: string;
  created_at: string;
  client_execution: boolean;
  project?: {
    id: string;
    title: string;
  };
  assigned_user?: {
    id: string;
    nome: string;
  };
}

export interface TaskFiltersState {
  search: string;
  projectId: string;
  status: string[];
  priority: string[];
  assignedTo: string;
  clientExecution: boolean;
  overdue?: boolean;
  blocked?: boolean;
}

export default function Tasks() {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFiltersState>({
    search: '',
    projectId: '',
    status: [],
    priority: [],
    assignedTo: '',
    clientExecution: false,
  });

  // Aplicar filtros vindos da navegação
  useEffect(() => {
    if (location.state?.filters) {
      console.log('🔍 [Tasks] Aplicando filtros da navegação:', location.state.filters);
      setFilters(prev => ({ ...prev, ...location.state.filters }));
    }
  }, [location.state]);

  useEffect(() => {
    console.log('🔍 [Tasks] useEffect disparado', {
      authLoading,
      hasProfile: !!profile,
      companyId: profile?.company_id
    });

    if (!authLoading && profile?.company_id) {
      fetchTasks();
    }
  }, [authLoading, profile?.company_id]);

  const fetchTasks = async () => {
    console.log('🔄 [Tasks] fetchTasks chamado', {
      hasProfile: !!profile,
      companyId: profile?.company_id
    });

    if (!profile?.company_id) {
      console.warn('⚠️ [Tasks] Sem company_id, abortando fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📡 [Tasks] Executando query no Supabase...');

      const { data, error } = await supabase
        .from('gp_tasks')
        .select(`
          *,
          project:gp_projects(id, title),
          assigned_user:profiles!gp_tasks_assigned_to_fkey(id, nome)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [Tasks] Erro na query:', error);
        throw error;
      }

      console.log('✅ [Tasks] Dados recebidos:', {
        count: data?.length || 0,
        data: data
      });

      setTasks(data as Task[]);
    } catch (error) {
      console.error('💥 [Tasks] Erro ao carregar tarefas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as tarefas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Project filter
    if (filters.projectId && task.project_id !== filters.projectId) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }

    // Assigned to filter
    if (filters.assignedTo && task.assigned_to !== filters.assignedTo) {
      return false;
    }

    // Client execution filter
    if (filters.clientExecution && !task.client_execution) {
      return false;
    }

    // Overdue filter
    if (filters.overdue) {
      const now = new Date();
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      if (!dueDate || dueDate >= now || task.status === 'completed') {
        return false;
      }
    }

    // Blocked filter
    if (filters.blocked && !(task as any).blocked) {
      return false;
    }

    return true;
  });

  // Estado de loading da autenticação
  if (authLoading) {
    console.log('⏳ [Tasks] Aguardando autenticação...');
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tarefas"
          description="Carregando..."
        />
        <div className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Carregando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se tem profile e company_id
  if (!profile || !profile.company_id) {
    console.error('❌ [Tasks] Erro: Profile inválido', { profile });
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tarefas"
          description="Erro de autenticação"
        />
        <div className="p-6">
          <div className="text-center text-destructive">
            <p className="font-semibold">Erro: Usuário sem company_id</p>
            <p className="text-sm mt-2">Profile: {JSON.stringify(profile, null, 2)}</p>
            <p className="text-sm mt-2">Por favor, entre em contato com o administrador.</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ [Tasks] Renderizando página normalmente');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Visualize e gerencie todas as tarefas dos seus projetos"
      >
        <CreateGlobalTaskModal onTaskCreated={fetchTasks}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </CreateGlobalTaskModal>
      </PageHeader>

      <div className="p-6 space-y-6">
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          companyId={profile.company_id}
        />

        <TaskTable
          tasks={filteredTasks}
          loading={loading}
          onRefresh={fetchTasks}
        />
      </div>
    </div>
  );
}
