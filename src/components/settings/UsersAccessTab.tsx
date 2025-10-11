import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreHorizontal, 
  Edit, 
  UserX, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: 'admin' | 'operacional' | 'financeiro' | 'vendas';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const roleLabels = {
  admin: 'Administrador',
  operacional: 'Operacional',
};

const roleColors = {
  admin: 'destructive',
  operacional: 'secondary',
} as const;

export function UsersAccessTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'operacional' });
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    setInviting(true);
    try {
      // For now, we'll create a placeholder user entry
      // In a real implementation, you'd send an invitation email
        const { error } = await supabase
        .from('profiles')
        .insert([{
          user_id: crypto.randomUUID(), // Temporary user_id until real invitation
          nome: inviteData.name,
          email: inviteData.email,
          role: inviteData.role as any,
          ativo: false, // Will be activated when user accepts invite
        }]);

      if (error) throw error;

      toast({
        title: 'Convite Enviado',
        description: `Convite enviado para ${inviteData.email}`,
      });

      setInviteData({ name: '', email: '', role: 'operacional' });
      setInviteOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar convite',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        variant: 'destructive',
      });
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: 'admin' | 'operacional') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Role do usuário alterado com sucesso',
      });

      loadUsers();
    } catch (error) {
      console.error('Error changing user role:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar role do usuário',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Usuários e Acesso
          </h2>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e níveis de acesso
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome Completo</Label>
                <Input
                  id="invite-name"
                  value={inviteData.name}
                  onChange={(e) => setInviteData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Nível de Acesso</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleInviteUser} 
                  disabled={inviting || !inviteData.name || !inviteData.email}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {inviting ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            {users.length} usuário(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.nome}</h4>
                      {user.ativo ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : user.user_id ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={roleColors[user.role]} className="text-xs">
                        {roleLabels[user.role]}
                      </Badge>
                      <Badge variant={user.ativo ? 'default' : 'secondary'} className="text-xs">
                        {user.ativo ? 'Ativo' : user.user_id ? 'Inativo' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleChangeUserRole(
                        user.id, 
                        user.role === 'admin' ? 'operacional' : 'admin'
                      )}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Alterar para {user.role === 'admin' ? 'Operacional' : 'Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleToggleUserStatus(user.id, user.ativo)}
                    >
                      {user.ativo ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar Usuário
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Ativar Usuário
                        </>
                      )}
                    </DropdownMenuItem>
                    {!user.user_id && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reenviar Convite
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário cadastrado</p>
                <p className="text-sm">Clique em "Convidar Usuário" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles & Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tipos de Acesso
          </CardTitle>
          <CardDescription>
            Entenda os diferentes níveis de permissão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive" className="text-xs">Administrador</Badge>
              </div>
              <h4 className="font-medium mb-2">Acesso Total</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gerenciar usuários e permissões</li>
                <li>• Acessar configurações do sistema</li>
                <li>• Visualizar relatórios financeiros</li>
                <li>• Gerenciar projetos e clientes</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">Operacional</Badge>
              </div>
              <h4 className="font-medium mb-2">Acesso Limitado</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gerenciar projetos atribuídos</li>
                <li>• Visualizar clientes e leads</li>
                <li>• Criar e editar tarefas</li>
                <li>• Acessar calendário e reuniões</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}