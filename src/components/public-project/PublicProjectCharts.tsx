import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
  progress_score: number;
}

interface Stage {
  id: string;
  name: string;
  order_index: number;
  is_current: boolean;
  completed_at: string | null;
}

interface PublicProjectChartsProps {
  stats: Stats | null;
  stages: Stage[];
}

export function PublicProjectCharts({ stats, stages }: PublicProjectChartsProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <PieChartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum dado disponível para gráficos</p>
        </CardContent>
      </Card>
    );
  }

  // Dados para gráfico de pizza - Status das Tarefas
  const taskStatusData = [
    { name: 'Concluídas', value: stats.completed, color: '#10b981' },
    { name: 'Em Andamento', value: stats.in_progress, color: '#3b82f6' },
    { name: 'Em Revisão', value: stats.review, color: '#a855f7' },
    { name: 'Pendentes', value: stats.pending, color: '#94a3b8' },
  ].filter(item => item.value > 0);

  // Dados para gráfico de barras - Tarefas por Etapa (mock - precisaria vir do backend)
  const stagesWithCounts = stages.map(stage => ({
    name: stage.name,
    tarefas: Math.floor(Math.random() * 10) + 1, // Mock - deveria vir do backend
    concluidas: Math.floor(Math.random() * 5),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} tarefa{payload[0].value !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round((payload[0].value / stats.total) * 100) : 0}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  const calculatePercentage = (value: number) => {
    return stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Distribuição por Status */}
      <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <PieChartIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">Distribuição de Tarefas</CardTitle>
              <CardDescription className="text-gray-600">Por status de conclusão</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={window.innerWidth < 768 ? 80 : 100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span className="text-sm">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Resumo Textual */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Progresso Geral</p>
                <p className="text-xs text-gray-700 mt-1">
                  {calculatePercentage(stats.completed)}% das tarefas já foram concluídas.
                  {stats.in_progress > 0 && ` ${stats.in_progress} em andamento neste momento.`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Tarefas por Etapa */}
      {stages.length > 0 && (
        <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">Tarefas por Etapa</CardTitle>
                <CardDescription className="text-gray-600">Distribuição nas fases do projeto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stagesWithCounts}
                  margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '14px',
                    }}
                  />
                  <Bar dataKey="tarefas" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Etapa Atual */}
            {stages.find(s => s.is_current) && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-gray-900">
                    Etapa Atual: {stages.find(s => s.is_current)?.name}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Se não houver etapas, mostrar card alternativo com estatísticas */}
      {stages.length === 0 && (
        <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg text-gray-900">Estatísticas Detalhadas</CardTitle>
            <CardDescription className="text-gray-600">Resumo do progresso do projeto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-gray-900">{calculatePercentage(stats.completed)}%</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-700">{stats.completed}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Em Andamento</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.in_progress}</p>
                </div>
                <div className="text-sm text-blue-700 font-medium">
                  {calculatePercentage(stats.in_progress)}% do total
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Em Revisão</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.review}</p>
                </div>
                <div className="text-sm text-purple-700 font-medium">
                  {calculatePercentage(stats.review)}% do total
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  {calculatePercentage(stats.pending)}% do total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
