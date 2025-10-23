-- Script simplificado para inserir dados de teste
-- Execute este script DIRETAMENTE no SQL Editor do Supabase Dashboard
-- NÃO execute como migration

-- PASSO 1: Primeiro, descubra o ID do seu projeto
-- Execute esta query primeiro:
/*
SELECT id, title, created_at
FROM gp_projects
ORDER BY created_at DESC
LIMIT 5;
*/

-- PASSO 2: Copie o ID do projeto GMAIA e cole abaixo
-- Substitua 'SEU_PROJECT_ID_AQUI' pelo UUID real

DO $$
DECLARE
  v_project_id UUID := 'SEU_PROJECT_ID_AQUI'; -- ⚠️ SUBSTITUA AQUI!
  v_company_id UUID;
BEGIN
  -- Buscar company_id do projeto
  SELECT company_id INTO v_company_id
  FROM gp_projects
  WHERE id = v_project_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Projeto não encontrado com ID: %', v_project_id;
  END IF;

  RAISE NOTICE 'Inserindo dados para projeto: % (company: %)', v_project_id, v_company_id;

  -- ====================================
  -- 1. INSERIR REUNIÕES
  -- ====================================

  -- Reunião 1: Kickoff (concluída)
  INSERT INTO gp_meetings (
    project_id, title, description, meeting_date, duration_minutes,
    meeting_type, status, meeting_link, created_at
  )
  SELECT
    v_project_id,
    'Reunião de Kickoff do Projeto',
    'Reunião inicial para alinhamento de expectativas, definição de escopo e apresentação da equipe.',
    NOW() - INTERVAL '15 days',
    90,
    'kickoff',
    'completed',
    NULL,
    NOW() - INTERVAL '15 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_meetings WHERE project_id = v_project_id AND meeting_type = 'kickoff'
  );

  -- Reunião 2: Review Sprint 1 (concluída)
  INSERT INTO gp_meetings (
    project_id, title, description, meeting_date, duration_minutes,
    meeting_type, status, meeting_link, created_at
  )
  SELECT
    v_project_id,
    'Revisão de Progresso - Sprint 1',
    'Revisão do progresso da primeira sprint, demonstração das funcionalidades desenvolvidas e coleta de feedback.',
    NOW() - INTERVAL '7 days',
    60,
    'review',
    'completed',
    NULL,
    NOW() - INTERVAL '7 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_meetings WHERE project_id = v_project_id AND title ILIKE '%Sprint 1%'
  );

  -- Reunião 3: Semanal (agendada)
  INSERT INTO gp_meetings (
    project_id, title, description, meeting_date, duration_minutes,
    meeting_type, status, meeting_link, created_at
  )
  SELECT
    v_project_id,
    'Reunião Semanal de Acompanhamento',
    'Reunião semanal com o cliente para acompanhamento de tarefas, resolução de dúvidas e alinhamento de prioridades.',
    NOW() + INTERVAL '2 days',
    45,
    'client',
    'scheduled',
    'https://meet.google.com/abc-defg-hij',
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_meetings WHERE project_id = v_project_id AND meeting_type = 'client' AND status = 'scheduled'
  );

  RAISE NOTICE '✅ 3 reuniões inseridas';

  -- ====================================
  -- 2. INSERIR EXPECTATIVAS
  -- ====================================

  -- Expectativa 1 (concluída)
  INSERT INTO gp_project_expectations (
    company_id, project_id, title, description, is_done, position, created_at
  )
  SELECT
    v_company_id, v_project_id,
    'Sistema de autenticação implementado',
    'O sistema deve permitir login, logout, recuperação de senha e gerenciamento de perfis de usuário.',
    true, 1, NOW() - INTERVAL '10 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 1
  );

  -- Expectativa 2 (concluída)
  INSERT INTO gp_project_expectations (
    company_id, project_id, title, description, is_done, position, created_at
  )
  SELECT
    v_company_id, v_project_id,
    'Dashboard com métricas em tempo real',
    'Interface responsiva exibindo KPIs principais, gráficos interativos e filtros por período.',
    true, 2, NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 2
  );

  -- Expectativa 3 (pendente)
  INSERT INTO gp_project_expectations (
    company_id, project_id, title, description, is_done, position, created_at
  )
  SELECT
    v_company_id, v_project_id,
    'Módulo de relatórios exportáveis',
    'Permitir geração e exportação de relatórios em PDF e Excel com dados filtrados.',
    false, 3, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 3
  );

  -- Expectativa 4 (pendente)
  INSERT INTO gp_project_expectations (
    company_id, project_id, title, description, is_done, position, created_at
  )
  SELECT
    v_company_id, v_project_id,
    'Integração com sistema legado',
    'Sincronização bidirecional de dados entre o novo sistema e o sistema atual via API REST.',
    false, 4, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 4
  );

  RAISE NOTICE '✅ 4 expectativas inseridas';

  -- ====================================
  -- 3. INSERIR RISCOS
  -- ====================================

  -- Risco 1
  INSERT INTO gp_project_risks (
    company_id, project_id, title, probability, impact, mitigation, status, created_at
  )
  SELECT
    v_company_id, v_project_id,
    'Atraso na entrega de credenciais de API',
    'medium', 'high',
    'Solicitar credenciais com 2 semanas de antecedência e ter ambiente de sandbox preparado para testes.',
    'monitoring', NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_risks WHERE project_id = v_project_id AND title ILIKE '%credenciais%'
  );

  -- Risco 2
  INSERT INTO gp_project_risks (
    company_id, project_id, title, probability, impact, mitigation, status, created_at
  )
  SELECT
    v_company_id, v_project_id,
    'Mudança de requisitos durante o desenvolvimento',
    'high', 'medium',
    'Estabelecer processo formal de change request com análise de impacto e aprovação antes de implementar.',
    'open', NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_risks WHERE project_id = v_project_id AND title ILIKE '%requisitos%'
  );

  RAISE NOTICE '✅ 2 riscos inseridos';

  -- ====================================
  -- RESUMO
  -- ====================================
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ DADOS INSERIDOS COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Projeto ID: %', v_project_id;
  RAISE NOTICE '- 3 reuniões';
  RAISE NOTICE '- 4 expectativas (2 concluídas, 2 pendentes)';
  RAISE NOTICE '- 2 riscos';
  RAISE NOTICE '====================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
    RAISE EXCEPTION '%', SQLERRM;
END $$;

-- ====================================
-- VERIFICAR DADOS INSERIDOS
-- ====================================
-- Descomente e execute após inserir os dados:
/*
-- Verificar reuniões
SELECT COUNT(*) as total_meetings FROM gp_meetings WHERE project_id = 'SEU_PROJECT_ID_AQUI';

-- Verificar expectativas
SELECT COUNT(*) as total_expectations FROM gp_project_expectations WHERE project_id = 'SEU_PROJECT_ID_AQUI';

-- Verificar riscos
SELECT COUNT(*) as total_risks FROM gp_project_risks WHERE project_id = 'SEU_PROJECT_ID_AQUI';
*/
