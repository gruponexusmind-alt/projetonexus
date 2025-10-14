import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  start_date: string;
  deadline: string;
  budget: number;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface Task {
  title: string;
  status: string;
  priority: string;
  assigned_to?: string;
  assignee?: { nome: string };
  due_date?: string;
  progress: number;
  stage?: { name: string };
}

interface Stage {
  name: string;
  is_current: boolean;
  completed_at: string | null;
}

interface Expectation {
  title: string;
  description: string;
  is_done: boolean;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  review: number;
  completed: number;
}

interface Meeting {
  title: string;
  meeting_date: string;
  notes?: string;
}

interface Document {
  name: string;
  file_type?: string;
  created_at: string;
}

export interface ProjectExportData {
  project: ProjectData;
  tasks: Task[];
  stages: Stage[];
  expectations: Expectation[];
  taskStats: TaskStats;
  meetings: Meeting[];
  documents: Document[];
}

const PRIMARY_COLOR = [99, 102, 241]; // Indigo-600
const SECONDARY_COLOR = [129, 140, 248]; // Indigo-400
const TEXT_DARK = [17, 24, 39]; // Gray-900
const TEXT_LIGHT = [107, 114, 128]; // Gray-500

export async function generateProjectPDF(data: ProjectExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add page header
  const addPageHeader = (pageNum: number) => {
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(data.project.title, 14, 10);
    doc.setTextColor(...TEXT_DARK);
  };

  // Helper function to add page footer
  const addPageFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_LIGHT);
    doc.text(
      `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} - Página ${pageNum}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // Helper function to check if we need a new page
  const checkNewPage = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      currentPage++;
      addPageHeader(currentPage);
      yPosition = 25;
      return true;
    }
    return false;
  };

  let currentPage = 1;
  addPageHeader(currentPage);

  // === 1. CAPA ===
  yPosition = pageHeight / 3;
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Relatório do Projeto', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(22);
  doc.setTextColor(...TEXT_DARK);
  doc.text(data.project.title, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 20;
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Cliente: ${data.project.client.name}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.text(
    `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  addPageFooter(currentPage);

  // === 2. INFORMAÇÕES GERAIS ===
  doc.addPage();
  currentPage++;
  addPageHeader(currentPage);
  yPosition = 25;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Informações Gerais do Projeto', 14, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);

  const infoData = [
    ['Nome do Projeto', data.project.title],
    ['Descrição', data.project.description || 'Não informado'],
    ['Status', translateStatus(data.project.status)],
    ['Prioridade', translatePriority(data.project.priority)],
    ['Progresso', `${data.project.progress}%`],
    ['Orçamento', `R$ ${data.project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Data de Início', data.project.start_date ? format(new Date(data.project.start_date), 'dd/MM/yyyy') : 'Não definida'],
    ['Prazo', data.project.deadline ? format(new Date(data.project.deadline), 'dd/MM/yyyy') : 'Não definido'],
    ['Cliente', data.project.client.name],
    ['Email do Cliente', data.project.client.email],
    ['Telefone do Cliente', data.project.client.phone || 'Não informado'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: infoData,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === 3. ETAPAS DO PROJETO ===
  checkNewPage(20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Etapas do Projeto', 14, yPosition);
  yPosition += 5;

  const stagesData = data.stages.map((stage) => [
    stage.name,
    stage.is_current ? '✓ Em andamento' : stage.completed_at ? '✓ Concluída' : 'Pendente',
    stage.completed_at ? format(new Date(stage.completed_at), 'dd/MM/yyyy') : '-',
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Etapa', 'Status', 'Data de Conclusão']],
    body: stagesData,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === 4. EXPECTATIVAS DO CLIENTE ===
  checkNewPage(20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Expectativas do Cliente', 14, yPosition);
  yPosition += 5;

  const expectationsData = data.expectations.map((exp) => [
    exp.title,
    exp.description,
    exp.is_done ? '✓ Atendida' : 'Pendente',
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Expectativa', 'Descrição', 'Status']],
    body: expectationsData.length > 0 ? expectationsData : [['Nenhuma expectativa cadastrada', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === 5. ESTATÍSTICAS DE TAREFAS ===
  checkNewPage(50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Estatísticas de Tarefas', 14, yPosition);
  yPosition += 10;

  const statsData = [
    ['Total de Tarefas', data.taskStats.total.toString()],
    ['Pendentes', data.taskStats.pending.toString()],
    ['Em Progresso', data.taskStats.in_progress.toString()],
    ['Em Revisão', data.taskStats.review.toString()],
    ['Concluídas', data.taskStats.completed.toString()],
    [
      'Taxa de Conclusão',
      `${Math.round((data.taskStats.completed / data.taskStats.total) * 100)}%`,
    ],
  ];

  autoTable(doc, {
    startY: yPosition,
    body: statsData,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, fillColor: [249, 250, 251] },
      1: { cellWidth: 'auto', fontSize: 12, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === 6. TAREFAS DETALHADAS ===
  checkNewPage(20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Tarefas Detalhadas', 14, yPosition);
  yPosition += 5;

  const tasksData = data.tasks.map((task) => [
    task.title,
    translateStatus(task.status),
    translatePriority(task.priority),
    task.assignee?.nome || task.assigned_to || 'Não atribuído',
    task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-',
    `${task.progress}%`,
    task.stage?.name || '-',
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Tarefa', 'Status', 'Prioridade', 'Responsável', 'Prazo', 'Progresso', 'Etapa']],
    body: tasksData.length > 0 ? tasksData : [['Nenhuma tarefa cadastrada', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 25 },
      2: { cellWidth: 22 },
      3: { cellWidth: 30 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 25 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === 7. REUNIÕES REALIZADAS ===
  checkNewPage(20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Reuniões Realizadas', 14, yPosition);
  yPosition += 5;

  const meetingsData = data.meetings.map((meeting) => [
    meeting.title,
    format(new Date(meeting.meeting_date), 'dd/MM/yyyy HH:mm'),
    meeting.notes || 'Sem anotações',
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Reunião', 'Data', 'Notas']],
    body: meetingsData.length > 0 ? meetingsData : [['Nenhuma reunião registrada', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35 },
      2: { cellWidth: 'auto' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // === 8. DOCUMENTOS DO PROJETO ===
  checkNewPage(20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Documentos do Projeto', 14, yPosition);
  yPosition += 5;

  const documentsData = data.documents.map((doc) => [
    doc.name,
    doc.file_type || 'N/A',
    format(new Date(doc.created_at), 'dd/MM/yyyy'),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Nome do Documento', 'Tipo', 'Data de Upload']],
    body: documentsData.length > 0 ? documentsData : [['Nenhum documento anexado', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR },
    margin: { left: 14, right: 14 },
  });

  addPageFooter(currentPage);

  // Save PDF
  const filename = `Projeto_${data.project.title.replace(/[^a-z0-9]/gi, '_')}_${format(
    new Date(),
    'yyyy-MM-dd'
  )}.pdf`;
  doc.save(filename);
}

function translateStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: 'Pendente',
    in_progress: 'Em Progresso',
    review: 'Em Revisão',
    completed: 'Concluído',
    onboarding: 'Onboarding',
    strategy: 'Estratégia',
    development: 'Desenvolvimento',
    validation: 'Validação',
    delivery: 'Entrega',
    paused: 'Pausado',
  };
  return statusMap[status] || status;
}

function translatePriority(priority: string): string {
  const priorityMap: { [key: string]: string } = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };
  return priorityMap[priority] || priority;
}
