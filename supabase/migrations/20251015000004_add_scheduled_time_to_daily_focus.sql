-- =========================================
-- ADICIONAR HORÁRIO AGENDADO ÀS TAREFAS DO DIA
-- =========================================
-- Esta migration adiciona o campo scheduled_time para permitir
-- que usuários agendem tarefas em horários específicos do dia

-- Adicionar coluna scheduled_time
ALTER TABLE public.gp_daily_task_focus
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Adicionar índice para consultas por horário
CREATE INDEX IF NOT EXISTS idx_daily_task_focus_scheduled_time
ON gp_daily_task_focus(scheduled_time)
WHERE scheduled_time IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.gp_daily_task_focus.scheduled_time
IS 'Horário específico agendado para a tarefa (ex: 09:00:00, 14:30:00). NULL significa tarefa não agendada em horário específico';

-- Recriar view com horário agendado
-- Precisamos dropar e recriar porque estamos adicionando uma coluna no meio
DROP VIEW IF EXISTS v_daily_task_focus_detailed;

CREATE VIEW v_daily_task_focus_detailed AS
SELECT
  dtf.id,
  dtf.user_id,
  dtf.task_id,
  dtf.focus_date,
  dtf.priority_order,
  dtf.estimated_time_minutes,
  dtf.actual_time_minutes,
  dtf.completed as focus_completed,
  dtf.notes,
  dtf.scheduled_time,
  dtf.created_at,
  dtf.updated_at,

  -- Informações da tarefa
  t.title as task_title,
  t.description as task_description,
  t.status as task_status,
  t.priority as task_priority,
  t.due_date as task_due_date,
  t.progress as task_progress,
  t.project_id,

  -- Informações do projeto
  p.title as project_title,
  p.status as project_status,

  -- Informações do usuário
  u.nome as user_name

FROM gp_daily_task_focus dtf
JOIN gp_tasks t ON dtf.task_id = t.id
JOIN gp_projects p ON t.project_id = p.id
JOIN profiles u ON dtf.user_id = u.id;

COMMENT ON VIEW v_daily_task_focus_detailed
IS 'View detalhada de tarefas focadas do dia incluindo horário agendado';
