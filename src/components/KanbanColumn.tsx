import React from 'react';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress: number;
  assigned_to?: string;
  assignee?: { nome: string };
  project_id: string;
  company_id: string;
  labels?: Array<{ id: string; name: string; color: string; }>;
}

interface ChecklistItem {
  id: string;
  title: string;
  is_done: boolean;
}

interface KanbanColumnProps {
  title: string;
  status: string;
  count: number;
  tasks: Task[];
  checklistItems: { [taskId: string]: ChecklistItem[] };
  onStatusChange: (taskId: string, newStatus: string) => void;
  onChecklistToggle: (itemId: string, isCompleted: boolean) => void;
  onProgressUpdate?: () => void;
  onTaskEdit?: () => void;
  companyId: string;
}

export function KanbanColumn({ 
  title, 
  status, 
  count, 
  tasks, 
  checklistItems, 
  onStatusChange, 
  onChecklistToggle,
  onProgressUpdate,
  onTaskEdit,
  companyId
}: KanbanColumnProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-500',
      in_progress: 'bg-blue-500',
      review: 'bg-purple-500',
      completed: 'bg-green-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col h-full min-h-[600px] w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto px-1">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onChecklistToggle={onChecklistToggle}
            onProgressUpdate={onProgressUpdate}
            onTaskEdit={onTaskEdit}
            checklistItems={checklistItems[task.id] || []}
            companyId={companyId}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa</p>
          </div>
        )}
      </div>
    </div>
  );
}