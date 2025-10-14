import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TaskFiltersState } from '@/pages/Tasks';

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  companyId: string;
}

interface Project {
  id: string;
  title: string;
}

interface User {
  id: string;
  nome: string;
}

export function TaskFilters({ filters, onFiltersChange, companyId }: TaskFiltersProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    console.log('🔍 [TaskFilters] useEffect disparado', { companyId });
    if (companyId) {
      fetchProjects();
      fetchUsers();
    }
  }, [companyId]);

  const fetchProjects = async () => {
    if (!companyId) {
      console.warn('⚠️ [TaskFilters] Sem companyId, abortando fetch');
      return;
    }

    console.log('📡 [TaskFilters] Buscando projetos...');
    const { data, error } = await supabase
      .from('gp_projects')
      .select('id, title')
      .eq('company_id', companyId)
      .order('title');

    if (error) {
      console.error('❌ [TaskFilters] Erro ao buscar projetos:', error);
      return;
    }

    console.log('✅ [TaskFilters] Projetos carregados:', data?.length || 0);
    if (data) setProjects(data);
  };

  const fetchUsers = async () => {
    if (!companyId) {
      console.warn('⚠️ [TaskFilters] Sem companyId, abortando fetch');
      return;
    }

    console.log('📡 [TaskFilters] Buscando usuários...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('company_id', companyId)
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('❌ [TaskFilters] Erro ao buscar usuários:', error);
      return;
    }

    console.log('✅ [TaskFilters] Usuários carregados:', data?.length || 0);
    if (data) setUsers(data);
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      projectId: '',
      status: [],
      priority: [],
      assignedTo: '',
      clientExecution: false,
    });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const togglePriority = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriority });
  };

  const hasActiveFilters =
    filters.search ||
    filters.projectId ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.assignedTo ||
    filters.clientExecution;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-4">
        {/* Project Filter */}
        <Select
          value={filters.projectId || undefined}
          onValueChange={(value) => onFiltersChange({ ...filters, projectId: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os Projetos" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assigned To Filter */}
        <Select
          value={filters.assignedTo || undefined}
          onValueChange={(value) => onFiltersChange({ ...filters, assignedTo: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos Responsáveis" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <div className="flex gap-2">
          <Badge
            variant={filters.status.includes('pending') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleStatus('pending')}
          >
            Pendentes
          </Badge>
          <Badge
            variant={filters.status.includes('in_progress') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleStatus('in_progress')}
          >
            Em Progresso
          </Badge>
          <Badge
            variant={filters.status.includes('review') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleStatus('review')}
          >
            Em Revisão
          </Badge>
          <Badge
            variant={filters.status.includes('completed') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleStatus('completed')}
          >
            Concluídas
          </Badge>
        </div>

        {/* Priority Filter */}
        <div className="flex gap-2">
          <Badge
            variant={filters.priority.includes('high') ? 'destructive' : 'outline'}
            className="cursor-pointer"
            onClick={() => togglePriority('high')}
          >
            Alta
          </Badge>
          <Badge
            variant={filters.priority.includes('medium') ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => togglePriority('medium')}
          >
            Média
          </Badge>
          <Badge
            variant={filters.priority.includes('low') ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => togglePriority('low')}
          >
            Baixa
          </Badge>
        </div>

        {/* Client Execution Filter */}
        <div className="flex gap-2">
          <Badge
            variant={filters.clientExecution ? 'default' : 'outline'}
            className="cursor-pointer text-blue-600 border-blue-300"
            onClick={() => onFiltersChange({ ...filters, clientExecution: !filters.clientExecution })}
          >
            Cliente Executa
          </Badge>
        </div>
      </div>
    </div>
  );
}
