-- =========================================
-- SISTEMA DE TIME TRACKING
-- =========================================
-- Esta migration implementa um sistema completo de rastreamento de tempo
-- incluindo timer, time entries, e análises de estimativa vs real

-- =========================================
-- 1. TABELA: gp_time_entries
-- =========================================
-- Armazena cada sessão de trabalho (inspirado em Toggl/Harvest)

CREATE TABLE IF NOT EXISTS public.gp_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES gp_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  company_id UUID NOT NULL,

  -- Tempo da sessão
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,  -- NULL = timer ainda rodando
  duration_minutes INTEGER,  -- Calculado automaticamente via trigger

  -- Metadados
  description TEXT,  -- Nota sobre o que foi feito nesta sessão
  is_billable BOOLEAN DEFAULT false,  -- Para futuro (faturamento a clientes)
  entry_type TEXT DEFAULT 'timer' CHECK (entry_type IN ('timer', 'manual')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_time_entries_task ON gp_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON gp_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company ON gp_time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON gp_time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_active ON gp_time_entries(user_id, task_id)
  WHERE end_time IS NULL;  -- Para encontrar timers ativos rapidamente

-- Comentários
COMMENT ON TABLE public.gp_time_entries IS 'Registro de todas as sessões de trabalho (time tracking)';
COMMENT ON COLUMN public.gp_time_entries.start_time IS 'Início da sessão de trabalho';
COMMENT ON COLUMN public.gp_time_entries.end_time IS 'Fim da sessão. NULL indica timer ainda rodando';
COMMENT ON COLUMN public.gp_time_entries.duration_minutes IS 'Duração em minutos, calculada automaticamente';
COMMENT ON COLUMN public.gp_time_entries.entry_type IS 'timer = iniciado via cronômetro, manual = inserido manualmente';

-- =========================================
-- 2. TRIGGER: Calcular duração automaticamente
-- =========================================

CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular duration_minutes quando end_time é definido
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes = ROUND(EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60);
  ELSE
    NEW.duration_minutes = NULL;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_time_entry_duration
BEFORE INSERT OR UPDATE ON gp_time_entries
FOR EACH ROW EXECUTE FUNCTION calculate_time_entry_duration();

-- =========================================
-- 3. ATUALIZAR: gp_tasks com campos de minutos
-- =========================================

-- Adicionar novos campos em minutos (mais preciso que horas)
ALTER TABLE public.gp_tasks
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS actual_time_minutes INTEGER DEFAULT 0;

-- Migrar dados existentes de horas para minutos (1h = 60min)
UPDATE public.gp_tasks
SET
  estimated_time_minutes = COALESCE(estimated_hours * 60, 0),
  actual_time_minutes = COALESCE(actual_hours * 60, 0)
WHERE estimated_time_minutes IS NULL;

-- Comentários
COMMENT ON COLUMN public.gp_tasks.estimated_time_minutes IS 'Tempo estimado em minutos (mais preciso que horas). Substitui estimated_hours';
COMMENT ON COLUMN public.gp_tasks.actual_time_minutes IS 'Tempo real gasto em minutos, calculado da soma de time_entries';

-- =========================================
-- 4. TRIGGER: Atualizar actual_time_minutes automaticamente
-- =========================================

CREATE OR REPLACE FUNCTION update_task_actual_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o tempo total da tarefa quando time entry é criado/atualizado/deletado
  UPDATE gp_tasks
  SET actual_time_minutes = (
    SELECT COALESCE(SUM(duration_minutes), 0)
    FROM gp_time_entries
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
      AND end_time IS NOT NULL  -- Só contar entries finalizados
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_actual_time_insert
AFTER INSERT ON gp_time_entries
FOR EACH ROW EXECUTE FUNCTION update_task_actual_time();

CREATE TRIGGER trigger_update_task_actual_time_update
AFTER UPDATE ON gp_time_entries
FOR EACH ROW
WHEN (OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes)
EXECUTE FUNCTION update_task_actual_time();

CREATE TRIGGER trigger_update_task_actual_time_delete
AFTER DELETE ON gp_time_entries
FOR EACH ROW EXECUTE FUNCTION update_task_actual_time();

-- =========================================
-- 5. VIEW: v_task_time_summary
-- =========================================
-- View agregada com análise de tempo estimado vs real

CREATE OR REPLACE VIEW v_task_time_summary AS
SELECT
  t.id as task_id,
  t.title,
  t.status,
  t.priority,
  t.project_id,
  t.assigned_to,

  -- Tempos
  t.estimated_time_minutes,
  t.actual_time_minutes,

  -- Agregações de time entries
  COALESCE(SUM(te.duration_minutes) FILTER (WHERE te.end_time IS NOT NULL), 0) as total_tracked_minutes,
  COUNT(te.id) FILTER (WHERE te.end_time IS NOT NULL) as completed_entries_count,
  COUNT(te.id) FILTER (WHERE te.end_time IS NULL) as active_timers_count,

  -- Análise de progresso
  CASE
    WHEN t.estimated_time_minutes > 0 THEN
      ROUND((t.actual_time_minutes::NUMERIC / t.estimated_time_minutes) * 100, 1)
    ELSE NULL
  END as time_completion_percentage,

  -- Variância (diferença estimado vs real)
  CASE
    WHEN t.estimated_time_minutes > 0 THEN
      t.actual_time_minutes - t.estimated_time_minutes
    ELSE NULL
  END as time_variance_minutes,  -- Positivo = gastou mais, Negativo = gastou menos

  -- Classificação de variância
  CASE
    WHEN t.estimated_time_minutes = 0 THEN 'no_estimate'
    WHEN t.actual_time_minutes = 0 THEN 'not_started'
    WHEN t.actual_time_minutes <= t.estimated_time_minutes * 0.75 THEN 'under_estimated_time'
    WHEN t.actual_time_minutes <= t.estimated_time_minutes THEN 'on_track'
    WHEN t.actual_time_minutes <= t.estimated_time_minutes * 1.25 THEN 'slightly_over'
    ELSE 'significantly_over'
  END as time_status,

  -- Timer ativo?
  BOOL_OR(te.end_time IS NULL) as has_active_timer,

  -- Timestamps
  t.created_at,
  t.updated_at

FROM gp_tasks t
LEFT JOIN gp_time_entries te ON t.id = te.task_id
GROUP BY
  t.id, t.title, t.status, t.priority, t.project_id, t.assigned_to,
  t.estimated_time_minutes, t.actual_time_minutes, t.created_at, t.updated_at;

COMMENT ON VIEW v_task_time_summary IS 'Visão agregada de tempo das tarefas com análise estimado vs real';

-- =========================================
-- 6. VIEW: v_user_time_summary
-- =========================================
-- Resumo de tempo por usuário (para dashboards)

CREATE OR REPLACE VIEW v_user_time_summary AS
SELECT
  u.id as user_id,
  u.nome as user_name,

  -- Tempo hoje
  COALESCE(SUM(te.duration_minutes) FILTER (
    WHERE te.start_time::DATE = CURRENT_DATE
      AND te.end_time IS NOT NULL
  ), 0) as today_minutes,

  -- Tempo esta semana
  COALESCE(SUM(te.duration_minutes) FILTER (
    WHERE te.start_time >= DATE_TRUNC('week', CURRENT_DATE)
      AND te.end_time IS NOT NULL
  ), 0) as week_minutes,

  -- Tempo este mês
  COALESCE(SUM(te.duration_minutes) FILTER (
    WHERE te.start_time >= DATE_TRUNC('month', CURRENT_DATE)
      AND te.end_time IS NOT NULL
  ), 0) as month_minutes,

  -- Timers ativos
  COUNT(*) FILTER (WHERE te.end_time IS NULL) as active_timers,

  -- Última atividade
  MAX(te.start_time) as last_activity

FROM profiles u
LEFT JOIN gp_time_entries te ON u.id = te.user_id
GROUP BY u.id, u.nome;

COMMENT ON VIEW v_user_time_summary IS 'Resumo de tempo por usuário para dashboards';

-- =========================================
-- 7. RLS (Row Level Security)
-- =========================================

ALTER TABLE gp_time_entries ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver/editar apenas suas próprias entries
CREATE POLICY "Users can view own time entries"
  ON gp_time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON gp_time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON gp_time_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"
  ON gp_time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas as entries da empresa
CREATE POLICY "Admins can view all company time entries"
  ON gp_time_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.company_id = gp_time_entries.company_id
    )
  );

-- =========================================
-- 8. FUNCTION: Verificar timer ativo
-- =========================================

CREATE OR REPLACE FUNCTION get_active_timer(p_user_id UUID)
RETURNS TABLE (
  entry_id UUID,
  task_id UUID,
  task_title TEXT,
  start_time TIMESTAMPTZ,
  elapsed_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    te.id as entry_id,
    te.task_id,
    t.title as task_title,
    te.start_time,
    ROUND(EXTRACT(EPOCH FROM (now() - te.start_time)) / 60)::INTEGER as elapsed_minutes
  FROM gp_time_entries te
  JOIN gp_tasks t ON te.task_id = t.id
  WHERE te.user_id = p_user_id
    AND te.end_time IS NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_timer IS 'Retorna o timer ativo do usuário, se houver';

-- =========================================
-- FIM DA MIGRATION
-- =========================================
