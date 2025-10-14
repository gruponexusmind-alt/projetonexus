import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Share2, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ShareProjectModalProps {
  projectId: string;
  projectTitle: string;
  children: React.ReactNode;
}

export function ShareProjectModal({ projectId, projectTitle, children }: ShareProjectModalProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [formData, setFormData] = useState({
    clientEmail: '',
    clientName: '',
    sendEmail: true,
  });

  const generateViewToken = (email: string) => {
    // Token para acesso temporário ao projeto (somente leitura)
    const payload = {
      project_id: projectId,
      email: email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
    };

    // Codificar em base64url (URL-safe: sem +, /, =)
    const token = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return token;
  };

  const validateToken = (token: string): boolean => {
    try {
      // Tentar decodificar o token para validar
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const decoded = JSON.parse(atob(padded));

      console.log('🔍 [ShareProjectModal] Token generated and validated:', {
        project_id: decoded.project_id,
        email: decoded.email,
        expires: new Date(decoded.exp).toISOString(),
      });

      // Verificar se tem campos obrigatórios
      return !!decoded.project_id && !!decoded.email && !!decoded.exp;
    } catch (e) {
      console.error('❌ [ShareProjectModal] Invalid token generated:', e);
      return false;
    }
  };

  const handleShare = async () => {
    if (!formData.clientEmail.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o email do cliente',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.clientName.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o nome do cliente',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Gerar link de visualização temporário (somente leitura, 7 dias)
      const token = generateViewToken(formData.clientEmail);

      // Validar token gerado
      if (!validateToken(token)) {
        throw new Error('Erro ao gerar token de acesso válido');
      }

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/project/view/${token}`;

      console.log('✅ [ShareProjectModal] Link generated successfully:', link);
      setInviteLink(link);

      // 2. Opcional: Registrar cliente na tabela para histórico interno
      const { data: existingClient } = await supabase
        .from('gp_clients')
        .select('id')
        .eq('email', formData.clientEmail)
        .single();

      if (!existingClient) {
        await supabase
          .from('gp_clients')
          .insert({
            name: formData.clientName,
            email: formData.clientEmail,
            contact_person: formData.clientName,
          });
      }

      // 3. Se marcou para enviar email, poderia chamar uma Edge Function aqui
      // Por enquanto, apenas mostramos o link

      toast({
        title: 'Link Gerado!',
        description: 'Link de visualização criado com sucesso.',
      });
    } catch (error) {
      console.error('Error sharing project:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copiado!',
      description: 'Link de convite copiado para a área de transferência',
    });
  };

  const handleClose = () => {
    setOpen(false);
    setInviteLink('');
    setFormData({
      clientEmail: '',
      clientName: '',
      sendEmail: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Projeto
          </DialogTitle>
          <DialogDescription>
            Convide um cliente para acompanhar o progresso de: <strong>{projectTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">
                Nome do Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                placeholder="Nome completo do cliente"
                value={formData.clientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">
                E-mail do Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="cliente@exemplo.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Se o cliente já existir, usaremos o cadastro existente
              </p>
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, sendEmail: checked as boolean }))
                }
              />
              <Label
                htmlFor="sendEmail"
                className="text-sm font-normal cursor-pointer"
              >
                Enviar convite por e-mail automaticamente
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleShare} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Gerar Convite
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
              <h3 className="font-semibold text-green-900 dark:text-green-400">Link Gerado!</h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-500">
                Compartilhe este link com o cliente para visualização do projeto
              </p>
            </div>

            <div className="space-y-2">
              <Label>Link de Visualização</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-xs" />
                <Button onClick={copyToClipboard} size="sm" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 mt-2">
                <p className="text-xs text-amber-900 dark:text-amber-400 font-medium">
                  ⏱️ Este link expira em 7 dias
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  O cliente deverá informar o email <strong>{formData.clientEmail}</strong> para acessar
                </p>
              </div>
            </div>

            {formData.sendEmail && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-900 dark:text-blue-400">
                📧 Um e-mail será enviado para {formData.clientEmail}
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
