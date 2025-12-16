import { useState, useEffect } from 'react';
import { Calendar, User, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InlineStatusSelect } from './InlineStatusSelect';
import { InlinePrioritySelect } from './InlinePrioritySelect';
import { TaskStatus } from './StatusIcon';
import { TaskPriority } from './PriorityIcon';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskAssignee {
  id: string;
  nome: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assigned_to?: string;
  assigned_user?: TaskAssignee;
  labels?: TaskLabel[];
  project_id: string;
  company_id: string;
}

interface TaskListRowProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onClick: (task: Task) => void;
}

export function TaskListRow({
  task,
  onStatusChange,
  onPriorityChange,
  onClick,
}: TaskListRowProps) {
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachmentInfo();
  }, [task.id]);

  const fetchAttachmentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_task_attachments')
        .select('id, file_path')
        .eq('task_id', task.id)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setAttachmentCount(data.length);

        // Get signed URL for thumbnail
        const { data: signedData } = await supabase.storage
          .from('task-attachments')
          .createSignedUrl(data[0].file_path, 3600);

        if (signedData) {
          setThumbnailUrl(signedData.signedUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching attachment info:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: date.toLocaleDateString('pt-BR'), isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Today', isOverdue: false };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', isOverdue: false };
    }
    return { text: date.toLocaleDateString('pt-BR'), isOverdue: false };
  };

  const dateInfo = formatDate(task.due_date);

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2 border-b border-border/40',
        'hover:bg-muted/50 transition-colors cursor-pointer'
      )}
      onClick={() => onClick(task)}
    >
      {/* Status Icon - clickable */}
      <div onClick={(e) => e.stopPropagation()}>
        <InlineStatusSelect
          value={task.status}
          onChange={(status) => onStatusChange(task.id, status)}
          size="sm"
        />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm font-medium truncate block',
          task.status === 'done' && 'line-through text-muted-foreground',
          task.status === 'canceled' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </span>
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.labels.slice(0, 2).map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className="text-xs px-1.5 py-0"
              style={{
                backgroundColor: `${label.color}20`,
                borderColor: label.color,
                color: label.color,
              }}
            >
              {label.name}
            </Badge>
          ))}
          {task.labels.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{task.labels.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="flex-shrink-0">
          <img
            src={thumbnailUrl}
            alt=""
            className="h-6 w-6 rounded object-cover"
          />
        </div>
      )}

      {/* Attachment indicator (if no thumbnail but has attachments) */}
      {!thumbnailUrl && attachmentCount > 0 && (
        <div className="flex items-center text-muted-foreground flex-shrink-0">
          <Paperclip className="h-3 w-3" />
        </div>
      )}

      {/* Priority - clickable */}
      <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
        <InlinePrioritySelect
          value={task.priority}
          onChange={(priority) => onPriorityChange(task.id, priority)}
          size="sm"
        />
      </div>

      {/* Assignee */}
      {task.assigned_user && (
        <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
          <User className="h-3 w-3" />
          <span className="text-xs max-w-[80px] truncate">
            {task.assigned_user.nome}
          </span>
        </div>
      )}

      {/* Due Date */}
      {dateInfo && (
        <div className={cn(
          'flex items-center gap-1 text-xs flex-shrink-0',
          dateInfo.isOverdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          <Calendar className="h-3 w-3" />
          <span>{dateInfo.text}</span>
        </div>
      )}
    </div>
  );
}
