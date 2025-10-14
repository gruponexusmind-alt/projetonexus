import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Expectation {
  id: string;
  title: string;
  description: string;
  is_done: boolean;
  position: number;
}

interface ManageExpectationsModalProps {
  projectId: string;
  companyId: string;
  onExpectationsUpdated?: () => void;
  children: React.ReactNode;
}

export function ManageExpectationsModal({ projectId, companyId, onExpectationsUpdated, children }: ManageExpectationsModalProps) {
  const [open, setOpen] = useState(false);
  const [expectations, setExpectations] = useState<Expectation[]>([]);
  const [newExpectation, setNewExpectation] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExpectations();
    }
  }, [open, projectId]);

  const fetchExpectations = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_project_expectations')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (error) throw error;
      setExpectations(data || []);
    } catch (error) {
      console.error('Erro ao carregar expectativas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as expectativas.',
        variant: 'destructive',
      });
    }
  };

  const addExpectation = async () => {
    if (!newExpectation.title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_expectations')
        .insert({
          project_id: projectId,
          company_id: companyId,
          title: newExpectation.title.trim(),
          description: newExpectation.description.trim(),
          position: expectations.length,
          is_done: false
        });

      if (error) throw error;

      setNewExpectation({ title: '', description: '' });
      await fetchExpectations();
      
      toast({
        title: 'Sucesso',
        description: 'Expectativa adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a expectativa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpectation = async (expectationId: string, data: { title: string; description: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_expectations')
        .update({ 
          title: data.title.trim(),
          description: data.description.trim()
        })
        .eq('id', expectationId);

      if (error) throw error;

      await fetchExpectations();
      setEditingId(null);
      setEditingData({ title: '', description: '' });
      
      toast({
        title: 'Sucesso',
        description: 'Expectativa atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a expectativa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpectation = async (expectationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('gp_project_expectations')
        .delete()
        .eq('id', expectationId);

      if (error) throw error;

      await fetchExpectations();
      
      toast({
        title: 'Sucesso',
        description: 'Expectativa removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a expectativa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpectation = async (expectationId: string, isDone: boolean) => {
    try {
      const { error } = await supabase
        .from('gp_project_expectations')
        .update({ is_done: isDone })
        .eq('id', expectationId);

      if (error) throw error;

      setExpectations(prev => 
        prev.map(exp => 
          exp.id === expectationId ? { ...exp, is_done: isDone } : exp
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar expectativa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a expectativa.',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (expectation: Expectation) => {
    setEditingId(expectation.id);
    setEditingData({ title: expectation.title, description: expectation.description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({ title: '', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        onExpectationsUpdated?.();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Expectativas do Projeto</DialogTitle>
          <DialogDescription>
            Defina e acompanhe as expectativas e objetivos do projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new expectation */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder="Título da expectativa..."
                value={newExpectation.title}
                onChange={(e) => setNewExpectation(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Descrição detalhada (opcional)..."
                value={newExpectation.description}
                onChange={(e) => setNewExpectation(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
              <Button 
                onClick={addExpectation} 
                disabled={loading || !newExpectation.title.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Expectativa
              </Button>
            </CardContent>
          </Card>

          {/* Expectations list */}
          <div className="space-y-3">
            {expectations.length > 0 ? (
              expectations.map((expectation) => (
                <Card key={expectation.id} className={`transition-all ${
                  expectation.is_done ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab mt-1" />
                      
                      <Checkbox
                        checked={expectation.is_done}
                        onCheckedChange={(checked) => 
                          toggleExpectation(expectation.id, !!checked)
                        }
                        className="mt-1"
                      />

                      <div className="flex-1">
                        {editingId === expectation.id ? (
                          <div className="space-y-3">
                            <Input
                              value={editingData.title}
                              onChange={(e) => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Título da expectativa..."
                            />
                            <Textarea
                              value={editingData.description}
                              onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Descrição detalhada..."
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateExpectation(expectation.id, editingData)}
                                disabled={loading || !editingData.title.trim()}
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
                          </div>
                        ) : (
                          <div>
                            <h4 className={`font-medium ${
                              expectation.is_done ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {expectation.title}
                            </h4>
                            {expectation.description && (
                              <p className={`text-sm mt-1 ${
                                expectation.is_done ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                              }`}>
                                {expectation.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {editingId !== expectation.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(expectation)}
                            disabled={loading}
                            className="hover:bg-blue-50 hover:text-blue-600"
                            title="Editar expectativa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteExpectation(expectation.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir expectativa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground">
                  Nenhuma expectativa criada ainda. Adicione a primeira expectativa acima.
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
    </Dialog>
  );
}