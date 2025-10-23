import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Target } from 'lucide-react';

interface Expectation {
  id: string;
  title: string;
  description: string | null;
  is_done: boolean;
  position: number;
}

interface PublicProjectExpectationsProps {
  expectations: Expectation[];
}

export function PublicProjectExpectations({ expectations }: PublicProjectExpectationsProps) {
  const completedCount = expectations.filter(e => e.is_done).length;
  const totalCount = expectations.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (expectations.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Nenhuma expectativa definida</p>
          <p className="text-sm text-muted-foreground">
            As expectativas e critérios de aceitação aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
        <CardHeader className="border-b bg-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Target className="h-5 w-5 text-blue-600" />
                Progresso das Expectativas
              </CardTitle>
              <CardDescription className="mt-1 text-gray-600">
                {completedCount} de {totalCount} expectativa{totalCount !== 1 ? 's' : ''} atendida{completedCount !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{progressPercentage}%</p>
              <p className="text-xs text-gray-600">Conclusão</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Expectations List */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-gray-900">Critérios de Aceitação</CardTitle>
          <CardDescription className="text-gray-600">Expectativas e requisitos do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expectations.map((expectation, index) => (
              <div
                key={expectation.id}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  expectation.is_done
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {expectation.is_done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${
                      expectation.is_done ? 'text-emerald-900' : 'text-gray-900'
                    }`}>
                      {index + 1}. {expectation.title}
                    </p>
                    {expectation.is_done && (
                      <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full flex-shrink-0">
                        Concluído
                      </span>
                    )}
                  </div>
                  {expectation.description && (
                    <p className={`text-sm mt-1 ${
                      expectation.is_done ? 'text-emerald-700' : 'text-gray-600'
                    }`}>
                      {expectation.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {progressPercentage === 100 && (
        <Card className="bg-emerald-50 shadow-sm border-2 border-emerald-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Todas as expectativas foram atendidas!</p>
                <p className="text-sm text-gray-700 mt-1">
                  O projeto atingiu todos os critérios de aceitação definidos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
