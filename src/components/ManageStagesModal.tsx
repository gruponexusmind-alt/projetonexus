import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, CheckCircle2, RotateCcw } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Stage {
  id: string;
  name: string;
  order_index: number;
  is_current: boolean;
  completed_at: string | null;
}

interface ManageStagesModalProps {
  projectId: string;
  companyId: string;
  onStagesUpdated?: () => void;
  children: React.ReactNode;
}

export function ManageStagesModal({ projectId, companyId, onStagesUpdated, children }: ManageStagesModalProps) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchStages();
    }
  }, [open, projectId]);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_project_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as etapas.',
        variant: 'destructive',
      });
    }
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_stages')
        .insert({
          project_id: projectId,
          company_id: companyId,
          name: newStageName.trim(),
          order_index: stages.length,
          is_current: stages.length === 0 // First stage is current
        });

      if (error) throw error;

      setNewStageName('');
      await fetchStages();
      
      toast({
        title: 'Sucesso',
        description: 'Etapa adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a etapa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (stageId: string, name: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_stages')
        .update({ name: name.trim() })
        .eq('id', stageId);

      if (error) throw error;

      await fetchStages();
      setEditingId(null);
      setEditingName('');
      
      toast({
        title: 'Sucesso',
        description: 'Etapa atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a etapa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (stageId: string) => {
    setStageToDelete(stageId);
    setDeleteDialogOpen(true);
  };

  const deleteStage = async () => {
    if (!stageToDelete) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_stages')
        .delete()
        .eq('id', stageToDelete);

      if (error) throw error;

      await fetchStages();

      toast({
        title: 'Sucesso',
        description: 'Etapa removida com sucesso.',
      });

      setDeleteDialogOpen(false);
      setStageToDelete(null);
    } catch (error) {
      console.error('Erro ao remover etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a etapa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCurrent = async (stageId: string) => {
    setLoading(true);
    try {
      // First, unmark all stages as current
      await supabase
        .from('gp_project_stages')
        .update({ is_current: false })
        .eq('project_id', projectId);

      // Then mark the selected stage as current
      const { error } = await supabase
        .from('gp_project_stages')
        .update({ is_current: true })
        .eq('id', stageId);

      if (error) throw error;

      await fetchStages();
      
      toast({
        title: 'Sucesso',
        description: 'Etapa atual atualizada.',
      });
    } catch (error) {
      console.error('Erro ao marcar etapa como atual:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a etapa atual.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (stageId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_stages')
        .update({
          completed_at: new Date().toISOString(),
          is_current: false
        })
        .eq('id', stageId);

      if (error) throw error;

      await fetchStages();

      toast({
        title: 'Sucesso',
        description: 'Etapa marcada como concluída.',
      });
    } catch (error) {
      console.error('Erro ao concluir etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a etapa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const reopenStage = async (stageId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_stages')
        .update({
          completed_at: null,
          is_current: false
        })
        .eq('id', stageId);

      if (error) throw error;

      await fetchStages();

      toast({
        title: 'Sucesso',
        description: 'Etapa reaberta com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao reabrir etapa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reabrir a etapa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (stage: Stage) => {
    setEditingId(stage.id);
    setEditingName(stage.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        onStagesUpdated?.();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Etapas do Projeto</DialogTitle>
          <DialogDescription>
            Organize as etapas do seu projeto e acompanhe o progresso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new stage */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova etapa..."
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addStage();
                }
              }}
            />
            <Button 
              onClick={addStage} 
              disabled={loading || !newStageName.trim()}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {/* Stages list */}
          <div className="space-y-3">
            {stages.length > 0 ? (
              stages.map((stage, index) => (
                <Card key={stage.id} className={`transition-all ${
                  stage.is_current ? 'border-blue-500 bg-blue-50' :
                  stage.completed_at ? 'border-green-500 bg-green-50' :
                  'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      
                      <div className={`w-3 h-3 rounded-full ${
                        stage.completed_at ? 'bg-green-500' : 
                        stage.is_current ? 'bg-blue-500' : 
                        'bg-gray-300'
                      }`} />

                      <div className="flex-1">
                        {editingId === stage.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateStage(stage.id, editingName);
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              className="text-sm"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => updateStage(stage.id, editingName)}
                              disabled={loading}
                            >
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={cancelEdit}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{stage.name}</span>
                              <div className="flex gap-1">
                                {stage.completed_at && (
                                  <Badge variant="outline" className="text-green-700 border-green-300">
                                    Concluída
                                  </Badge>
                                )}
                                {stage.is_current && !stage.completed_at && (
                                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                                    Atual
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {stage.completed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Concluída em {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {stage.completed_at ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reopenStage(stage.id)}
                            disabled={loading}
                            className="h-8"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reabrir
                          </Button>
                        ) : (
                          <>
                            {!stage.is_current && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsCurrent(stage.id)}
                                disabled={loading}
                                className="h-8"
                              >
                                <div className="h-3 w-3 rounded-full border-2 border-blue-500 mr-1" />
                                Definir como Atual
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsCompleted(stage.id)}
                              disabled={loading}
                              className="h-8 text-green-700 border-green-300 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Concluir
                            </Button>
                          </>
                        )}
                        {editingId !== stage.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(stage)}
                            disabled={loading}
                            className="h-8"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => confirmDelete(stage.id)}
                          disabled={loading}
                          className="h-8 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground">
                  Nenhuma etapa criada ainda. Adicione a primeira etapa acima.
                </p>
              </Card>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta etapa? Esta ação não pode ser desfeita e todas as tarefas vinculadas a esta etapa ficarão sem etapa definida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setStageToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteStage}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}