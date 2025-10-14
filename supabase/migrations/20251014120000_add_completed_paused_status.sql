-- =========================================
-- ADICIONAR STATUS "COMPLETED" E "PAUSED"
-- =========================================
-- Esta migration corrige o erro ao salvar projetos com status "Concluído" ou "Pausado"
-- adicionando 'completed' e 'paused' aos valores aceitos do campo status

-- 1. Remover o constraint antigo
ALTER TABLE gp_projects
  DROP CONSTRAINT IF EXISTS gp_projects_status_check;

-- 2. Adicionar novo constraint com 'completed' e 'paused' incluídos
ALTER TABLE gp_projects
  ADD CONSTRAINT gp_projects_status_check
  CHECK (status IN (
    'onboarding',
    'strategy',
    'development',
    'testing',
    'delivery',
    'monitoring',
    'completed',    -- NOVO: Projeto finalizado com sucesso
    'paused',       -- NOVO: Projeto temporariamente pausado
    'deleted',
    'archived'
  ));

-- 3. Atualizar comentário
COMMENT ON COLUMN gp_projects.status IS 'Status do projeto: onboarding (início), strategy (estratégia), development (desenvolvimento), testing (testes), delivery (entrega), monitoring (monitoramento), completed (concluído), paused (pausado), deleted (soft delete), archived (arquivado)';
