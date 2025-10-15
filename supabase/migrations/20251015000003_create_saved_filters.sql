-- =========================================
-- TABELA DE FILTROS SALVOS
-- =========================================
-- Esta migration cria a tabela para armazenar combinações de filtros
-- personalizadas que o usuário pode salvar e reutilizar

CREATE TABLE IF NOT EXISTS public.gp_saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  filter_name TEXT NOT NULL,
  filter_description TEXT,
  filter_type TEXT NOT NULL DEFAULT 'task' CHECK (filter_type IN ('task', 'project', 'timeline', 'general')),
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON gp_saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_company_id ON gp_saved_filters(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_type ON gp_saved_filters(filter_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_default ON gp_saved_filters(is_default);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_public ON gp_saved_filters(is_public);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gp_saved_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp_saved_filters_updated_at ON gp_saved_filters;
CREATE TRIGGER trigger_update_gp_saved_filters_updated_at
  BEFORE UPDATE ON gp_saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_gp_saved_filters_updated_at();

-- Trigger para garantir apenas um filtro default por tipo por usuário
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Remove o flag default de outros filtros do mesmo tipo do mesmo usuário
    UPDATE gp_saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND filter_type = NEW.filter_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_filter ON gp_saved_filters;
CREATE TRIGGER trigger_ensure_single_default_filter
  BEFORE INSERT OR UPDATE ON gp_saved_filters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_filter();

-- RLS Policies
ALTER TABLE gp_saved_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own and public filters" ON gp_saved_filters;
CREATE POLICY "Users can view their own and public filters"
  ON gp_saved_filters FOR SELECT
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
    OR (
      is_public = true
      AND company_id IN (
        SELECT company_id
        FROM profiles
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own filters" ON gp_saved_filters;
CREATE POLICY "Users can insert their own filters"
  ON gp_saved_filters FOR INSERT
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

DROP POLICY IF EXISTS "Users can update their own filters" ON gp_saved_filters;
CREATE POLICY "Users can update their own filters"
  ON gp_saved_filters FOR UPDATE
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own filters" ON gp_saved_filters;
CREATE POLICY "Users can delete their own filters"
  ON gp_saved_filters FOR DELETE
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- Função auxiliar para incrementar contador de uso
CREATE OR REPLACE FUNCTION increment_filter_use_count(p_filter_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE gp_saved_filters
  SET use_count = use_count + 1
  WHERE id = p_filter_id;
END;
$$ LANGUAGE plpgsql;

-- View para filtros mais usados
CREATE OR REPLACE VIEW v_popular_filters AS
SELECT
  sf.*,
  u.nome as user_name,
  RANK() OVER (PARTITION BY sf.company_id, sf.filter_type ORDER BY sf.use_count DESC) as popularity_rank
FROM gp_saved_filters sf
JOIN profiles u ON sf.user_id = u.id
WHERE sf.is_public = true
ORDER BY sf.use_count DESC;

-- Comentários
COMMENT ON TABLE public.gp_saved_filters IS 'Combinações de filtros personalizadas salvas pelos usuários';
COMMENT ON COLUMN public.gp_saved_filters.filter_name IS 'Nome do filtro salvo';
COMMENT ON COLUMN public.gp_saved_filters.filter_type IS 'Tipo do filtro (task, project, timeline, general)';
COMMENT ON COLUMN public.gp_saved_filters.filter_config IS 'Configuração do filtro em formato JSON';
COMMENT ON COLUMN public.gp_saved_filters.is_default IS 'Se este é o filtro padrão do usuário para o tipo';
COMMENT ON COLUMN public.gp_saved_filters.is_public IS 'Se o filtro pode ser visto por outros usuários da empresa';
COMMENT ON COLUMN public.gp_saved_filters.use_count IS 'Contador de quantas vezes o filtro foi usado';

-- Inserir alguns filtros padrão de exemplo (opcional)
-- Descomente se quiser ter filtros pré-configurados

/*
INSERT INTO gp_saved_filters (user_id, company_id, filter_name, filter_type, filter_config, is_public)
SELECT
  p.id,
  p.company_id,
  'Minhas Tarefas Urgentes',
  'task',
  jsonb_build_object(
    'assignedTo', p.id,
    'priority', ARRAY['high'],
    'status', ARRAY['pending', 'in_progress']
  ),
  false
FROM profiles p
WHERE p.role != 'cliente'
ON CONFLICT DO NOTHING;
*/
