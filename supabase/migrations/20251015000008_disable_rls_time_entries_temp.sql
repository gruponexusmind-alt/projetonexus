-- =========================================
-- TEMPORÁRIO: Desabilitar RLS para debug
-- =========================================
-- Vamos desabilitar RLS completamente para testar
-- ATENÇÃO: Isso é apenas para desenvolvimento/debug!

-- Desabilitar RLS
ALTER TABLE gp_time_entries DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies
DROP POLICY IF EXISTS "select_time_entries" ON gp_time_entries;
DROP POLICY IF EXISTS "insert_time_entries" ON gp_time_entries;
DROP POLICY IF EXISTS "update_time_entries" ON gp_time_entries;
DROP POLICY IF EXISTS "delete_time_entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can view time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can insert time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can update time entries" ON gp_time_entries;
DROP POLICY IF EXISTS "Users can delete time entries" ON gp_time_entries;

-- Grant completo para authenticated
GRANT ALL ON gp_time_entries TO authenticated;

COMMENT ON TABLE gp_time_entries IS 'TEMP: RLS desabilitado para debug - REATIVAR EM PRODUÇÃO';
