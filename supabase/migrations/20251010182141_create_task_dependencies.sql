-- =========================================
-- TABELA DE DEPENDÊNCIAS ENTRE TAREFAS
-- =========================================
-- Esta migration cria o sistema completo de dependências entre tarefas
-- para gestão de projetos ágil profissional

-- 1. Tabela principal de dependências
CREATE TABLE IF NOT EXISTS public.gp_task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES gp_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES gp_tasks(id) ON DELETE CASCADE,

  -- Tipo de dependência (PMBOK)
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start'
    CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),

  -- Lag em dias (positivo = atraso, negativo = adiantamento)
  lag_days INTEGER DEFAULT 0,

  -- Empresa para RLS
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,

  -- Constraints
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- 2. Comentários nas colunas
COMMENT ON TABLE public.gp_task_dependencies IS 'Dependências entre tarefas para gestão de cronograma';
COMMENT ON COLUMN public.gp_task_dependencies.dependency_type IS 'FS=Finish-to-Start (padrão), SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish';
COMMENT ON COLUMN public.gp_task_dependencies.lag_days IS 'Dias de atraso (+) ou adiantamento (-) entre tarefas';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON gp_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON gp_task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_company ON gp_task_dependencies(company_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_type ON gp_task_dependencies(dependency_type);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gp_task_dependencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp_task_dependencies_updated_at ON gp_task_dependencies;
CREATE TRIGGER trigger_update_gp_task_dependencies_updated_at
  BEFORE UPDATE ON gp_task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION update_gp_task_dependencies_updated_at();

-- 5. Função para detectar ciclos (prevent circular dependencies)
CREATE OR REPLACE FUNCTION prevent_circular_task_dependency()
RETURNS TRIGGER AS $$
DECLARE
  has_cycle BOOLEAN;
BEGIN
  -- Usar CTE recursivo para detectar ciclos
  WITH RECURSIVE dependency_chain AS (
    -- Caso base: dependência que está sendo inserida
    SELECT
      NEW.depends_on_task_id as task_id,
      NEW.task_id as depends_on,
      1 as depth

    UNION ALL

    -- Caso recursivo: seguir a cadeia de dependências
    SELECT
      td.depends_on_task_id,
      td.task_id,
      dc.depth + 1
    FROM gp_task_dependencies td
    INNER JOIN dependency_chain dc ON td.task_id = dc.task_id
    WHERE dc.depth < 50  -- Limite de profundidade para evitar loop infinito
  )
  SELECT EXISTS(
    SELECT 1
    FROM dependency_chain
    WHERE task_id = NEW.task_id
      AND depends_on = NEW.depends_on_task_id
  ) INTO has_cycle;

  IF has_cycle THEN
    RAISE EXCEPTION 'Dependência circular detectada! Task % → Task % criaria um ciclo.', NEW.task_id, NEW.depends_on_task_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_circular_dependency ON gp_task_dependencies;
CREATE TRIGGER trigger_prevent_circular_dependency
  BEFORE INSERT OR UPDATE ON gp_task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_task_dependency();

-- 6. RLS Policies
ALTER TABLE gp_task_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view dependencies from their company" ON gp_task_dependencies;
CREATE POLICY "Users can view dependencies from their company"
  ON gp_task_dependencies FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert dependencies in their company" ON gp_task_dependencies;
CREATE POLICY "Users can insert dependencies in their company"
  ON gp_task_dependencies FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update dependencies in their company" ON gp_task_dependencies;
CREATE POLICY "Users can update dependencies in their company"
  ON gp_task_dependencies FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete dependencies in their company" ON gp_task_dependencies;
CREATE POLICY "Users can delete dependencies in their company"
  ON gp_task_dependencies FOR DELETE
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- 7. View detalhada de dependências
CREATE OR REPLACE VIEW v_task_dependencies_detailed AS
SELECT
  td.id,
  td.task_id,
  td.depends_on_task_id,
  td.dependency_type,
  td.lag_days,
  td.company_id,
  td.created_at,

  -- Informações da tarefa principal
  t1.title as task_title,
  t1.status as task_status,
  t1.priority as task_priority,
  t1.due_date as task_due_date,
  t1.progress as task_progress,
  t1.project_id as task_project_id,

  -- Informações da tarefa predecessor
  t2.title as dependency_title,
  t2.status as dependency_status,
  t2.priority as dependency_priority,
  t2.due_date as dependency_due_date,
  t2.progress as dependency_progress,

  -- Análise de bloqueio
  CASE
    -- Tarefa está bloqueada se predecessor não está completo
    WHEN td.dependency_type = 'finish_to_start' AND t2.status != 'completed' THEN true
    WHEN td.dependency_type = 'start_to_start' AND t2.status = 'pending' THEN true
    WHEN td.dependency_type = 'finish_to_finish' AND t2.status != 'completed' THEN true
    ELSE false
  END as is_blocking,

  -- Data estimada de desbloqueio (finish_to_start apenas)
  CASE
    WHEN td.dependency_type = 'finish_to_start' AND t2.due_date IS NOT NULL THEN
      t2.due_date + (td.lag_days || ' days')::INTERVAL
    ELSE NULL
  END as estimated_unblock_date,

  -- Alerta se há conflito de datas
  CASE
    WHEN t1.due_date IS NOT NULL
      AND t2.due_date IS NOT NULL
      AND td.dependency_type = 'finish_to_start'
      AND (t2.due_date + (td.lag_days || ' days')::INTERVAL) > t1.due_date
    THEN true
    ELSE false
  END as has_date_conflict

FROM gp_task_dependencies td
JOIN gp_tasks t1 ON td.task_id = t1.id
JOIN gp_tasks t2 ON td.depends_on_task_id = t2.id;

-- 8. View para análise de caminho crítico (Critical Path Method - CPM)
CREATE OR REPLACE VIEW v_task_critical_path_analysis AS
WITH RECURSIVE task_paths AS (
  -- Tarefas sem predecessores (início do projeto)
  SELECT
    t.id as task_id,
    t.project_id,
    t.title,
    t.estimated_hours,
    COALESCE(t.estimated_hours, 0) as path_duration,
    t.due_date,
    ARRAY[t.id] as task_path,
    0 as depth
  FROM gp_tasks t
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_task_dependencies td
    WHERE td.task_id = t.id
  )

  UNION ALL

  -- Tarefas com predecessores
  SELECT
    t.id,
    t.project_id,
    t.title,
    t.estimated_hours,
    tp.path_duration + COALESCE(t.estimated_hours, 0) + COALESCE(td.lag_days * 8, 0),  -- 8h por dia
    t.due_date,
    tp.task_path || t.id,
    tp.depth + 1
  FROM gp_tasks t
  INNER JOIN gp_task_dependencies td ON t.id = td.task_id
  INNER JOIN task_paths tp ON td.depends_on_task_id = tp.task_id
  WHERE tp.depth < 100  -- Limite de profundidade
    AND NOT (t.id = ANY(tp.task_path))  -- Evitar ciclos
)
SELECT
  task_id,
  project_id,
  title,
  estimated_hours,
  MAX(path_duration) as total_path_duration,
  MAX(path_duration) = (
    SELECT MAX(path_duration)
    FROM task_paths tp2
    WHERE tp2.project_id = task_paths.project_id
  ) as is_on_critical_path,
  due_date
FROM task_paths
GROUP BY task_id, project_id, title, estimated_hours, due_date;

-- 9. Função auxiliar para obter predecessores de uma tarefa
CREATE OR REPLACE FUNCTION get_task_predecessors(p_task_id UUID)
RETURNS TABLE (
  dependency_id UUID,
  predecessor_id UUID,
  predecessor_title TEXT,
  predecessor_status TEXT,
  dependency_type TEXT,
  lag_days INTEGER,
  is_blocking BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.depends_on_task_id,
    t.title,
    t.status,
    td.dependency_type,
    td.lag_days,
    CASE
      WHEN td.dependency_type = 'finish_to_start' AND t.status != 'completed' THEN true
      ELSE false
    END
  FROM gp_task_dependencies td
  JOIN gp_tasks t ON td.depends_on_task_id = t.id
  WHERE td.task_id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Função auxiliar para obter sucessores de uma tarefa
CREATE OR REPLACE FUNCTION get_task_successors(p_task_id UUID)
RETURNS TABLE (
  dependency_id UUID,
  successor_id UUID,
  successor_title TEXT,
  successor_status TEXT,
  dependency_type TEXT,
  lag_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.task_id,
    t.title,
    t.status,
    td.dependency_type,
    td.lag_days
  FROM gp_task_dependencies td
  JOIN gp_tasks t ON td.task_id = t.id
  WHERE td.depends_on_task_id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Comentários nas views e funções
COMMENT ON VIEW v_task_dependencies_detailed IS 'View detalhada de dependências com análise de bloqueios e conflitos';
COMMENT ON VIEW v_task_critical_path_analysis IS 'Análise de caminho crítico (CPM) para identificar tarefas críticas';
COMMENT ON FUNCTION get_task_predecessors IS 'Retorna todas as tarefas predecessoras de uma tarefa específica';
COMMENT ON FUNCTION get_task_successors IS 'Retorna todas as tarefas sucessoras de uma tarefa específica';