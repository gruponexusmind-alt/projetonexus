import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Flag, User, CheckCircle2, Clock } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
}

interface PublicProjectClientTasksProps {
  clientTasks: ClientTask[];
}

export function PublicProjectClientTasks({ clientTasks }: PublicProjectClientTasksProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      review: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      review: 'Em Revisão',
      completed: 'Concluída',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-amber-100 text-amber-800 border-amber-300',
      high: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = { low: '🟢 Baixa', medium: '🟡 Média', high: '🔴 Alta' };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getUrgencyLevel = (dueDate: string | null) => {
    if (!dueDate) return 'normal';
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return 'overdue';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  const activeTasks = clientTasks.filter(t => t.status !== 'completed');
  const completedTasks = clientTasks.filter(t => t.status === 'completed');
  const overdueTasks = activeTasks.filter(t => t.due_date && isPast(new Date(t.due_date)));

  if (clientTasks.length === 0) {
    return (
      <Card className="bg-emerald-50 border-2 border-emerald-200 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">Nenhuma ação pendente</p>
          <p className="text-sm text-gray-700">
            Não há tarefas que requerem sua ação no momento. Continue acompanhando o progresso do projeto!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert if there are overdue tasks */}
      {overdueTasks.length > 0 && (
        <Card className="bg-red-50 border-2 border-red-300 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">
                  {overdueTasks.length} tarefa{overdueTasks.length !== 1 ? 's' : ''} atrasada{overdueTasks.length !== 1 ? 's' : ''}!
                </p>
                <p className="text-sm text-gray-700 mt-1 font-medium">
                  Por favor, priorize estas ações para manter o projeto no prazo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total de Tarefas</p>
                <p className="text-4xl font-bold text-gray-900">{clientTasks.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aguardando Ação</p>
                <p className="text-4xl font-bold text-gray-900">{activeTasks.length}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Concluídas</p>
                <p className="text-4xl font-bold text-gray-900">{completedTasks.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            <div className="p-2 bg-orange-600 rounded-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Suas Tarefas Pendentes</h3>
            <Badge className="ml-auto bg-orange-600 hover:bg-orange-700 text-white">
              {activeTasks.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {activeTasks.map(task => {
              const urgency = getUrgencyLevel(task.due_date);
              const isOverdue = urgency === 'overdue';
              const isUrgent = urgency === 'urgent';

              return (
                <Card
                  key={task.id}
                  className={`bg-white shadow-sm border-2 hover:shadow-md transition-shadow ${
                    isOverdue ? 'border-red-300 border-l-4 border-l-red-600' :
                    isUrgent ? 'border-orange-300 border-l-4 border-l-orange-600' :
                    'border-gray-200'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {isOverdue && (
                            <Badge className="text-xs bg-red-600 hover:bg-red-700 text-white">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              ATRASADA
                            </Badge>
                          )}
                          {isUrgent && !isOverdue && (
                            <Badge className="text-xs bg-orange-600 hover:bg-orange-700 text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              URGENTE
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 border-2">
                            <User className="h-3 w-3 mr-1" />
                            AÇÃO NECESSÁRIA
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-gray-900 mb-2">{task.title}</CardTitle>
                        {task.description && (
                          <p className="text-sm text-gray-600 leading-relaxed mt-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row md:flex-col gap-2">
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)} border-2`}>
                          <Flag className="h-3 w-3 mr-1" />
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <Badge variant="outline" className={`${getStatusColor(task.status)} border-2`}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {task.due_date && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        isOverdue ? 'bg-red-50 border-2 border-red-200' :
                        isUrgent ? 'bg-orange-50 border-2 border-orange-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        <Calendar className={`h-5 w-5 flex-shrink-0 ${
                          isOverdue ? 'text-red-600' :
                          isUrgent ? 'text-orange-600' :
                          'text-gray-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${
                            isOverdue ? 'text-red-900' :
                            isUrgent ? 'text-orange-900' :
                            'text-gray-900'
                          }`}>
                            Prazo: {format(new Date(task.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          {isOverdue && (
                            <p className="text-xs text-red-700 font-medium mt-1">
                              Vencida há {Math.abs(differenceInDays(new Date(task.due_date), new Date()))} dia(s)
                            </p>
                          )}
                          {isUrgent && !isOverdue && (
                            <p className="text-xs text-orange-700 font-medium mt-1">
                              Vence em {differenceInDays(new Date(task.due_date), new Date())} dia(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tarefas Concluídas</h3>
            <Badge className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white">
              {completedTasks.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <Card key={task.id} className="bg-white shadow-sm border-2 border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <CardTitle className="text-base text-gray-700 line-through">{task.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(task.status)} border-2`}>
                      ✓ {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Help Card */}
      <Card className="bg-blue-50 border-2 border-blue-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <AlertCircle className="h-5 w-5 text-white flex-shrink-0" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-gray-900 mb-1">Precisa de ajuda?</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Se tiver dúvidas sobre alguma tarefa, entre em contato com a equipe do projeto através dos canais de comunicação estabelecidos. Estamos aqui para ajudar!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
