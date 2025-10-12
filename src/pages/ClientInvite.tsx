import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface InviteData {
  client_id: string;
  project_id: string;
  email: string;
  client_name: string;
  project_title: string;
}

export default function ClientInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    senha: '',
    confirmarSenha: '',
  });

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);

      console.log('🔍 Validando token:', token?.substring(0, 20) + '...');

      // Chamar Edge Function para validar (bypassa RLS)
      const { data, error } = await supabase.functions.invoke('validate-invite', {
        body: { token },
      });

      console.log('📡 Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        setTokenValid(false);
        toast({
          title: 'Erro ao Validar',
          description: error.message || 'Erro ao validar convite',
          variant: 'destructive',
        });
        return;
      }

      if (!data || !data.valid) {
        console.error('❌ Token inválido:', data);
        setTokenValid(false);
        toast({
          title: data?.expired ? 'Convite Expirado' : 'Convite Inválido',
          description: data?.error || 'O link de convite é inválido ou expirou.',
          variant: 'destructive',
        });
        return;
      }

      // Token válido - configurar dados
      console.log('✅ Token válido:', data);
      setInviteData({
        client_id: data.client_id,
        project_id: data.project_id,
        email: data.email,
        client_name: data.client_name,
        project_title: data.project_title,
      });
      setTokenValid(true);

    } catch (error: any) {
      console.error('❌ Erro ao validar token:', error);
      setTokenValid(false);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar convite',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteData) return;

    // Validações
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha seu nome completo',
        variant: 'destructive',
      });
      return;
    }

    if (formData.senha.length < 8) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            role: 'cliente',
            client_id: inviteData.client_id,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // 2. Atualizar profile com client_id
      // Nota: Isso pode ser feito via trigger no banco ou aqui
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          client_id: inviteData.client_id,
          role: 'cliente',
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // 3. Criar registro de acesso ao projeto (se não existir)
      const { error: accessError } = await supabase
        .from('gp_project_client_access')
        .insert({
          project_id: inviteData.project_id,
          client_id: inviteData.client_id,
          granted_by: authData.user.id, // Temporário, deveria ser o admin que convidou
        });

      if (accessError && accessError.code !== '23505') {
        // 23505 = unique violation (já existe)
        console.error('Error creating access:', accessError);
      }

      toast({
        title: 'Conta Criada!',
        description: 'Sua conta foi criada com sucesso. Você será redirecionado...',
      });

      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        navigate('/client/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar conta. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid || !inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Convite Inválido</h3>
            <p className="text-center text-muted-foreground">
              O link de convite é inválido ou expirou.
              <br />
              Entre em contato com nossa equipe para obter um novo convite.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-center text-2xl">Bem-vindo!</CardTitle>
            <CardDescription className="mt-2 text-center">
              Você foi convidado para acompanhar o projeto
              <br />
              <span className="font-semibold">{inviteData.project_title}</span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={inviteData.email}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">
                Senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.senha}
                onChange={(e) => setFormData((prev) => ({ ...prev, senha: e.target.value }))}
                required
                minLength={8}
              />
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">
                Confirmar Senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmarSenha}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirmarSenha: e.target.value }))
                }
                required
                minLength={8}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Conta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Criar Conta
                </>
              )}
            </Button>

            {/* Info */}
            <p className="text-center text-xs text-muted-foreground">
              Ao criar sua conta, você concorda com nossos termos de uso
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
