export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  responsible?: string;
  complexity: "baixa" | "media" | "alta";
  progress: number;
  checklist: ChecklistItem[];
  columnId: string;
  clientId: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "pending";
  progress?: number;
  clientId: string;
}

export interface Meeting {
  name: string;
  completed: boolean;
  nextDate?: string;
  clientId: string;
}

export const clientsCards: Card[] = [
  // TechCorp Solutions (Cliente 1)
  {
    id: "1-1",
    title: "Coleta de informações da empresa",
    description: "Levantamento completo das necessidades do cliente TechCorp",
    deadline: "15 dias",
    responsible: "Equipe Comercial",
    complexity: "baixa",
    progress: 100,
    columnId: "onboarding",
    clientId: "1",
    checklist: [
      { id: "1-1-1", text: "Coleta de informações da empresa", completed: true },
      { id: "1-1-2", text: "Definição de objetivos do projeto", completed: true },
      { id: "1-1-3", text: "Acesso a ferramentas e integrações necessárias", completed: true },
      { id: "1-1-4", text: "Agendamento da reunião estratégica", completed: true },
    ],
  },
  {
    id: "1-2",
    title: "Agente de Vendas CRM",
    description: "Desenvolvimento do agente de vendas integrado ao Salesforce",
    deadline: "30 dias",
    responsible: "Dev Team Alpha",
    complexity: "alta",
    progress: 75,
    columnId: "development",
    clientId: "1",
    checklist: [
      { id: "1-2-1", text: "Criação do fluxo de conversa", completed: true },
      { id: "1-2-2", text: "Treinamento do modelo", completed: true },
      { id: "1-2-3", text: "Integrações (Salesforce, WhatsApp)", completed: true },
      { id: "1-2-4", text: "Revisão interna", completed: false },
    ],
  },
  
  // Innovate Digital (Cliente 2)
  {
    id: "2-1",
    title: "Mapeamento de Processos",
    description: "Análise dos processos atuais da Innovate Digital",
    deadline: "10 dias",
    responsible: "Arquiteto de Soluções",
    complexity: "media",
    progress: 100,
    columnId: "strategy",
    clientId: "2",
    checklist: [
      { id: "2-1-1", text: "Mapeamento dos processos atuais", completed: true },
      { id: "2-1-2", text: "Desenho da arquitetura da IA", completed: true },
      { id: "2-1-3", text: "Apresentação ao cliente", completed: true },
      { id: "2-1-4", text: "Aprovação da estratégia", completed: true },
    ],
  },
  {
    id: "2-2",
    title: "Chatbot de Suporte",
    description: "Bot inteligente para atendimento 24/7",
    deadline: "25 dias",
    responsible: "Dev Team Beta",
    complexity: "media",
    progress: 40,
    columnId: "development",
    clientId: "2",
    checklist: [
      { id: "2-2-1", text: "Levantamento de FAQs", completed: true },
      { id: "2-2-2", text: "Estruturação de base de conhecimento", completed: false },
      { id: "2-2-3", text: "Testes de atendimento", completed: false },
      { id: "2-2-4", text: "Aprovação", completed: false },
    ],
  },

  // FutureAI Labs (Cliente 3) 
  {
    id: "3-1",
    title: "Análise Preditiva de Vendas",
    description: "IA para previsão de vendas e tendências de mercado",
    deadline: "45 dias",
    responsible: "Data Science Team",
    complexity: "alta",
    progress: 20,
    columnId: "development",
    clientId: "3",
    checklist: [
      { id: "3-1-1", text: "Coleta e análise de dados históricos", completed: true },
      { id: "3-1-2", text: "Desenvolvimento do modelo preditivo", completed: false },
      { id: "3-1-3", text: "Integração com sistemas existentes", completed: false },
      { id: "3-1-4", text: "Testes de precisão", completed: false },
    ],
  },

  // SmartBiz Automation (Cliente 4)
  {
    id: "4-1",
    title: "Coleta de Requisitos",
    description: "Levantamento das necessidades de automação",
    deadline: "12 dias",
    responsible: "Equipe Comercial",
    complexity: "baixa",
    progress: 60,
    columnId: "onboarding",
    clientId: "4",
    checklist: [
      { id: "4-1-1", text: "Coleta de informações da empresa", completed: true },
      { id: "4-1-2", text: "Definição de objetivos do projeto", completed: true },
      { id: "4-1-3", text: "Acesso a ferramentas e integrações necessárias", completed: true },
      { id: "4-1-4", text: "Agendamento da reunião estratégica", completed: false },
    ],
  },

  // NextGen Analytics (Cliente 5)
  {
    id: "5-1",
    title: "Dashboard Inteligente",
    description: "Painel de controle com insights automáticos",
    deadline: "35 dias",
    responsible: "Frontend Team",
    complexity: "media",
    progress: 85,
    columnId: "validation",
    clientId: "5",
    checklist: [
      { id: "5-1-1", text: "Design das interfaces", completed: true },
      { id: "5-1-2", text: "Implementação dos gráficos", completed: true },
      { id: "5-1-3", text: "Integração com IA de insights", completed: true },
      { id: "5-1-4", text: "Testes de usabilidade", completed: false },
    ],
  },

  // CloudFirst Systems (Cliente 6)
  {
    id: "6-1",
    title: "Migração para Cloud IA",
    description: "Migração de sistemas legados com IA",
    deadline: "60 dias",
    responsible: "Cloud Team",
    complexity: "alta",
    progress: 15,
    columnId: "strategy",
    clientId: "6",
    checklist: [
      { id: "6-1-1", text: "Auditoria dos sistemas atuais", completed: true },
      { id: "6-1-2", text: "Planejamento da migração", completed: false },
      { id: "6-1-3", text: "Setup da infraestrutura", completed: false },
      { id: "6-1-4", text: "Plano de contingência", completed: false },
    ],
  },

  // DataDriven Co (Cliente 7)
  {
    id: "7-1",
    title: "Assistente Virtual Executivo",
    description: "IA para auxílio em decisões estratégicas",
    deadline: "40 dias",
    responsible: "AI Strategy Team",
    complexity: "alta",
    progress: 50,
    columnId: "development",
    clientId: "7",
    checklist: [
      { id: "7-1-1", text: "Definição de casos de uso", completed: true },
      { id: "7-1-2", text: "Treinamento do modelo", completed: true },
      { id: "7-1-3", text: "Interface de interação", completed: false },
      { id: "7-1-4", text: "Integração com dados corporativos", completed: false },
    ],
  },

  // AI Revolution Inc (Cliente 8)
  {
    id: "8-1",
    title: "Automatização de Processos RH",
    description: "IA para seleção e gestão de candidatos",
    deadline: "30 dias",
    responsible: "HR Tech Team",
    complexity: "media",
    progress: 90,
    columnId: "validation",
    clientId: "8",
    checklist: [
      { id: "8-1-1", text: "Análise de currículos automatizada", completed: true },
      { id: "8-1-2", text: "Sistema de matching", completed: true },
      { id: "8-1-3", text: "Interface para RH", completed: true },
      { id: "8-1-4", text: "Testes finais", completed: false },
    ],
  },

  // Quantum Solutions (Cliente 9)
  {
    id: "9-1",
    title: "Início do Projeto",
    description: "Kickoff e definição do escopo",
    deadline: "5 dias",
    responsible: "Project Manager",
    complexity: "baixa",
    progress: 100,
    columnId: "onboarding",
    clientId: "9",
    checklist: [
      { id: "9-1-1", text: "Reunião de kickoff", completed: true },
      { id: "9-1-2", text: "Definição de escopo", completed: true },
      { id: "9-1-3", text: "Cronograma inicial", completed: true },
      { id: "9-1-4", text: "Setup do ambiente", completed: true },
    ],
  },

  // Digital Transform Ltd (Cliente 10)
  {
    id: "10-1",
    title: "E-commerce Inteligente",
    description: "Plataforma de vendas com recomendações IA",
    deadline: "50 dias",
    responsible: "E-commerce Team",
    complexity: "alta",
    progress: 95,
    columnId: "delivery",
    clientId: "10",
    checklist: [
      { id: "10-1-1", text: "Desenvolvimento da plataforma", completed: true },
      { id: "10-1-2", text: "Sistema de recomendações", completed: true },
      { id: "10-1-3", text: "Testes de performance", completed: true },
      { id: "10-1-4", text: "Deploy em produção", completed: false },
    ],
  },
];

export const clientsTimeline: { [clientId: string]: TimelineStep[] } = {
  "1": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "1" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "1" },
    { id: "development", title: "Desenvolvimento", status: "in-progress", progress: 75, clientId: "1" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "1" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "1" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "1" },
  ],
  "2": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "2" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "2" },
    { id: "development", title: "Desenvolvimento", status: "in-progress", progress: 40, clientId: "2" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "2" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "2" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "2" },
  ],
  "3": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "3" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "3" },
    { id: "development", title: "Desenvolvimento", status: "in-progress", progress: 20, clientId: "3" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "3" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "3" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "3" },
  ],
  "4": [
    { id: "onboarding", title: "Onboarding", status: "in-progress", progress: 60, clientId: "4" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "pending", clientId: "4" },
    { id: "development", title: "Desenvolvimento", status: "pending", clientId: "4" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "4" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "4" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "4" },
  ],
  "5": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "5" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "5" },
    { id: "development", title: "Desenvolvimento", status: "completed", clientId: "5" },
    { id: "validation", title: "Validação & Testes", status: "in-progress", progress: 85, clientId: "5" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "5" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "5" },
  ],
  "6": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "6" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "in-progress", progress: 15, clientId: "6" },
    { id: "development", title: "Desenvolvimento", status: "pending", clientId: "6" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "6" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "6" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "6" },
  ],
  "7": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "7" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "7" },
    { id: "development", title: "Desenvolvimento", status: "in-progress", progress: 50, clientId: "7" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "7" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "7" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "7" },
  ],
  "8": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "8" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "8" },
    { id: "development", title: "Desenvolvimento", status: "completed", clientId: "8" },
    { id: "validation", title: "Validação & Testes", status: "in-progress", progress: 90, clientId: "8" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "8" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "8" },
  ],
  "9": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "9" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "pending", clientId: "9" },
    { id: "development", title: "Desenvolvimento", status: "pending", clientId: "9" },
    { id: "validation", title: "Validação & Testes", status: "pending", clientId: "9" },
    { id: "delivery", title: "Entrega / Go Live", status: "pending", clientId: "9" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "9" },
  ],
  "10": [
    { id: "onboarding", title: "Onboarding", status: "completed", clientId: "10" },
    { id: "strategy", title: "Estratégia & Arquitetura", status: "completed", clientId: "10" },
    { id: "development", title: "Desenvolvimento", status: "completed", clientId: "10" },
    { id: "validation", title: "Validação & Testes", status: "completed", clientId: "10" },
    { id: "delivery", title: "Entrega / Go Live", status: "in-progress", progress: 95, clientId: "10" },
    { id: "tracking", title: "Acompanhamento", status: "pending", clientId: "10" },
  ],
};

export const clientsMeetings: { [clientId: string]: Meeting[] } = {
  "1": [
    { name: "Onboarding", completed: true, clientId: "1" },
    { name: "Estratégica", completed: true, clientId: "1" },
    { name: "Validação", completed: false, nextDate: "20/11/2024", clientId: "1" },
    { name: "Go Live", completed: false, clientId: "1" },
    { name: "Acompanhamento mensal", completed: false, clientId: "1" },
  ],
  "2": [
    { name: "Onboarding", completed: true, clientId: "2" },
    { name: "Estratégica", completed: true, clientId: "2" },
    { name: "Validação", completed: false, nextDate: "25/11/2024", clientId: "2" },
    { name: "Go Live", completed: false, clientId: "2" },
    { name: "Acompanhamento mensal", completed: false, clientId: "2" },
  ],
  "3": [
    { name: "Onboarding", completed: true, clientId: "3" },
    { name: "Estratégica", completed: true, clientId: "3" },
    { name: "Validação", completed: false, nextDate: "30/11/2024", clientId: "3" },
    { name: "Go Live", completed: false, clientId: "3" },
    { name: "Acompanhamento mensal", completed: false, clientId: "3" },
  ],
  "4": [
    { name: "Onboarding", completed: false, nextDate: "18/11/2024", clientId: "4" },
    { name: "Estratégica", completed: false, clientId: "4" },
    { name: "Validação", completed: false, clientId: "4" },
    { name: "Go Live", completed: false, clientId: "4" },
    { name: "Acompanhamento mensal", completed: false, clientId: "4" },
  ],
  "5": [
    { name: "Onboarding", completed: true, clientId: "5" },
    { name: "Estratégica", completed: true, clientId: "5" },
    { name: "Validação", completed: false, nextDate: "22/11/2024", clientId: "5" },
    { name: "Go Live", completed: false, nextDate: "05/12/2024", clientId: "5" },
    { name: "Acompanhamento mensal", completed: false, clientId: "5" },
  ],
  "6": [
    { name: "Onboarding", completed: true, clientId: "6" },
    { name: "Estratégica", completed: false, nextDate: "28/11/2024", clientId: "6" },
    { name: "Validação", completed: false, clientId: "6" },
    { name: "Go Live", completed: false, clientId: "6" },
    { name: "Acompanhamento mensal", completed: false, clientId: "6" },
  ],
  "7": [
    { name: "Onboarding", completed: true, clientId: "7" },
    { name: "Estratégica", completed: true, clientId: "7" },
    { name: "Validação", completed: false, nextDate: "02/12/2024", clientId: "7" },
    { name: "Go Live", completed: false, clientId: "7" },
    { name: "Acompanhamento mensal", completed: false, clientId: "7" },
  ],
  "8": [
    { name: "Onboarding", completed: true, clientId: "8" },
    { name: "Estratégica", completed: true, clientId: "8" },
    { name: "Validação", completed: false, nextDate: "15/11/2024", clientId: "8" },
    { name: "Go Live", completed: false, nextDate: "01/12/2024", clientId: "8" },
    { name: "Acompanhamento mensal", completed: false, clientId: "8" },
  ],
  "9": [
    { name: "Onboarding", completed: true, clientId: "9" },
    { name: "Estratégica", completed: false, nextDate: "21/11/2024", clientId: "9" },
    { name: "Validação", completed: false, clientId: "9" },
    { name: "Go Live", completed: false, clientId: "9" },
    { name: "Acompanhamento mensal", completed: false, clientId: "9" },
  ],
  "10": [
    { name: "Onboarding", completed: true, clientId: "10" },
    { name: "Estratégica", completed: true, clientId: "10" },
    { name: "Validação", completed: true, clientId: "10" },
    { name: "Go Live", completed: false, nextDate: "12/11/2024", clientId: "10" },
    { name: "Acompanhamento mensal", completed: false, nextDate: "15/12/2024", clientId: "10" },
  ],
};