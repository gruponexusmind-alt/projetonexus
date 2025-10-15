-- =========================================
-- FIX V2: RLS Policies para gp_time_entries
-- =========================================
-- O problema era que a policy verificava gp_time_entries.company_id
-- durante o INSERT, mas esse valor ainda não existe na tabela!

-- Remover TODAS as policies
DROP POLICY IF EXISTS "Users can view time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can insert time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can update time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can delete time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can view own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Admins can view all company time entries" ON gp_time_entries;

-- =========================================
-- POLICIES CORRETAS
-- =========================================

-- SELECT: Ver próprias entries OU todas da empresa se for admin
CREATE POLICY "select_time_entries"
  ON gp_time_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.company_id = gp_time_entries.company_id
    )
  );

-- INSERT: Inserir entries para si mesmo, com company_id do próprio perfil
CREATE POLICY "insert_time_entries"
  ON gp_time_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- UPDATE: Atualizar próprias entries
CREATE POLICY "update_time_entries"
  ON gp_time_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Deletar próprias entries
CREATE POLICY "delete_time_entries"
  ON gp_time_entries FOR DELETE
  USING (user_id = auth.uid());

-- Garantir que RLS está ativado
ALTER TABLE gp_time_entries ENABLE ROW LEVEL SECURITY;

-- =========================================
-- GRANT PERMISSIONS (importante!)
-- =========================================

-- Garantir que authenticated users podem acessar a tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON gp_time_entries TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE gp_time_entries IS 'Time entries com RLS corrigido V2 - company_id validado contra profiles';
