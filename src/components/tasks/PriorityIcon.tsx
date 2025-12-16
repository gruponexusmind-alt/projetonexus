import { Minus, Signal, SignalLow, SignalMedium, SignalHigh, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

interface PriorityIconProps {
  priority: TaskPriority;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  icon: typeof Signal;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  none: {
    label: 'No priority',
    icon: Minus,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  low: {
    label: 'Low',
    icon: SignalLow,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
  },
  medium: {
    label: 'Medium',
    icon: SignalMedium,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
  },
  high: {
    label: 'High',
    icon: SignalHigh,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-400',
  },
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-400',
  },
};

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function PriorityIcon({ priority, className, size = 'md' }: PriorityIconProps) {
  const config = PRIORITY_CONFIG[priority];
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

export function getPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.label || priority;
}

export function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.color || 'text-gray-500';
}

export function getPriorityBgColor(priority: TaskPriority): string {
  return PRIORITY_CONFIG[priority]?.bgColor || 'bg-gray-100';
}

export const ALL_PRIORITIES: TaskPriority[] = [
  'none',
  'low',
  'medium',
  'high',
  'urgent',
];
