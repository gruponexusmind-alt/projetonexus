import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plug,
  MessageCircle,
  Mail,
  Calendar,
  Database,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Integration {
  id: string;
  nome: string;
  ativo: boolean;
  configuracoes: any;
}

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select';
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
  }[];
}

const integrationConfigs: IntegrationConfig[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp (Evolution API)',
    description: 'Envio de mensagens e notificações via WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500',
    fields: [
      { key: 'host', label: 'Host da API', type: 'url', placeholder: 'https://api.evolutionapi.com', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Sua chave da API', required: true },
      { key: 'instance', label: 'Nome da Instância', type: 'text', placeholder: 'minha-instancia', required: true },
      { key: 'phone', label: 'Número Remetente', type: 'text', placeholder: '5511999999999' },
    ],
  },
  {
    id: 'email',
    name: 'E-mail (SMTP)',
    description: 'Envio de e-mails e relatórios automáticos',
    icon: Mail,
    color: 'bg-blue-500',
    fields: [
      { key: 'provider', label: 'Provedor', type: 'select', required: true, options: [
        { label: 'SMTP Personalizado', value: 'smtp' },
        { label: 'SendGrid', value: 'sendgrid' },
        { label: 'Postmark', value: 'postmark' },
      ]},
      { key: 'host', label: 'Servidor SMTP', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'port', label: 'Porta', type: 'text', placeholder: '587' },
      { key: 'username', label: 'Usuário', type: 'text', placeholder: 'seu-email@gmail.com' },
      { key: 'password', label: 'Senha/Token', type: 'password', placeholder: 'Sua senha ou token' },
      { key: 'from_name', label: 'Nome do Remetente', type: 'text', placeholder: 'Sua Empresa' },
      { key: 'from_email', label: 'E-mail Remetente', type: 'text', placeholder: 'noreply@empresa.com' },
    ],
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Sincronização de reuniões e eventos',
    icon: Calendar,
    color: 'bg-red-500',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Google Client ID', required: true },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Google Client Secret', required: true },
      { key: 'calendar_id', label: 'Calendar ID', type: 'text', placeholder: 'primary ou ID específico' },
    ],
  },
  {
    id: 'storage',
    name: 'Supabase Storage',
    description: 'Armazenamento de arquivos e documentos',
    icon: Database,
    color: 'bg-green-600',
    fields: [
      { key: 'bucket_documents', label: 'Bucket Documentos', type: 'text', placeholder: 'project-documents' },
      { key: 'bucket_assets', label: 'Bucket Assets', type: 'text', placeholder: 'company-assets' },
      { key: 'max_file_size', label: 'Tamanho Máximo (MB)', type: 'text', placeholder: '10' },
    ],
  },
];

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [configData, setConfigData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_integracoes')
        .select('*');

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar integrações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = (integrationConfig: IntegrationConfig) => {
    setSelectedIntegration(integrationConfig);
    
    // Load existing configuration
    const existing = integrations.find(i => i.nome === integrationConfig.id);
    if (existing) {
      setConfigData(existing.configuracoes || {});
    } else {
      setConfigData({});
    }
    
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;

    setSaving(true);
    try {
      const existing = integrations.find(i => i.nome === selectedIntegration.id);
      
      const payload = {
        nome: selectedIntegration.id,
        ativo: true,
        configuracoes: configData,
      };

      if (existing) {
        const { error } = await supabase
          .from('configuracoes_integracoes')
          .update(payload)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_integracoes')
          .insert([payload]);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Configuração salva com sucesso',
      });

      setConfigDialogOpen(false);
      loadIntegrations();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuração',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('configuracoes_integracoes')
        .update({ ativo: enabled })
        .eq('nome', integrationId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Integração ${enabled ? 'ativada' : 'desativada'} com sucesso`,
      });

      loadIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da integração',
        variant: 'destructive',
      });
    }
  };

  const getIntegrationStatus = (configId: string) => {
    const integration = integrations.find(i => i.nome === configId);
    if (!integration) return 'not_configured';
    return integration.ativo ? 'active' : 'inactive';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'inactive': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      default: return 'Não configurado';
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
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6" />
          Integrações
        </h2>
        <p className="text-muted-foreground">
          Conecte com sistemas externos para automatizar processos
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {integrationConfigs.map((config) => {
          const status = getIntegrationStatus(config.id);
          const IconComponent = config.icon;
          const integration = integrations.find(i => i.nome === config.id);

          return (
            <Card key={config.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                  {integration && (
                    <Switch
                      checked={integration.ativo}
                      onCheckedChange={(checked) => handleToggleIntegration(config.id, checked)}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <Dialog open={configDialogOpen && selectedIntegration?.id === config.id} onOpenChange={setConfigDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenConfig(config)}
                        className="flex items-center gap-2"
                      >
                        <SettingsIcon className="h-4 w-4" />
                        {integration ? 'Configurar' : 'Conectar'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          Configurar {config.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {config.fields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key}>
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {field.type === 'select' ? (
                              <select
                                id={field.key}
                                value={configData[field.key] || ''}
                                onChange={(e) => setConfigData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full px-3 py-2 border border-input rounded-md"
                              >
                                <option value="">Selecione...</option>
                                {field.options?.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                id={field.key}
                                type={field.type}
                                value={configData[field.key] || ''}
                                onChange={(e) => setConfigData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        ))}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                          <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveConfig}
                            disabled={saving}
                          >
                            {saving ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Integrações</CardTitle>
          <CardDescription>
            Visão geral do status de todas as integrações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrationConfigs.map((config) => {
              const status = getIntegrationStatus(config.id);
              const IconComponent = config.icon;
              
              return (
                <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <Badge variant={status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'outline'}>
                    {getStatusLabel(status)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}