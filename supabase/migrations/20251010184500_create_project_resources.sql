-- =========================================
-- SISTEMA DE RECURSOS DE PROJETO
-- =========================================
-- Esta migration cria o novo sistema de recursos que permite
-- adicionar pessoas ao projeto sem precisar de conta no sistema

-- 1. Criar tabela de recursos do projeto
CREATE TABLE IF NOT EXISTS public.gp_project_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES gp_projects(id) ON DELETE CASCADE,

  -- Informações do recurso
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,  -- Função no projeto (Desenvolvedor, Designer, etc)
  type TEXT NOT NULL DEFAULT 'external' CHECK (type IN ('internal', 'external')),

  -- Capacidade e custos
  weekly_capacity_hours INTEGER DEFAULT 40,
  hourly_rate NUMERIC(10,2),  -- Taxa por hora (opcional)

  -- Vínculo opcional com usuário do sistema
  user_id UUID,  -- Sem foreign key para não depender de profiles

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Metadados
  notes TEXT,  -- Observações sobre o recurso
  start_date DATE,  -- Data de início no projeto
  end_date DATE,    -- Data de fim no projeto

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- 2. Comentários
COMMENT ON TABLE public.gp_project_resources IS 'Recursos (pessoas) alocados aos projetos - podem ser internos ou externos';
COMMENT ON COLUMN public.gp_project_resources.type IS 'internal = membro da equipe com login, external = colaborador externo/freelancer';
COMMENT ON COLUMN public.gp_project_resources.user_id IS 'Vínculo opcional com usuário do sistema (se for internal)';
COMMENT ON COLUMN public.gp_project_resources.hourly_rate IS 'Taxa cobrada por hora (para cálculo de custos)';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_project_resources_project ON gp_project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_company ON gp_project_resources(company_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_active ON gp_project_resources(project_id, active);
CREATE INDEX IF NOT EXISTS idx_project_resources_type ON gp_project_resources(project_id, type);
CREATE INDEX IF NOT EXISTS idx_project_resources_user ON gp_project_resources(user_id) WHERE user_id IS NOT NULL;

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gp_project_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp_project_resources_updated_at ON gp_project_resources;
CREATE TRIGGER trigger_update_gp_project_resources_updated_at
  BEFORE UPDATE ON gp_project_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_gp_project_resources_updated_at();

-- 5. RLS Policies
ALTER TABLE gp_project_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view resources from their company" ON gp_project_resources;
CREATE POLICY "Users can view resources from their company"
  ON gp_project_resources FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert resources in their company" ON gp_project_resources;
CREATE POLICY "Users can insert resources in their company"
  ON gp_project_resources FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update resources in their company" ON gp_project_resources;
CREATE POLICY "Users can update resources in their company"
  ON gp_project_resources FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete resources in their company" ON gp_project_resources;
CREATE POLICY "Users can delete resources in their company"
  ON gp_project_resources FOR DELETE
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- 6. Migrar dados existentes de gp_resource_allocations para gp_project_resources
INSERT INTO gp_project_resources (
  company_id,
  project_id,
  name,
  email,
  role,
  type,
  weekly_capacity_hours,
  user_id,
  active,
  created_at
)
SELECT
  ra.company_id,
  ra.project_id,
  COALESCE(p.nome, 'Usuário ' || substring(ra.user_id::text, 1, 8)) as name,
  p.email,
  ra.role,
  'internal' as type,  -- Recursos antigos são todos internos
  ra.weekly_capacity_hours,
  ra.user_id,
  ra.active,
  ra.created_at
FROM gp_resource_allocations ra
LEFT JOIN profiles p ON p.user_id = ra.user_id
WHERE NOT EXISTS (
  -- Evitar duplicatas se a migration for executada mais de uma vez
  SELECT 1 FROM gp_project_resources pr
  WHERE pr.project_id = ra.project_id
    AND pr.user_id = ra.user_id
);

-- 7. View para estatísticas de recursos por projeto
CREATE OR REPLACE VIEW v_project_resources_stats AS
SELECT
  pr.project_id,
  COUNT(*) as total_resources,
  COUNT(*) FILTER (WHERE pr.active = true) as active_resources,
  COUNT(*) FILTER (WHERE pr.type = 'internal') as internal_resources,
  COUNT(*) FILTER (WHERE pr.type = 'external') as external_resources,
  SUM(pr.weekly_capacity_hours) FILTER (WHERE pr.active = true) as total_weekly_capacity,
  SUM(pr.hourly_rate * pr.weekly_capacity_hours) FILTER (WHERE pr.active = true AND pr.hourly_rate IS NOT NULL) as weekly_cost
FROM gp_project_resources pr
GROUP BY pr.project_id;

-- 8. View detalhada de recursos com cálculos de alocação
CREATE OR REPLACE VIEW v_project_resources_detailed AS
SELECT
  pr.id,
  pr.project_id,
  pr.company_id,
  pr.name,
  pr.email,
  pr.role,
  pr.type,
  pr.weekly_capacity_hours,
  pr.hourly_rate,
  pr.active,
  pr.user_id,
  pr.start_date,
  pr.end_date,
  pr.notes,

  -- Informações do projeto
  p.title as project_title,
  p.status as project_status,

  -- Estatísticas de tarefas
  COUNT(t.id) as tasks_count,
  COUNT(t.id) FILTER (WHERE t.status = 'completed') as tasks_completed,
  SUM(t.estimated_hours) as total_estimated_hours,
  SUM(t.logged_hours) as total_logged_hours,

  -- Cálculo de utilização
  CASE
    WHEN pr.weekly_capacity_hours > 0
    THEN ROUND((COALESCE(SUM(t.logged_hours), 0) / pr.weekly_capacity_hours) * 100, 1)
    ELSE 0
  END as utilization_percentage,

  -- Alertas
  CASE
    WHEN COALESCE(SUM(t.estimated_hours), 0) > pr.weekly_capacity_hours THEN true
    ELSE false
  END as is_overallocated,

  pr.created_at,
  pr.updated_at

FROM gp_project_resources pr
JOIN gp_projects p ON pr.project_id = p.id
LEFT JOIN gp_tasks t ON t.project_id = pr.project_id
  AND (
    (pr.user_id IS NOT NULL AND t.assigned_to = pr.user_id)
    OR (pr.user_id IS NULL AND t.assigned_to::uuid = pr.id)
  )
GROUP BY
  pr.id, pr.project_id, pr.company_id, pr.name, pr.email, pr.role,
  pr.type, pr.weekly_capacity_hours, pr.hourly_rate, pr.active, pr.user_id,
  pr.start_date, pr.end_date, pr.notes, p.title, p.status,
  pr.created_at, pr.updated_at;

-- 9. Função auxiliar para obter recursos de um projeto
CREATE OR REPLACE FUNCTION get_project_resources(p_project_id UUID)
RETURNS TABLE (
  resource_id UUID,
  resource_name TEXT,
  resource_email TEXT,
  resource_role TEXT,
  resource_type TEXT,
  is_active BOOLEAN,
  tasks_assigned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.name,
    pr.email,
    pr.role,
    pr.type,
    pr.active,
    COUNT(t.id)::INTEGER
  FROM gp_project_resources pr
  LEFT JOIN gp_tasks t ON t.project_id = pr.project_id
    AND (
      (pr.user_id IS NOT NULL AND t.assigned_to = pr.user_id)
      OR (pr.user_id IS NULL AND t.assigned_to::uuid = pr.id)
    )
  WHERE pr.project_id = p_project_id
  GROUP BY pr.id, pr.name, pr.email, pr.role, pr.type, pr.active
  ORDER BY pr.active DESC, pr.name;
END;
$$ LANGUAGE plpgsql;

-- 10. Comentários nas views e funções
COMMENT ON VIEW v_project_resources_stats IS 'Estatísticas agregadas de recursos por projeto';
COMMENT ON VIEW v_project_resources_detailed IS 'View detalhada de recursos com cálculos de alocação e utilização';
COMMENT ON FUNCTION get_project_resources IS 'Retorna todos os recursos de um projeto específico';
