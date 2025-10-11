import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Check, Plus, Tags, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface ProjectLabelsSelectorProps {
  projectId?: string;
  selectedLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  disabled?: boolean;
}

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export function ProjectLabelsSelector({ 
  projectId, 
  selectedLabels, 
  onLabelsChange, 
  disabled = false 
}: ProjectLabelsSelectorProps) {
  const [open, setOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(defaultColors[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

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

  const createLabel = async () => {
    if (!newLabelName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('gp_labels')
        .insert({
          name: newLabelName.trim(),
          color: newLabelColor,
          company_id: '00000000-0000-0000-0000-000000000000' // Default company_id
        })
        .select()
        .single();

      if (error) throw error;

      setAvailableLabels(prev => [...prev, data]);
      onLabelsChange([...selectedLabels, data]);
      
      setNewLabelName('');
      setShowCreateForm(false);
      
      toast({
        title: 'Sucesso',
        description: 'Label criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar label:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o label.',
        variant: 'destructive',
      });
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

  return (
    <div className="space-y-2">
      {/* Selected Labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              style={{ backgroundColor: `${label.color}20`, borderColor: label.color }}
              className="flex items-center gap-1"
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
                  <X className="h-3 w-3" />
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
            <Button variant="outline" size="sm" className="justify-start">
              <Tags className="h-4 w-4 mr-2" />
              {selectedLabels.length > 0 ? `${selectedLabels.length} labels` : 'Adicionar labels'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <Command>
              <CommandInput placeholder="Buscar labels..." />
              <CommandEmpty>
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhum label encontrado.
                </div>
              </CommandEmpty>
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
              
              {/* Create New Label */}
              <div className="border-t p-2">
                {!showCreateForm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar novo label
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Nome do label..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {defaultColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewLabelColor(color)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2",
                              newLabelColor === color ? "border-foreground" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewLabelName('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={createLabel}
                          disabled={!newLabelName.trim()}
                        >
                          Criar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}