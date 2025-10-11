import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Building2, Upload, Save, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface CompanySettings {
  id?: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  logo_url?: string;
  timezone?: string;
  work_days?: string[];
  work_hours?: { start: string; end: string };
}

const workDaysOptions = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const timezones = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Amazonas (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Acre (GMT-5)' },
];

export function OrganizationTab() {
  const [settings, setSettings] = useState<CompanySettings>({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    timezone: 'America/Sao_Paulo',
    work_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    work_hours: { start: '09:00', end: '18:00' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          nome: data.nome || '',
          cnpj: data.cnpj || '',
          email: data.email || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          logo_url: data.logo_url,
          timezone: 'America/Sao_Paulo', // Default fallback
          work_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          work_hours: { start: '09:00', end: '18:00' },
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações da empresa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nome: settings.nome,
        cnpj: settings.cnpj,
        email: settings.email,
        telefone: settings.telefone,
        endereco: settings.endereco,
        logo_url: settings.logo_url,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from('configuracoes_empresa')
          .update(payload)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_empresa')
          .insert([payload]);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Configurações da empresa salvas com sucesso',
      });

      // Reload to get the ID if it was a new record
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações da empresa',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleWorkDayChange = (dayId: string, checked: boolean) => {
    if (checked) {
      setSettings(prev => ({
        ...prev,
        work_days: [...(prev.work_days || []), dayId]
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        work_days: (prev.work_days || []).filter(day => day !== dayId)
      }));
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
            <Building2 className="h-6 w-6" />
            Configurações da Organização
          </h2>
          <p className="text-muted-foreground">
            Gerencie as informações básicas da sua empresa
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Dados básicos da organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={settings.nome}
                onChange={(e) => setSettings(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={settings.cnpj}
                onChange={(e) => setSettings(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo *</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={settings.telefone}
                onChange={(e) => setSettings(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={settings.endereco}
              onChange={(e) => setSettings(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Endereço completo da empresa"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Trabalho
          </CardTitle>
          <CardDescription>
            Defina os dias e horários de funcionamento da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Fuso Horário
            </Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fuso horário" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Work Days */}
          <div className="space-y-3">
            <Label>Dias Úteis</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {workDaysOptions.map((day) => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.id}
                    checked={(settings.work_days || []).includes(day.id)}
                    onCheckedChange={(checked) => handleWorkDayChange(day.id, checked as boolean)}
                  />
                  <Label htmlFor={day.id} className="text-sm font-normal">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Work Hours */}
          <div className="space-y-3">
            <Label>Horário de Funcionamento</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work-start" className="text-sm text-muted-foreground">
                  Início
                </Label>
                <Input
                  id="work-start"
                  type="time"
                  value={settings.work_hours?.start || '09:00'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    work_hours: { ...prev.work_hours, start: e.target.value } as any
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-end" className="text-sm text-muted-foreground">
                  Fim
                </Label>
                <Input
                  id="work-end"
                  type="time"
                  value={settings.work_hours?.end || '18:00'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    work_hours: { ...prev.work_hours, end: e.target.value } as any
                  }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
          <CardDescription>
            Faça upload do logo que aparecerá no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.logo_url && (
              <div className="flex items-center gap-4">
                <img 
                  src={settings.logo_url} 
                  alt="Logo atual" 
                  className="h-16 w-16 object-contain border rounded"
                />
                <div>
                  <p className="text-sm font-medium">Logo atual</p>
                  <p className="text-xs text-muted-foreground">
                    Clique em "Escolher arquivo" para alterar
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Escolher Arquivo
              </Button>
              <div className="text-sm text-muted-foreground">
                <p>Formatos aceitos: PNG, JPG, SVG</p>
                <p>Tamanho máximo: 2MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}