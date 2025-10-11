import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Check, Tags, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TaskLabelsSelectorProps {
  taskId?: string;
  selectedLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function TaskLabelsSelector({ 
  taskId, 
  selectedLabels, 
  onLabelsChange, 
  disabled = false,
  compact = false
}: TaskLabelsSelectorProps) {
  const [open, setOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_labels')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableLabels(data || []);
    } catch (error) {
      console.error('Erro ao buscar labels:', error);
    }
  };

  const toggleLabel = (label: Label) => {
    const isSelected = selectedLabels.some(l => l.id === label.id);
    
    if (isSelected) {
      onLabelsChange(selectedLabels.filter(l => l.id !== label.id));
    } else {
      onLabelsChange([...selectedLabels, label]);
    }
  };

  const removeLabel = (labelId: string) => {
    onLabelsChange(selectedLabels.filter(l => l.id !== labelId));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {selectedLabels.slice(0, 2).map((label) => (
          <div
            key={label.id}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: label.color }}
            title={label.name}
          />
        ))}
        {selectedLabels.length > 2 && (
          <span className="text-xs text-muted-foreground">
            +{selectedLabels.length - 2}
          </span>
        )}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Tags className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <Command>
                <CommandInput placeholder="Buscar labels..." />
                <CommandEmpty>Nenhum label encontrado.</CommandEmpty>
                <CommandGroup>
                  {availableLabels.map((label) => (
                    <CommandItem
                      key={label.id}
                      onSelect={() => toggleLabel(label)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedLabels.some(l => l.id === label.id) 
                            ? "opacity-100" 
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected Labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              style={{ backgroundColor: `${label.color}20`, borderColor: label.color }}
              className="flex items-center gap-1 text-xs"
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: label.color }}
              />
              {label.name}
              {!disabled && (
                <button
                  onClick={() => removeLabel(label.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Label Selector */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-start h-8">
              <Tags className="h-3 w-3 mr-2" />
              {selectedLabels.length > 0 ? `${selectedLabels.length} labels` : 'Labels'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <Command>
              <CommandInput placeholder="Buscar labels..." />
              <CommandEmpty>Nenhum label encontrado.</CommandEmpty>
              <CommandGroup>
                {availableLabels.map((label) => (
                  <CommandItem
                    key={label.id}
                    onSelect={() => toggleLabel(label)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedLabels.some(l => l.id === label.id) 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}