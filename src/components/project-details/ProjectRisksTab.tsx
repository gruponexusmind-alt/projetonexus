import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Shield, Eye, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Risk {
  id: string;
  title: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
  owner_id?: string;
  status: 'open' | 'monitoring' | 'mitigated' | 'closed';
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  company_id?: string;
}

interface ProjectRisksTabProps {
  project: Project;
  onRefresh: () => void;
}

export function ProjectRisksTab({ project, onRefresh }: ProjectRisksTabProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRisk, setNewRisk] = useState({
    title: '',
    probability: 'medium' as const,
    impact: 'medium' as const,
    mitigation: '',
    status: 'open' as const
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRisks();
  }, [project.id]);

  const fetchRisks = async () => {
    const { data, error } = await supabase
      .from('gp_project_risks')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar riscos:', error);
    } else {
      setRisks((data || []) as Risk[]);
    }
    setLoading(false);
  };

  const createRisk = async () => {
    if (!newRisk.title) {
      toast({
        title: 'Erro',
        description: 'Título é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('gp_project_risks')
      .insert({
        project_id: project.id,
        company_id: project.company_id,
        title: newRisk.title,
        probability: newRisk.probability,
        impact: newRisk.impact,
        mitigation: newRisk.mitigation || null,
        status: newRisk.status
      });

    if (error) {
      console.error('Erro ao criar risco:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o risco.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Risco criado com sucesso!',
    });

    setShowCreateModal(false);
    setNewRisk({
      title: '',
      probability: 'medium',
      impact: 'medium',
      mitigation: '',
      status: 'open'
    });
    fetchRisks();
  };

  const updateRiskStatus = async (riskId: string, status: Risk['status']) => {
    const { error } = await supabase
      .from('gp_project_risks')
      .update({ status })
      .eq('id', riskId);

    if (error) {
      console.error('Erro ao atualizar status do risco:', error);
      return;
    }

    fetchRisks();
    toast({
      title: 'Sucesso',
      description: 'Status do risco atualizado!',
    });
  };

  const deleteRisk = async (riskId: string) => {
    const { error } = await supabase
      .from('gp_project_risks')
      .delete()
      .eq('id', riskId);

    if (error) {
      console.error('Erro ao excluir risco:', error);
      return;
    }

    fetchRisks();
    toast({
      title: 'Sucesso',
      description: 'Risco removido!',
    });
  };

  const getRiskColor = (probability: string, impact: string) => {
    const score = getProbabilityScore(probability) * getImpactScore(impact);
    if (score >= 9) return 'bg-red-500';
    if (score >= 6) return 'bg-orange-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskSeverity = (probability: string, impact: string) => {
    const score = getProbabilityScore(probability) * getImpactScore(impact);
    if (score >= 9) return 'Crítico';
    if (score >= 6) return 'Alto';
    if (score >= 3) return 'Médio';
    return 'Baixo';
  };

  const getProbabilityScore = (probability: string) => {
    switch (probability) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  };

  const getImpactScore = (impact: string) => {
    switch (impact) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'monitoring': return <Eye className="h-4 w-4" />;
      case 'mitigated': return <Shield className="h-4 w-4" />;
      case 'closed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'monitoring': return 'default';
      case 'mitigated': return 'secondary';
      case 'closed': return 'outline';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'monitoring': return 'Monitorando';
      case 'mitigated': return 'Mitigado';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  if (loading) {
    return <div>Carregando riscos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Riscos do Projeto</h2>
          <p className="text-muted-foreground">Gerencie riscos e ações de mitigação</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Risco
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Risco</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Risco *</Label>
                <Input
                  id="title"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  placeholder="Descrição do risco..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="probability">Probabilidade</Label>
                  <Select value={newRisk.probability} onValueChange={(value: any) => setNewRisk({ ...newRisk, probability: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="impact">Impacto</Label>
                  <Select value={newRisk.impact} onValueChange={(value: any) => setNewRisk({ ...newRisk, impact: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="mitigation">Plano de Mitigação</Label>
                <Textarea
                  id="mitigation"
                  value={newRisk.mitigation}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                  placeholder="Como mitigar ou responder a este risco..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={createRisk}>
                  Criar Risco
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Matriz de Riscos Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Riscos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div></div>
            <div className="text-center font-medium">Baixo</div>
            <div className="text-center font-medium">Médio</div>
            <div className="text-center font-medium">Alto</div>
            
            <div className="font-medium">Alta</div>
            <div className="h-16 bg-yellow-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'high' && r.impact === 'low').length}
            </div>
            <div className="h-16 bg-orange-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'high' && r.impact === 'medium').length}
            </div>
            <div className="h-16 bg-red-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'high' && r.impact === 'high').length}
            </div>
            
            <div className="font-medium">Média</div>
            <div className="h-16 bg-green-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'medium' && r.impact === 'low').length}
            </div>
            <div className="h-16 bg-yellow-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'medium' && r.impact === 'medium').length}
            </div>
            <div className="h-16 bg-orange-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'medium' && r.impact === 'high').length}
            </div>
            
            <div className="font-medium">Baixa</div>
            <div className="h-16 bg-green-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'low' && r.impact === 'low').length}
            </div>
            <div className="h-16 bg-green-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'low' && r.impact === 'medium').length}
            </div>
            <div className="h-16 bg-yellow-200 border rounded flex items-center justify-center">
              {risks.filter(r => r.probability === 'low' && r.impact === 'high').length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Riscos */}
      <div className="grid gap-4">
        {risks.map((risk) => (
          <Card key={risk.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {risk.title}
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(risk.probability, risk.impact)}`}></div>
                    <Badge variant="outline">
                      {getRiskSeverity(risk.probability, risk.impact)}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Probabilidade: <strong>{risk.probability}</strong></span>
                    <span>Impacto: <strong>{risk.impact}</strong></span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(risk.status)}
                      <Badge variant={getStatusColor(risk.status) as any}>
                        {getStatusLabel(risk.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={risk.status} onValueChange={(value) => updateRiskStatus(risk.id, value as Risk['status'])}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="monitoring">Monitorando</SelectItem>
                      <SelectItem value="mitigated">Mitigado</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRisk(risk.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {risk.mitigation && (
              <CardContent>
                <div>
                  <h4 className="font-medium text-sm mb-1">Plano de Mitigação:</h4>
                  <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {risks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum risco cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione riscos para acompanhar e mitigar potenciais problemas no projeto.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Risco
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}