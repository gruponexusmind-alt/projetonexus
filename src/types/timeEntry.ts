// =========================================
// TIPOS: Sistema de Time Tracking
// =========================================

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  company_id: string;
  start_time: string;  // ISO timestamp
  end_time: string | null;  // null = timer ainda rodando
  duration_minutes: number | null;
  description: string | null;
  is_billable: boolean;
  entry_type: 'timer' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface TaskTimeSummary {
  task_id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  assigned_to: string | null;
  estimated_time_minutes: number | null;
  actual_time_minutes: number;
  total_tracked_minutes: number;
  completed_entries_count: number;
  active_timers_count: number;
  time_completion_percentage: number | null;
  time_variance_minutes: number | null;
  time_status: 'no_estimate' | 'not_started' | 'under_estimated_time' | 'on_track' | 'slightly_over' | 'significantly_over';
  has_active_timer: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTimeSummary {
  user_id: string;
  user_name: string;
  today_minutes: number;
  week_minutes: number;
  month_minutes: number;
  active_timers: number;
  last_activity: string | null;
}

export interface ActiveTimer {
  entry_id: string;
  task_id: string;
  task_title: string;
  start_time: string;
  elapsed_minutes: number;
}

export interface TimeEntryInput {
  task_id: string;
  start_time: string;
  end_time?: string | null;
  description?: string;
  is_billable?: boolean;
  entry_type?: 'timer' | 'manual';
}

// Helper function para formatar tempo
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

// Helper function para converter HH:MM para minutos
export function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function para converter minutos para HH:MM
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper para obter cor baseada no status de tempo
export function getTimeStatusColor(status: TaskTimeSummary['time_status']): string {
  const colors = {
    no_estimate: 'text-gray-500 bg-gray-100',
    not_started: 'text-blue-500 bg-blue-100',
    under_estimated_time: 'text-green-600 bg-green-100',
    on_track: 'text-green-600 bg-green-100',
    slightly_over: 'text-yellow-600 bg-yellow-100',
    significantly_over: 'text-red-600 bg-red-100',
  };

  return colors[status] || colors.no_estimate;
}

// Helper para obter label baseado no status
export function getTimeStatusLabel(status: TaskTimeSummary['time_status']): string {
  const labels = {
    no_estimate: 'Sem Estimativa',
    not_started: 'Não Iniciado',
    under_estimated_time: 'Abaixo do Tempo',
    on_track: 'No Prazo',
    slightly_over: 'Levemente Acima',
    significantly_over: 'Muito Acima',
  };

  return labels[status] || labels.no_estimate;
}
