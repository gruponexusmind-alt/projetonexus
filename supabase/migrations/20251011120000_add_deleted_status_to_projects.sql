-- =========================================
-- ADICIONAR STATUS "DELETED" AOS PROJETOS
-- =========================================
-- Esta migration corrige o erro ao tentar deletar projetos
-- adicionando 'deleted' aos valores aceitos do campo status

-- 1. Remover o constraint antigo
ALTER TABLE gp_projects
  DROP CONSTRAINT IF EXISTS gp_projects_status_check;

-- 2. Adicionar novo constraint com 'deleted' incluído
ALTER TABLE gp_projects
  ADD CONSTRAINT gp_projects_status_check
  CHECK (status IN (
    'onboarding',
    'strategy',
    'development',
    'testing',
    'delivery',
    'monitoring',
    'deleted',
    'archived'
  ));

-- 3. Comentário
COMMENT ON COLUMN gp_projects.status IS 'Status do projeto: onboarding, strategy, development, testing, delivery, monitoring, deleted (soft delete), archived';
