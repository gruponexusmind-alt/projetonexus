import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Mail, 
  MessageCircle, 
  Monitor, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreference {
  id: string;
  category: string;
  title: string;
  description: string;
  channels: {
    email: boolean;
    whatsapp: boolean;
    inapp: boolean;
  };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const notificationCategories = [
  {
    id: 'tasks',
    name: 'Tarefas e Projetos',
    description: 'Notificações relacionadas a tarefas e projetos',
    icon: CheckCircle2,
    color: 'text-blue-500',
  },
  {
    id: 'meetings',
    name: 'Reuniões e Calendário',
    description: 'Lembretes de reuniões e eventos',
    icon: Calendar,
    color: 'text-purple-500',
  },
  {
    id: 'system',
    name: 'Sistema',
    description: 'Atualizações e alertas do sistema',
    icon: Monitor,
    color: 'text-green-500',
  },
  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Relatórios automáticos e resumos',
    icon: FileText,
    color: 'text-orange-500',
  },
];

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'task_assigned',
    category: 'tasks',
    title: 'Tarefa Atribuída',
    description: 'Quando uma nova tarefa for atribuída a você',
    channels: { email: true, whatsapp: false, inapp: true },
    icon: CheckCircle2,
    color: 'text-blue-500',
  },
  {
    id: 'task_overdue',
    category: 'tasks',
    title: 'Tarefa Atrasada',
    description: 'Quando uma tarefa passar do prazo',
    channels: { email: true, whatsapp: true, inapp: true },
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  {
    id: 'task_completed',
    category: 'tasks',
    title: 'Tarefa Concluída',
    description: 'Quando uma tarefa for marcada como concluída',
    channels: { email: false, whatsapp: false, inapp: true },
    icon: CheckCircle2,
    color: 'text-green-500',
  },
  {
    id: 'project_milestone',
    category: 'tasks',
    title: 'Marco do Projeto',
    description: 'Quando um marco importante do projeto for atingido',
    channels: { email: true, whatsapp: false, inapp: true },
    icon: CheckCircle2,
    color: 'text-purple-500',
  },
  {
    id: 'meeting_reminder',
    category: 'meetings',
    title: 'Lembrete de Reunião',
    description: 'Lembrete 15 minutos antes de reuniões',
    channels: { email: true, whatsapp: true, inapp: true },
    icon: Clock,
    color: 'text-blue-500',
  },
  {
    id: 'meeting_cancelled',
    category: 'meetings',
    title: 'Reunião Cancelada',
    description: 'Quando uma reunião for cancelada',
    channels: { email: true, whatsapp: true, inapp: true },
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  {
    id: 'new_user',
    category: 'system',
    title: 'Novo Usuário',
    description: 'Quando um novo usuário for adicionado (apenas admins)',
    channels: { email: true, whatsapp: false, inapp: true },
    icon: Users,
    color: 'text-green-500',
  },
  {
    id: 'system_backup',
    category: 'system',
    title: 'Backup do Sistema',
    description: 'Relatório de backup automático (apenas admins)',
    channels: { email: true, whatsapp: false, inapp: false },
    icon: Monitor,
    color: 'text-blue-500',
  },
  {
    id: 'weekly_report',
    category: 'reports',
    title: 'Relatório Semanal',
    description: 'Resumo semanal de atividades e projetos',
    channels: { email: true, whatsapp: false, inapp: false },
    icon: FileText,
    color: 'text-purple-500',
  },
  {
    id: 'monthly_summary',
    category: 'reports',
    title: 'Resumo Mensal',
    description: 'Relatório mensal de performance e métricas',
    channels: { email: true, whatsapp: false, inapp: false },
    icon: FileText,
    color: 'text-green-500',
  },
];

export function NotificationsTab() {
  const { profile } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [globalSettings, setGlobalSettings] = useState({
    emailEnabled: true,
    whatsappEnabled: true,
    inappEnabled: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
  });

  const handleChannelToggle = (prefId: string, channel: keyof NotificationPreference['channels']) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === prefId 
        ? { ...pref, channels: { ...pref.channels, [channel]: !pref.channels[channel] } }
        : pref
    ));
  };

  const handleGlobalToggle = (setting: keyof typeof globalSettings) => {
    setGlobalSettings(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
      case 'inapp': return <Monitor className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email': return 'E-mail';
      case 'whatsapp': return 'WhatsApp';
      case 'inapp': return 'No App';
      default: return channel;
    }
  };

  // Filter preferences based on user role
  const filteredPreferences = preferences.filter(pref => {
    if (pref.id === 'new_user' || pref.id === 'system_backup') {
      return profile?.role === 'admin';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notificações
        </h2>
        <p className="text-muted-foreground">
          Configure suas preferências de notificação por canal e tipo de evento
        </p>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Configurações globais de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className="font-medium">E-mail</Label>
                  <p className="text-xs text-muted-foreground">Notificações por e-mail</p>
                </div>
              </div>
              <Switch
                checked={globalSettings.emailEnabled}
                onCheckedChange={() => handleGlobalToggle('emailEnabled')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div>
                  <Label className="font-medium">WhatsApp</Label>
                  <p className="text-xs text-muted-foreground">Mensagens WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={globalSettings.whatsappEnabled}
                onCheckedChange={() => handleGlobalToggle('whatsappEnabled')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-500" />
                <div>
                  <Label className="font-medium">No App</Label>
                  <p className="text-xs text-muted-foreground">Notificações internas</p>
                </div>
              </div>
              <Switch
                checked={globalSettings.inappEnabled}
                onCheckedChange={() => handleGlobalToggle('inappEnabled')}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <Label className="font-medium">Horário Silencioso</Label>
                  <p className="text-xs text-muted-foreground">
                    Pausar notificações durante horários específicos
                  </p>
                </div>
              </div>
              <Switch
                checked={globalSettings.quietHours.enabled}
                onCheckedChange={() => setGlobalSettings(prev => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                }))}
              />
            </div>
            
            {globalSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-7">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Início</Label>
                  <input
                    type="time"
                    value={globalSettings.quietHours.start}
                    onChange={(e) => setGlobalSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Fim</Label>
                  <input
                    type="time"
                    value={globalSettings.quietHours.end}
                    onChange={(e) => setGlobalSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences by Category */}
      {notificationCategories.map((category) => {
        const categoryPrefs = filteredPreferences.filter(pref => pref.category === category.id);
        if (categoryPrefs.length === 0) return null;

        const CategoryIcon = category.icon;

        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className={`h-5 w-5 ${category.color}`} />
                {category.name}
              </CardTitle>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPrefs.map((pref) => {
                  const PrefIcon = pref.icon;
                  
                  return (
                    <div key={pref.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <PrefIcon className={`h-5 w-5 mt-0.5 ${pref.color}`} />
                          <div>
                            <h4 className="font-medium">{pref.title}</h4>
                            <p className="text-sm text-muted-foreground">{pref.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 ml-8">
                        {Object.entries(pref.channels).map(([channel, enabled]) => (
                          <div key={channel} className="flex items-center gap-2">
                            <Switch
                              checked={enabled && globalSettings[`${channel}Enabled` as keyof typeof globalSettings] as boolean}
                              onCheckedChange={() => handleChannelToggle(pref.id, channel as keyof NotificationPreference['channels'])}
                              disabled={!globalSettings[`${channel}Enabled` as keyof typeof globalSettings]}
                            />
                            <div className="flex items-center gap-1">
                              {getChannelIcon(channel)}
                              <span className="text-sm">{getChannelLabel(channel)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo das Configurações</CardTitle>
          <CardDescription>
            Visão geral das suas preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
              <p className="font-medium">E-mail</p>
              <p className="text-2xl font-bold text-blue-500">
                {filteredPreferences.filter(p => p.channels.email).length}
              </p>
              <p className="text-xs text-muted-foreground">eventos ativos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-2xl font-bold text-green-500">
                {filteredPreferences.filter(p => p.channels.whatsapp).length}
              </p>
              <p className="text-xs text-muted-foreground">eventos ativos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Monitor className="h-8 w-8 text-purple-500" />
              </div>
              <p className="font-medium">No App</p>
              <p className="text-2xl font-bold text-purple-500">
                {filteredPreferences.filter(p => p.channels.inapp).length}
              </p>
              <p className="text-xs text-muted-foreground">eventos ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}