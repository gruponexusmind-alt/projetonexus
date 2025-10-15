-- =========================================
-- TABELA DE TAREFAS FOCADAS DO DIA
-- =========================================
-- Esta migration cria a tabela para gerenciar as tarefas que o usuário
-- prioriza para cada dia (funcionalidade "Meu Dia")

CREATE TABLE IF NOT EXISTS public.gp_daily_task_focus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES gp_tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  focus_date DATE NOT NULL,
  priority_order INTEGER DEFAULT 0,
  estimated_time_minutes INTEGER,
  actual_time_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraint para garantir que uma tarefa não seja duplicada no mesmo dia
  UNIQUE(user_id, task_id, focus_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_task_focus_user_id ON gp_daily_task_focus(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_focus_task_id ON gp_daily_task_focus(task_id);
CREATE INDEX IF NOT EXISTS idx_daily_task_focus_date ON gp_daily_task_focus(focus_date);
CREATE INDEX IF NOT EXISTS idx_daily_task_focus_user_date ON gp_daily_task_focus(user_id, focus_date);
CREATE INDEX IF NOT EXISTS idx_daily_task_focus_company ON gp_daily_task_focus(company_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gp_daily_task_focus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp_daily_task_focus_updated_at ON gp_daily_task_focus;
CREATE TRIGGER trigger_update_gp_daily_task_focus_updated_at
  BEFORE UPDATE ON gp_daily_task_focus
  FOR EACH ROW
  EXECUTE FUNCTION update_gp_daily_task_focus_updated_at();

-- RLS Policies
ALTER TABLE gp_daily_task_focus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own daily focus" ON gp_daily_task_focus;
CREATE POLICY "Users can view their own daily focus"
  ON gp_daily_task_focus FOR SELECT
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own daily focus" ON gp_daily_task_focus;
CREATE POLICY "Users can insert their own daily focus"
  ON gp_daily_task_focus FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
    AND company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own daily focus" ON gp_daily_task_focus;
CREATE POLICY "Users can update their own daily focus"
  ON gp_daily_task_focus FOR UPDATE
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own daily focus" ON gp_daily_task_focus;
CREATE POLICY "Users can delete their own daily focus"
  ON gp_daily_task_focus FOR DELETE
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- View para facilitar consultas
CREATE OR REPLACE VIEW v_daily_task_focus_detailed AS
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

-- Comentários
COMMENT ON TABLE public.gp_daily_task_focus IS 'Tarefas priorizadas pelo usuário para cada dia (funcionalidade "Meu Dia")';
COMMENT ON COLUMN public.gp_daily_task_focus.focus_date IS 'Data para a qual a tarefa foi priorizada';
COMMENT ON COLUMN public.gp_daily_task_focus.priority_order IS 'Ordem de prioridade no dia (menor = mais prioritário)';
COMMENT ON COLUMN public.gp_daily_task_focus.estimated_time_minutes IS 'Tempo estimado em minutos para completar a tarefa neste dia';
COMMENT ON COLUMN public.gp_daily_task_focus.actual_time_minutes IS 'Tempo real gasto em minutos';
COMMENT ON COLUMN public.gp_daily_task_focus.completed IS 'Se a tarefa foi marcada como completa no dia';
