import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { StatusIcon, TaskStatus, STATUS_CONFIG, ALL_STATUSES } from './StatusIcon';
import { cn } from '@/lib/utils';

interface InlineStatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineStatusSelect({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: InlineStatusSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (status: TaskStatus) => {
    onChange(status);
    setOpen(false);
  };

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className={cn(
            buttonSizeClasses[size],
            'p-0 hover:bg-muted/80 transition-colors'
          )}
          title={STATUS_CONFIG[value].label}
        >
          <StatusIcon status={value} size={size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-0.5">
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            const isSelected = status === value;

            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
                  'hover:bg-muted/80',
                  isSelected && 'bg-muted'
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
                <span className="flex-1 text-left">{config.label}</span>
                {isSelected && (
                  <span className="text-xs text-muted-foreground">
                    {ALL_STATUSES.indexOf(status) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
