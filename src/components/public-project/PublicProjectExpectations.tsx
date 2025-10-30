import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Circle, Target, Plus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Expectation {
  id: string;
  title: string;
  description: string | null;
  is_done: boolean;
  position: number;
}

interface PublicProjectExpectationsProps {
  expectations: Expectation[];
  token: string;
  email: string;
  onExpectationAdded?: () => void;
}

export function PublicProjectExpectations({ expectations: initialExpectations, token, email, onExpectationAdded }: PublicProjectExpectationsProps) {
  const [expectations, setExpectations] = useState<Expectation[]>(initialExpectations);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [newExpectationIds, setNewExpectationIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const completedCount = expectations.filter(e => e.is_done).length;
  const totalCount = expectations.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddExpectation = async () => {
    if (!title.trim() || title.trim().length < 3) {
      toast({
        title: 'Erro',
        description: 'Título deve ter no mínimo 3 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('add-client-expectation', {
        body: {
          token,
          email,
          title: title.trim(),
          description: description.trim() || null,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao adicionar expectativa');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao adicionar expectativa');
      }

      // Adicionar nova expectativa à lista localmente
      setExpectations(prev => [...prev, data.expectation]);

      // Marcar como "nova" por 5 minutos
      setNewExpectationIds(prev => new Set(prev).add(data.expectation.id));
      setTimeout(() => {
        setNewExpectationIds(prev => {
          const updated = new Set(prev);
          updated.delete(data.expectation.id);
          return updated;
        });
      }, 5 * 60 * 1000); // 5 minutos

      toast({
        title: 'Sucesso!',
        description: 'Sua expectativa foi adicionada com sucesso',
      });

      // Limpar formulário
      setTitle('');
      setDescription('');
      setShowForm(false);

      // Ativar cooldown de 30 segundos
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);

      // Notificar componente pai
      onExpectationAdded?.();

    } catch (error: any) {
      console.error('Erro ao adicionar expectativa:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar a expectativa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (expectations.length === 0 && !showForm) {
    return (
      <div className="space-y-6">
        {/* Botão para adicionar expectativa */}
        <Card className="shadow-sm border-2 border-dashed border-blue-300 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
          <CardContent className="p-6">
            <Button
              onClick={() => setShowForm(true)}
              disabled={cooldown}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Sua Expectativa
            </Button>
            {cooldown && (
              <p className="text-xs text-center text-gray-600 mt-2">
                Aguarde 30 segundos para adicionar outra expectativa
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Nenhuma expectativa definida ainda</p>
            <p className="text-sm text-muted-foreground">
              Seja o primeiro a adicionar uma expectativa para este projeto!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de nova expectativa */}
      {showForm ? (
        <Card className="shadow-sm border-2 border-blue-300 bg-blue-50/30">
          <CardHeader className="border-b bg-blue-100/50">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Adicionar Nova Expectativa
            </CardTitle>
            <CardDescription className="text-gray-700">
              Compartilhe suas expectativas e requisitos para o projeto
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expectation-title">Título da Expectativa *</Label>
              <Input
                id="expectation-title"
                placeholder="Ex: Interface intuitiva e fácil de usar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={loading}
              />
              <p className="text-xs text-gray-600">
                {title.length}/200 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectation-description">Descrição (opcional)</Label>
              <Textarea
                id="expectation-description"
                placeholder="Descreva com mais detalhes sua expectativa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-gray-600">
                {description.length}/500 caracteres
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setDescription('');
                }}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddExpectation}
                disabled={loading || !title.trim() || title.trim().length < 3}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Expectativa
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-2 border-dashed border-blue-300 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
          <CardContent className="p-6">
            <Button
              onClick={() => setShowForm(true)}
              disabled={cooldown}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Sua Expectativa
            </Button>
            {cooldown && (
              <p className="text-xs text-center text-gray-600 mt-2">
                Aguarde 30 segundos para adicionar outra expectativa
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {/* Progress Card */}
      <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
        <CardHeader className="border-b bg-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Target className="h-5 w-5 text-blue-600" />
                Progresso das Expectativas
              </CardTitle>
              <CardDescription className="mt-1 text-gray-600">
                {completedCount} de {totalCount} expectativa{totalCount !== 1 ? 's' : ''} atendida{completedCount !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{progressPercentage}%</p>
              <p className="text-xs text-gray-600">Conclusão</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Expectations List */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-gray-900">Critérios de Aceitação</CardTitle>
          <CardDescription className="text-gray-600">Expectativas e requisitos do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expectations.map((expectation, index) => (
              <div
                key={expectation.id}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  expectation.is_done
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {expectation.is_done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${
                      expectation.is_done ? 'text-emerald-900' : 'text-gray-900'
                    }`}>
                      {index + 1}. {expectation.title}
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      {newExpectationIds.has(expectation.id) && !expectation.is_done && (
                        <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full animate-pulse">
                          ✨ Nova
                        </span>
                      )}
                      {expectation.is_done && (
                        <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                          Concluído
                        </span>
                      )}
                    </div>
                  </div>
                  {expectation.description && (
                    <p className={`text-sm mt-1 ${
                      expectation.is_done ? 'text-emerald-700' : 'text-gray-600'
                    }`}>
                      {expectation.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {progressPercentage === 100 && (
        <Card className="bg-emerald-50 shadow-sm border-2 border-emerald-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Todas as expectativas foram atendidas!</p>
                <p className="text-sm text-gray-700 mt-1">
                  O projeto atingiu todos os critérios de aceitação definidos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
