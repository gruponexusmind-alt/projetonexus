-- Script para verificar dados de reuniões e expectativas no projeto
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Listar todos os projetos disponíveis
SELECT
  id,
  title,
  description,
  status,
  created_at
FROM gp_projects
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar reuniões para o projeto GMAIA (ou substitua pelo ID correto)
-- Substitua 'PROJECT_ID_AQUI' pelo ID real do projeto GMAIA
SELECT
  'Reuniões' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'scheduled') as agendadas,
  COUNT(*) FILTER (WHERE status = 'completed') as realizadas,
  COUNT(*) FILTER (WHERE status = 'cancelled') as canceladas
FROM gp_meetings
WHERE project_id = 'PROJECT_ID_AQUI';

-- 3. Listar todas as reuniões do projeto (para debug)
SELECT
  id,
  title,
  meeting_type,
  status,
  meeting_date,
  created_at
FROM gp_meetings
WHERE project_id = 'PROJECT_ID_AQUI'
ORDER BY meeting_date DESC;

-- 4. Verificar expectativas do projeto
SELECT
  'Expectativas' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_done = true) as concluidas,
  COUNT(*) FILTER (WHERE is_done = false) as pendentes
FROM gp_project_expectations
WHERE project_id = 'PROJECT_ID_AQUI';

-- 5. Listar todas as expectativas do projeto (para debug)
SELECT
  id,
  title,
  description,
  is_done,
  position,
  created_at
FROM gp_project_expectations
WHERE project_id = 'PROJECT_ID_AQUI'
ORDER BY position ASC;

-- 6. Verificar riscos do projeto
SELECT
  'Riscos' as tabela,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status IN ('open', 'monitoring')) as ativos,
  COUNT(*) FILTER (WHERE status IN ('mitigated', 'closed')) as resolvidos
FROM gp_project_risks
WHERE project_id = 'PROJECT_ID_AQUI';

-- 7. Verificar tarefas que requerem ação do cliente
SELECT
  'Tarefas do Cliente' as tabela,
  COUNT(*) as total
FROM gp_tasks
WHERE project_id = 'PROJECT_ID_AQUI'
  AND requires_client_action = true;

-- 8. Verificar se a coluna requires_client_action existe
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'gp_tasks'
  AND column_name = 'requires_client_action';

-- INSTRUÇÕES:
-- 1. Execute a query #1 primeiro para pegar o ID do projeto GMAIA
-- 2. Copie o ID (formato UUID)
-- 3. Substitua 'PROJECT_ID_AQUI' em todas as queries acima
-- 4. Execute queries #2 a #8 para ver os dados
--
-- Se as queries #2, #4, #6, #7 retornarem 0, precisamos criar dados de teste
