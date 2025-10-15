-- =========================================
-- TABELA DE PREFERÊNCIAS DO USUÁRIO
-- =========================================
-- Esta migration cria a tabela para armazenar preferências
-- personalizadas de cada usuário (filtros favoritos, configurações de visualização, etc)

CREATE TABLE IF NOT EXISTS public.gp_user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraint para garantir que cada usuário tem apenas uma entrada por chave
  UNIQUE(user_id, preference_key)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON gp_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_company_id ON gp_user_preferences(company_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON gp_user_preferences(preference_key);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gp_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp_user_preferences_updated_at ON gp_user_preferences;
CREATE TRIGGER trigger_update_gp_user_preferences_updated_at
  BEFORE UPDATE ON gp_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_gp_user_preferences_updated_at();

-- RLS Policies
ALTER TABLE gp_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON gp_user_preferences;
CREATE POLICY "Users can view their own preferences"
  ON gp_user_preferences FOR SELECT
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own preferences" ON gp_user_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON gp_user_preferences FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own preferences" ON gp_user_preferences;
CREATE POLICY "Users can update their own preferences"
  ON gp_user_preferences FOR UPDATE
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own preferences" ON gp_user_preferences;
CREATE POLICY "Users can delete their own preferences"
  ON gp_user_preferences FOR DELETE
  USING (
    user_id IN (
      SELECT id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE public.gp_user_preferences IS 'Preferências personalizadas dos usuários (filtros favoritos, configurações de UI, etc)';
COMMENT ON COLUMN public.gp_user_preferences.preference_key IS 'Chave da preferência (ex: task_filters_favorite, view_mode, etc)';
COMMENT ON COLUMN public.gp_user_preferences.preference_value IS 'Valor da preferência em formato JSON';
