import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, CheckCircle, XCircle } from 'lucide-react';

interface Risk {
  id: string;
  title: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string | null;
  status: 'open' | 'monitoring' | 'mitigated' | 'closed';
}

interface PublicProjectRisksProps {
  risks: Risk[];
}

export function PublicProjectRisks({ risks }: PublicProjectRisksProps) {
  const getSeverityScore = (probability: string, impact: string) => {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[probability as keyof typeof scores] * scores[impact as keyof typeof scores];
  };

  const getSeverityColor = (probability: string, impact: string) => {
    const score = getSeverityScore(probability, impact);
    if (score >= 6) return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-600', icon: 'text-red-600' };
    if (score >= 4) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', badge: 'bg-orange-600', icon: 'text-orange-600' };
    return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-600', icon: 'text-yellow-600' };
  };

  const getProbabilityLabel = (prob: string) => {
    const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
    return labels[prob as keyof typeof labels] || prob;
  };

  const getImpactLabel = (imp: string) => {
    const labels = { low: 'Baixo', medium: 'Médio', high: 'Alto' };
    return labels[imp as keyof typeof labels] || imp;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800 border-red-300',
      monitoring: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      mitigated: 'bg-blue-100 text-blue-800 border-blue-300',
      closed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      open: 'Aberto',
      monitoring: 'Monitorando',
      mitigated: 'Mitigado',
      closed: 'Fechado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-3 w-3" />;
      case 'monitoring': return <Eye className="h-3 w-3" />;
      case 'mitigated': return <Shield className="h-3 w-3" />;
      case 'closed': return <CheckCircle className="h-3 w-3" />;
      default: return <XCircle className="h-3 w-3" />;
    }
  };

  const openRisks = risks.filter(r => r.status === 'open' || r.status === 'monitoring');
  const closedRisks = risks.filter(r => r.status === 'mitigated' || r.status === 'closed');
  const highSeverityCount = risks.filter(r => getSeverityScore(r.probability, r.impact) >= 6).length;

  if (risks.length === 0) {
    return (
      <Card className="bg-emerald-50 border-2 border-emerald-200 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
            <Shield className="h-12 w-12 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">Nenhum risco identificado</p>
          <p className="text-sm text-gray-700">
            O projeto está livre de riscos conhecidos no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Riscos Ativos</p>
                <p className="text-4xl font-bold text-gray-900">{openRisks.length}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Alta Severidade</p>
                <p className="text-4xl font-bold text-gray-900">{highSeverityCount}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Riscos Fechados</p>
                <p className="text-4xl font-bold text-gray-900">{closedRisks.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Risks */}
      {openRisks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Riscos Ativos Requerem Atenção</h3>
            <Badge className="ml-auto bg-red-600 hover:bg-red-700 text-white">
              {openRisks.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {openRisks.map(risk => {
              const severity = getSeverityColor(risk.probability, risk.impact);
              return (
                <Card key={risk.id} className={`bg-white shadow-sm border-2 ${severity.border} hover:shadow-md transition-shadow`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-4 w-4 rounded-full ${severity.badge}`}></div>
                          <CardTitle className={`text-lg ${severity.text}`}>{risk.title}</CardTitle>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(risk.status)} border-2 w-fit`}>
                        {getStatusIcon(risk.status)}
                        <span className="ml-1 font-semibold">{getStatusLabel(risk.status)}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">Probabilidade</p>
                        <Badge variant="outline" className="text-sm bg-white border-2">
                          {getProbabilityLabel(risk.probability)}
                        </Badge>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">Impacto</p>
                        <Badge variant="outline" className="text-sm bg-white border-2">
                          {getImpactLabel(risk.impact)}
                        </Badge>
                      </div>
                    </div>
                    {risk.mitigation && (
                      <div className={`p-4 ${severity.bg} rounded-lg border-2 ${severity.border}`}>
                        <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Shield className={`h-4 w-4 ${severity.icon}`} />
                          Plano de Mitigação
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{risk.mitigation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed Risks */}
      {closedRisks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Riscos Resolvidos</h3>
            <Badge className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white">
              {closedRisks.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {closedRisks.map(risk => (
              <Card key={risk.id} className="bg-white shadow-sm border-2 border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <CardTitle className="text-base text-gray-900">{risk.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(risk.status)} border-2`}>
                      {getStatusIcon(risk.status)}
                      <span className="ml-1 font-semibold">{getStatusLabel(risk.status)}</span>
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
