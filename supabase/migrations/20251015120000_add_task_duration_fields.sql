-- Adicionar campos para suportar tarefas com duração expandida
ALTER TABLE gp_daily_task_focus
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4,2) DEFAULT 1.0;

-- Migrar dados existentes de scheduled_time para start_time
UPDATE gp_daily_task_focus
SET start_time = scheduled_time::TIME
WHERE scheduled_time IS NOT NULL AND start_time IS NULL;

-- Calcular end_time baseado em estimated_time_minutes
UPDATE gp_daily_task_focus
SET end_time = (start_time + INTERVAL '1 minute' * COALESCE(estimated_time_minutes, 60))::TIME,
    duration_hours = ROUND(COALESCE(estimated_time_minutes, 60) / 60.0, 2)
WHERE start_time IS NOT NULL AND end_time IS NULL;

-- Comentários
COMMENT ON COLUMN gp_daily_task_focus.start_time IS 'Horário de início da tarefa';
COMMENT ON COLUMN gp_daily_task_focus.end_time IS 'Horário de término da tarefa';
COMMENT ON COLUMN gp_daily_task_focus.duration_hours IS 'Duração da tarefa em horas';
