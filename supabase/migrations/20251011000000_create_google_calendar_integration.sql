-- =========================================
-- INTEGRAÇÃO GOOGLE CALENDAR
-- =========================================
-- Esta migration cria o sistema de integração com Google Calendar
-- para sincronização de reuniões e eventos

-- 1. Criar tabela para armazenar tokens do Google Calendar
CREATE TABLE IF NOT EXISTS public.gp_google_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tokens OAuth 2.0 (criptografados)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,

  -- Informações do calendário
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  calendar_name TEXT,

  -- Status da integração
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,

  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraint: um usuário pode ter apenas uma conexão ativa por company
  UNIQUE(company_id, user_id)
);

-- 2. Comentários
COMMENT ON TABLE public.gp_google_calendar_tokens IS 'Tokens OAuth 2.0 para integração com Google Calendar';
COMMENT ON COLUMN public.gp_google_calendar_tokens.access_token IS 'Token de acesso OAuth 2.0 (deve ser criptografado na aplicação)';
COMMENT ON COLUMN public.gp_google_calendar_tokens.refresh_token IS 'Token para renovar access_token expirado';
COMMENT ON COLUMN public.gp_google_calendar_tokens.expires_at IS 'Data/hora de expiração do access_token';
COMMENT ON COLUMN public.gp_google_calendar_tokens.calendar_id IS 'ID do calendário Google (padrão: primary)';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user ON gp_google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_company ON gp_google_calendar_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_active ON gp_google_calendar_tokens(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_expires ON gp_google_calendar_tokens(expires_at) WHERE is_active = true;

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_gp_google_calendar_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp_google_calendar_tokens_updated_at ON gp_google_calendar_tokens;
CREATE TRIGGER trigger_update_gp_google_calendar_tokens_updated_at
  BEFORE UPDATE ON gp_google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_gp_google_calendar_tokens_updated_at();

-- 5. RLS Policies
ALTER TABLE gp_google_calendar_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calendar tokens" ON gp_google_calendar_tokens;
CREATE POLICY "Users can view their own calendar tokens"
  ON gp_google_calendar_tokens FOR SELECT
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own calendar tokens" ON gp_google_calendar_tokens;
CREATE POLICY "Users can insert their own calendar tokens"
  ON gp_google_calendar_tokens FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own calendar tokens" ON gp_google_calendar_tokens;
CREATE POLICY "Users can update their own calendar tokens"
  ON gp_google_calendar_tokens FOR UPDATE
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own calendar tokens" ON gp_google_calendar_tokens;
CREATE POLICY "Users can delete their own calendar tokens"
  ON gp_google_calendar_tokens FOR DELETE
  USING (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id
      FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- 6. Adicionar coluna opcional em gp_meetings para vincular com eventos do Google Calendar
ALTER TABLE gp_meetings
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'local' CHECK (sync_source IN ('local', 'google', 'both'));

CREATE INDEX IF NOT EXISTS idx_meetings_google_event ON gp_meetings(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;

COMMENT ON COLUMN gp_meetings.google_calendar_event_id IS 'ID do evento no Google Calendar (quando sincronizado)';
COMMENT ON COLUMN gp_meetings.sync_source IS 'Origem do evento: local (criado aqui), google (importado), both (sincronizado)';

-- 7. View para estatísticas de sincronização
CREATE OR REPLACE VIEW v_google_calendar_sync_stats AS
SELECT
  gct.company_id,
  gct.user_id,
  gct.is_active,
  gct.last_sync_at,
  gct.calendar_name,
  COUNT(m.id) FILTER (WHERE m.sync_source = 'google') as google_events_count,
  COUNT(m.id) FILTER (WHERE m.sync_source = 'local') as local_events_count,
  COUNT(m.id) FILTER (WHERE m.sync_source = 'both') as synced_events_count,
  gct.created_at,
  gct.updated_at
FROM gp_google_calendar_tokens gct
LEFT JOIN gp_meetings m ON m.project_id IN (
  SELECT id FROM gp_projects WHERE company_id = gct.company_id
)
GROUP BY gct.company_id, gct.user_id, gct.is_active, gct.last_sync_at,
         gct.calendar_name, gct.created_at, gct.updated_at;

COMMENT ON VIEW v_google_calendar_sync_stats IS 'Estatísticas de sincronização com Google Calendar por usuário';

-- 8. Função auxiliar para verificar se token está expirado
CREATE OR REPLACE FUNCTION is_google_token_expired(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  token_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT expires_at INTO token_expires_at
  FROM gp_google_calendar_tokens
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;

  IF token_expires_at IS NULL THEN
    RETURN true;  -- Não tem token = considerar expirado
  END IF;

  RETURN now() >= token_expires_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_google_token_expired IS 'Verifica se o token do Google Calendar do usuário está expirado';
