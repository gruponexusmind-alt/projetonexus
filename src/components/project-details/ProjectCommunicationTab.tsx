import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectCommunicationTabProps {
  project: {
    id: string;
    title: string;
    company_id: string;
  };
  onRefresh?: () => void;
}

interface Comment {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    nome: string;
    email: string;
  };
}

export function ProjectCommunicationTab({ project, onRefresh }: ProjectCommunicationTabProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newContent, setNewContent] = useState('');
  const [isVisibleToClient, setIsVisibleToClient] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [project.id]);

  const fetchComments = async () => {
    try {
      setLoading(true);

      const { data: commentsData, error } = await supabase
        .from('gp_comments')
        .select(`
          *,
          author:profiles!gp_comments_author_id_fkey(nome, email)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(commentsData || []);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as atualizações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newContent.trim()) {
      toast({
        title: 'Atenção',
        description: 'O conteúdo da atualização não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar o profile.id do usuário logado (necessário para FK)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      const { error } = await supabase
        .from('gp_comments')
        .insert({
          company_id: project.company_id,
          project_id: project.id,
          entity_type: 'project',
          entity_id: project.id,
          author_id: profile.id, // Usar profile.id ao invés de user.id
          content: newContent.trim(),
          is_internal: !isVisibleToClient, // Inverte: checkbox "Visível" = is_internal false
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: isVisibleToClient
          ? 'Atualização criada e visível para o cliente.'
          : 'Comentário interno criado (não visível ao cliente).',
      });

      // Reset form
      setNewContent('');
      setIsVisibleToClient(true);
      setShowForm(false);

      // Refresh list
      await fetchComments();

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a atualização.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atualização?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gp_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Atualização excluída com sucesso.',
      });

      await fetchComments();

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a atualização.',
        variant: 'destructive',
      });
    }
  };

  const externalComments = comments.filter(c => !c.is_internal);
  const internalComments = comments.filter(c => c.is_internal);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total de Atualizações</p>
                <p className="text-3xl font-bold text-gray-900">{comments.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Visíveis ao Cliente</p>
                <p className="text-3xl font-bold text-blue-600">{externalComments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Apenas Internas</p>
                <p className="text-3xl font-bold text-gray-600">{internalComments.length}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <EyeOff className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Comment */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Atualização
        </Button>
      )}

      {showForm && (
        <Card className="bg-white border-2 border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50/50 border-b">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg text-gray-900">Nova Atualização</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Envie atualizações para o cliente ou crie notas internas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Conteúdo da Atualização
              </label>
              <Textarea
                placeholder="Digite a atualização do projeto... (ex: Concluímos a fase de testes e o sistema está pronto para homologação)"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                className="resize-none bg-white border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Checkbox
                id="visible-to-client"
                checked={isVisibleToClient}
                onCheckedChange={(checked) => setIsVisibleToClient(checked === true)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <label
                htmlFor="visible-to-client"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-900">Visível para o cliente no link público</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-6">
                  Se desmarcado, será apenas uma nota interna da equipe
                </p>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreateComment}
                disabled={creating || !newContent.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {creating ? 'Enviando...' : 'Enviar Atualização'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setNewContent('');
                  setIsVisibleToClient(true);
                }}
                variant="outline"
                className="border-gray-300"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <Card className="bg-white border shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-gray-900">Histórico de Comunicações</CardTitle>
          <CardDescription className="text-gray-600">
            {comments.length > 0
              ? 'Todas as atualizações e notas do projeto'
              : 'Nenhuma atualização criada ainda'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-3">Carregando atualizações...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma atualização ainda
              </p>
              <p className="text-gray-600 mb-6">
                Crie a primeira atualização para se comunicar com o cliente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  <div
                    className={`p-5 rounded-lg border-2 transition-all ${
                      comment.is_internal
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-blue-50 border-blue-300 border-l-4'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={comment.is_internal ? 'outline' : 'default'}
                          className={
                            comment.is_internal
                              ? 'bg-gray-200 text-gray-800 border-gray-400'
                              : 'bg-blue-600 text-white'
                          }
                        >
                          {comment.is_internal ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Interna
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Visível ao Cliente
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-gray-600 font-medium">
                          {comment.author?.nome || 'Usuário desconhecido'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-gray-900 leading-relaxed mb-3 whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MessageSquare className="h-3 w-3" />
                      <span>
                        Criado em {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  {index < comments.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
