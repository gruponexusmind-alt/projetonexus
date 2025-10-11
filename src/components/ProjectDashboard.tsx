import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { clients } from "./ClientSelector";
import { clientsTimeline, clientsMeetings, TimelineStep, Meeting } from "../data/clientsData";
import { CheckCircle, Clock, AlertCircle, Calendar, TrendingUp } from "lucide-react";

const getNextSteps = (clientId: string, timelineSteps: TimelineStep[]) => {
  const currentStep = timelineSteps.find(step => step.status === "in-progress");
  
  const stepsMap: { [key: string]: string[] } = {
    "1": ["Finalizar desenvolvimento do agente CRM", "Iniciar fase de testes de integração", "Agendar reunião de validação"],
    "2": ["Finalizar estruturação da base de conhecimento", "Realizar testes do chatbot", "Preparar documentação"],
    "3": ["Desenvolver modelo preditivo", "Integrar com sistemas existentes", "Validar precisão das previsões"],
    "4": ["Agendar reunião estratégica", "Definir cronograma detalhado", "Preparar ambiente de desenvolvimento"],
    "5": ["Finalizar testes de usabilidade", "Preparar apresentação para o cliente", "Agendar go-live"],
    "6": ["Finalizar planejamento da migração", "Configurar infraestrutura cloud", "Definir plano de rollback"],
    "7": ["Desenvolver interface de interação", "Integrar com dados corporativos", "Realizar testes de segurança"],
    "8": ["Concluir testes finais", "Preparar treinamento da equipe", "Agendar go-live"],
    "9": ["Iniciar fase de estratégia", "Definir arquitetura do sistema", "Montar equipe de desenvolvimento"],
    "10": ["Finalizar deploy em produção", "Configurar monitoramento", "Iniciar acompanhamento pós-go-live"],
  };
  
  return stepsMap[clientId] || ["Definir próximos passos", "Alinhar com equipe", "Atualizar cronograma"];
};

interface ProjectDashboardProps {
  selectedClient: string;
  cards: any[];
  clients: any[];
}

export function ProjectDashboard({ selectedClient, cards, clients }: ProjectDashboardProps) {
  const currentClient = clients.find(client => client.id === selectedClient);
  const clientCards = cards.filter(card => card.clientId === selectedClient);
  
  // Calculate timeline based on actual client cards
  const timelineSteps = clientsTimeline[selectedClient] || [];
  const meetings = clientsMeetings[selectedClient] || [];
  const nextSteps = getNextSteps(selectedClient, timelineSteps);
  
  const completedSteps = timelineSteps.filter(step => step.status === "completed").length;
  const totalSteps = timelineSteps.length;
  const overallProgress = Math.round((completedSteps / totalSteps) * 100);
  
  const currentStep = timelineSteps.find(step => step.status === "in-progress");
  const currentStepName = currentStep ? currentStep.title : "Aguardando início";

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Client Header */}
        <div className="flex items-center gap-4 mb-6">
          <Badge 
            className="text-white border-0 px-4 py-2 text-lg font-medium"
            style={{ backgroundColor: currentClient?.color }}
          >
            {currentClient?.name}
          </Badge>
        </div>

        {/* Project Status Overview */}
        <Card className="bg-gradient-card shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Status do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Etapa atual: {currentStepName}</span>
                <span className="text-sm text-muted-foreground">{overallProgress}% concluído</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso geral do projeto</span>
              <span>{completedSteps} de {totalSteps} etapas concluídas</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Linha do Tempo das Etapas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {step.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      {step.status === "in-progress" && (
                        <Clock className="h-5 w-5 text-warning animate-pulse" />
                      )}
                      {step.status === "pending" && (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          step.status === "completed" ? "text-success" :
                          step.status === "in-progress" ? "text-foreground" :
                          "text-muted-foreground"
                        }`}>
                          {step.title}
                        </span>
                        <Badge 
                          variant={
                            step.status === "completed" ? "default" :
                            step.status === "in-progress" ? "secondary" :
                            "outline"
                          }
                          className={
                            step.status === "completed" ? "bg-success/10 text-success border-success/20" :
                            step.status === "in-progress" ? "bg-warning/10 text-warning border-warning/20" :
                            "bg-muted/50 text-muted-foreground border-border"
                          }
                        >
                          {step.status === "completed" ? "concluído" :
                           step.status === "in-progress" ? `${step.progress}%` :
                           "não iniciado"}
                        </Badge>
                      </div>
                      {step.status === "in-progress" && step.progress && (
                        <Progress value={step.progress} className="h-2 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps and Meetings */}
          <div className="space-y-6">
            {/* Next Steps */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Meetings */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reuniões Programadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meetings.map((meeting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle 
                          className={`h-4 w-4 ${
                            meeting.completed ? "text-success" : "text-muted-foreground"
                          }`} 
                        />
                        <span className={`text-sm ${
                          meeting.completed ? "text-success" : "text-foreground"
                        }`}>
                          {meeting.name}
                        </span>
                      </div>
                      {meeting.nextDate && (
                        <Badge variant="outline" className="text-xs">
                          {meeting.nextDate}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}