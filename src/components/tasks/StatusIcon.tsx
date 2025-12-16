import { Circle, Clock, Eye, CheckCircle2, XCircle, Copy, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'canceled' | 'duplicate';

interface StatusIconProps {
  status: TaskStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  icon: typeof Circle;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  backlog: {
    label: 'Backlog',
    icon: CircleDashed,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  todo: {
    label: 'Todo',
    icon: Circle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
  },
  review: {
    label: 'In Review',
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-400',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
  },
  canceled: {
    label: 'Canceled',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
  },
  duplicate: {
    label: 'Duplicate',
    icon: Copy,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
};

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StatusIcon({ status, className, size = 'md' }: StatusIconProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Icon
      className={cn(
        sizeClasses[size],
        config.color,
        className
      )}
    />
  );
}

export function getStatusLabel(status: TaskStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

export function getStatusColor(status: TaskStatus): string {
  return STATUS_CONFIG[status]?.color || 'text-gray-500';
}

export function getStatusBgColor(status: TaskStatus): string {
  return STATUS_CONFIG[status]?.bgColor || 'bg-gray-100';
}

export const ALL_STATUSES: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
  'canceled',
  'duplicate',
];
