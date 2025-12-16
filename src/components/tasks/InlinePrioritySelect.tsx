import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { PriorityIcon, TaskPriority, PRIORITY_CONFIG, ALL_PRIORITIES } from './PriorityIcon';
import { cn } from '@/lib/utils';

interface InlinePrioritySelectProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function InlinePrioritySelect({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: InlinePrioritySelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (priority: TaskPriority) => {
    onChange(priority);
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
          title={PRIORITY_CONFIG[value].label}
        >
          <PriorityIcon priority={value} size={size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        <div className="space-y-0.5">
          {ALL_PRIORITIES.map((priority) => {
            const config = PRIORITY_CONFIG[priority];
            const Icon = config.icon;
            const isSelected = priority === value;

            return (
              <button
                key={priority}
                onClick={() => handleSelect(priority)}
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
                    {ALL_PRIORITIES.indexOf(priority)}
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
