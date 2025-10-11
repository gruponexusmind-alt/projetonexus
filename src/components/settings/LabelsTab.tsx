import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LabelItem {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#84cc16', '#06b6d4', '#f59e0b'
];

export function LabelsTab() {
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState<LabelItem | null>(null);
  const [deleteLabel, setDeleteLabel] = useState<LabelItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(defaultColors[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_labels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Erro ao buscar labels:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os labels.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
          company_id: '00000000-0000-0000-0000-000000000000'
        })
        .select()
        .single();

      if (error) throw error;

      setLabels(prev => [data, ...prev]);
      setNewLabelName('');
      setNewLabelColor(defaultColors[0]);
      setShowCreateDialog(false);

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

  const updateLabel = async () => {
    if (!editingLabel || !newLabelName.trim()) return;

    try {
      const { error } = await supabase
        .from('gp_labels')
        .update({
          name: newLabelName.trim(),
          color: newLabelColor
        })
        .eq('id', editingLabel.id);

      if (error) throw error;

      setLabels(prev => prev.map(label => 
        label.id === editingLabel.id 
          ? { ...label, name: newLabelName.trim(), color: newLabelColor }
          : label
      ));

      setEditingLabel(null);
      setNewLabelName('');
      setNewLabelColor(defaultColors[0]);

      toast({
        title: 'Sucesso',
        description: 'Label atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar label:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o label.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLabel = async () => {
    if (!deleteLabel) return;

    try {
      const { error } = await supabase
        .from('gp_labels')
        .delete()
        .eq('id', deleteLabel.id);

      if (error) throw error;

      setLabels(prev => prev.filter(label => label.id !== deleteLabel.id));
      setDeleteLabel(null);

      toast({
        title: 'Sucesso',
        description: 'Label excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir label:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o label.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (label: LabelItem) => {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setNewLabelColor(label.color);
  };

  const resetForm = () => {
    setNewLabelName('');
    setNewLabelColor(defaultColors[0]);
    setEditingLabel(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Labels</h2>
          <p className="text-muted-foreground">Gerencie labels para organizar projetos e tarefas</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Label
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Label</DialogTitle>
              <DialogDescription>
                Adicione um novo label para organizar seus projetos e tarefas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label-name">Nome</Label>
                <Input
                  id="label-name"
                  placeholder="Ex: Urgente, Cliente VIP..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        newLabelColor === color 
                          ? "border-foreground scale-110" 
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <Badge
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${newLabelColor}20`, 
                    borderColor: newLabelColor,
                    color: newLabelColor
                  }}
                  className="flex items-center gap-1 w-fit"
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: newLabelColor }}
                  />
                  {newLabelName || 'Nome do Label'}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={createLabel} disabled={!newLabelName.trim()}>
                Criar Label
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Labels Grid */}
      {labels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum Label Encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seus primeiros labels para organizar projetos e tarefas.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Label
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labels.map((label) => (
            <Card key={label.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${label.color}20`, 
                      borderColor: label.color,
                      color: label.color
                    }}
                    className="flex items-center gap-1"
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(label)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteLabel(label)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(label.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingLabel} onOpenChange={(open) => !open && setEditingLabel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Label</DialogTitle>
            <DialogDescription>
              Atualize as informações do label.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label-name">Nome</Label>
              <Input
                id="edit-label-name"
                placeholder="Ex: Urgente, Cliente VIP..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newLabelColor === color 
                        ? "border-foreground scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <Badge
                variant="secondary"
                style={{ 
                  backgroundColor: `${newLabelColor}20`, 
                  borderColor: newLabelColor,
                  color: newLabelColor
                }}
                className="flex items-center gap-1 w-fit"
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: newLabelColor }}
                />
                {newLabelName || 'Nome do Label'}
              </Badge>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setEditingLabel(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={updateLabel} disabled={!newLabelName.trim()}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLabel} onOpenChange={(open) => !open && setDeleteLabel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Label</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o label "{deleteLabel?.name}"? 
              Esta ação não pode ser desfeita e o label será removido de todos os projetos e tarefas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLabel} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}