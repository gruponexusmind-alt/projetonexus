import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Users } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - replace with real data from your backend
const mockTasks = [
  {
    id: "1",
    title: "Implementar autenticação",
    description: "Sistema de login e registro de usuários",
    status: "pending" as const,
    priority: "high" as const,
    due_date: "2024-01-15",
    progress: 0,
    assignee: { nome: "João Silva" },
    project_id: "mock-project-id",
    company_id: "mock-company-id"
  },
  {
    id: "2", 
    title: "Design da homepage",
    description: "Criar layout responsivo da página inicial",
    status: "in_progress" as const,
    priority: "medium" as const,
    due_date: "2024-01-20",
    progress: 60,
    assignee: { nome: "Maria Santos" },
    project_id: "mock-project-id",
    company_id: "mock-company-id"
  },
  {
    id: "3",
    title: "Testes de integração",
    description: "Implementar testes automatizados",
    status: "review" as const,
    priority: "low" as const,
    progress: 85,
    assignee: { nome: "Pedro Costa" },
    project_id: "mock-project-id",
    company_id: "mock-company-id"
  },
  {
    id: "4",
    title: "Deploy em produção",
    description: "Configurar pipeline de deploy",
    status: "completed" as const,
    priority: "high" as const,
    progress: 100,
    assignee: { nome: "Ana Lima" },
    project_id: "mock-project-id",
    company_id: "mock-company-id"
  }
];

const mockChecklist = {
  "1": [
    { id: "c1", title: "Configurar Firebase Auth", is_done: false },
    { id: "c2", title: "Criar telas de login", is_done: true }
  ],
  "2": [
    { id: "c3", title: "Wireframe aprovado", is_done: true },
    { id: "c4", title: "Implementar header", is_done: true },
    { id: "c5", title: "Implementar footer", is_done: false }
  ]
};

export function ProjectBoard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  // Define columns
  const columns = [
    { id: 'pending', title: 'Pendente', status: 'pending' },
    { id: 'in_progress', title: 'Em Progresso', status: 'in_progress' },
    { id: 'review', title: 'Em Revisão', status: 'review' },
    { id: 'completed', title: 'Concluído', status: 'completed' }
  ];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return mockTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
      const matchesAssignee = selectedAssignee === "all" || task.assignee?.nome === selectedAssignee;
      
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [searchTerm, selectedPriority, selectedAssignee]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: { [key: string]: typeof mockTasks } = {};
    columns.forEach(col => {
      grouped[col.status] = filteredTasks.filter(task => task.status === col.status);
    });
    return grouped;
  }, [filteredTasks]);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    console.log('Change status:', taskId, newStatus);
    // Implement status change logic here
  };

  const handleChecklistToggle = (itemId: string, isCompleted: boolean) => {
    console.log('Toggle checklist:', itemId, isCompleted);
    // Implement checklist toggle logic here
  };

  // Get unique assignees for filter
  const assignees = Array.from(new Set(mockTasks.map(task => task.assignee?.nome).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Quadro do Projeto</h1>
              <p className="text-muted-foreground">Gerencie tarefas e acompanhe o progresso</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {assignees.map(assignee => (
                  <SelectItem key={assignee} value={assignee!}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="container mx-auto p-6">
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map(column => {
            const columnTasks = tasksByStatus[column.status] || [];
            
            return (
              <KanbanColumn
                key={column.id}
                title={column.title}
                status={column.status}
                count={columnTasks.length}
                tasks={columnTasks}
                checklistItems={mockChecklist}
                onStatusChange={handleStatusChange}
                onChecklistToggle={handleChecklistToggle}
                companyId="mock-company-id"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}