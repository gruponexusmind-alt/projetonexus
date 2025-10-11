import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Key,
  Download,
  Activity,
  FileDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SecuritySettings {
  id?: string;
  timeout_sessao: number;
  politica_senha_minima: number;
  exigir_caracteres_especiais: boolean;
  log_atividades: boolean;
}

interface AuditLog {
  id: string;
  user_id: string;
  acao: string;
  tabela?: string;
  ip_address?: string;
  created_at: string;
  user_agent?: string;
}

export function SecurityTab() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>({
    timeout_sessao: 60,
    politica_senha_minima: 8,
    exigir_caracteres_especiais: true,
    log_atividades: true,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSecuritySettings();
    loadAuditLogs();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_seguranca')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          timeout_sessao: data.timeout_sessao || 60,
          politica_senha_minima: data.politica_senha_minima || 8,
          exigir_caracteres_especiais: data.exigir_caracteres_especiais || true,
          log_atividades: data.log_atividades || true,
        });
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações de segurança',
        variant: 'destructive',
      });
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs_auditoria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        timeout_sessao: settings.timeout_sessao,
        politica_senha_minima: settings.politica_senha_minima,
        exigir_caracteres_especiais: settings.exigir_caracteres_especiais,
        log_atividades: settings.log_atividades,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('configuracoes_seguranca')
          .update(payload)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_seguranca')
          .insert([payload]);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações de segurança salvas com sucesso',
      });

      loadSecuritySettings();
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações de segurança',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      // Mock data export - in real implementation, you'd generate actual data
      const data = {
        exported_at: new Date().toISOString(),
        user_data: {
          profile: profile,
          // Add other user-related data
        },
        settings: settings,
        audit_logs: auditLogs,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dados-usuario-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Dados exportados com sucesso',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar dados',
        variant: 'destructive',
      });
    } finally {
      setExportingData(false);
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
            <Shield className="h-6 w-6" />
            Segurança e Privacidade
          </h2>
          <p className="text-muted-foreground">
            Configure políticas de segurança e gerencie dados pessoais
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Política de Senhas
          </CardTitle>
          <CardDescription>
            Configure os requisitos de segurança para senhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min-password-length">Comprimento Mínimo</Label>
              <Input
                id="min-password-length"
                type="number"
                min="6"
                max="32"
                value={settings.politica_senha_minima}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  politica_senha_minima: parseInt(e.target.value) || 8 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Número mínimo de caracteres (6-32)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Timeout de Sessão (min)</Label>
              <Input
                id="session-timeout"
                type="number"
                min="15"
                max="480"
                value={settings.timeout_sessao}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  timeout_sessao: parseInt(e.target.value) || 60 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Tempo limite da sessão em minutos (15-480)
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Exigir Caracteres Especiais</Label>
              <p className="text-sm text-muted-foreground">
                Senhas devem conter pelo menos um caractere especial (@, #, $, etc.)
              </p>
            </div>
            <Switch
              checked={settings.exigir_caracteres_especiais}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                exigir_caracteres_especiais: checked 
              }))}
            />
          </div>
        </CardContent>
      </Card>


      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
          <CardDescription>
            Atividades importantes registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Registrar Atividades</Label>
              <p className="text-sm text-muted-foreground">
                Manter log das ações importantes dos usuários
              </p>
            </div>
            <Switch
              checked={settings.log_atividades}
              onCheckedChange={(checked) => setSettings(prev => ({ 
                ...prev, 
                log_atividades: checked 
              }))}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Atividades Recentes</h4>
            {auditLogs.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{log.acao}</p>
                      {log.tabela && (
                        <p className="text-muted-foreground">Tabela: {log.tabela}</p>
                      )}
                    </div>
                    <div className="text-right text-muted-foreground">
                      <p>{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                      {log.ip_address && (
                        <p className="text-xs">IP: {log.ip_address}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma atividade registrada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Baixe uma cópia de todos os seus dados pessoais em formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exportingData}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {exportingData ? 'Exportando...' : 'Exportar JSON'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}