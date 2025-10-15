-- =========================================
-- FIX: RLS Policies para gp_time_entries
-- =========================================
-- Corrige as policies de RLS que estavam bloqueando inserções

-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Admins can view all company time entries" ON gp_time_entries;

-- Recriar policies mais permissivas

-- SELECT: Usuários podem ver suas próprias entries OU entries da mesma empresa se forem admin
CREATE POLICY "Users can view time entries"
  ON gp_time_entries FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.company_id = gp_time_entries.company_id
    )
  );

-- INSERT: Usuários podem inserir entries para si mesmos
CREATE POLICY "Users can insert time entries"
  ON gp_time_entries FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.company_id = gp_time_entries.company_id
    )
  );

-- UPDATE: Usuários podem atualizar suas próprias entries
CREATE POLICY "Users can update time entries"
  ON gp_time_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar suas próprias entries
CREATE POLICY "Users can delete time entries"
  ON gp_time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Garantir que RLS está ativado
ALTER TABLE gp_time_entries ENABLE ROW LEVEL SECURITY;

-- Comentário
COMMENT ON TABLE gp_time_entries IS 'Time entries com RLS corrigido - permite inserção de usuários autenticados';
