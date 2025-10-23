-- Migration: Adicionar dados de teste para reuniões, expectativas, riscos e tarefas do cliente
-- Data: 2025-10-23
-- Propósito: Popular projeto com dados para teste da visualização pública

-- IMPORTANTE: Esta migration adiciona coluna requires_client_action se não existir
-- e popula dados de teste para o primeiro projeto encontrado

-- 1. Adicionar coluna requires_client_action em gp_tasks se a tabela existir
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'gp_tasks'
  ) THEN
    ALTER TABLE public.gp_tasks
    ADD COLUMN IF NOT EXISTS requires_client_action BOOLEAN NOT NULL DEFAULT false;

    COMMENT ON COLUMN public.gp_tasks.requires_client_action IS 'Indica se a tarefa requer ação do cliente para ser concluída';

    RAISE NOTICE 'Coluna requires_client_action adicionada/verificada com sucesso';
  ELSE
    RAISE NOTICE 'Tabela gp_tasks não existe ainda. Pulando alteração de coluna.';
  END IF;
END $$;

-- 3. Inserir dados de teste apenas se não houver dados
-- Nota: Ajuste o WHERE conforme seu projeto real
-- Você pode trocar "WHERE title ILIKE '%GMAIA%'" pelo ID correto do projeto

-- Variável temporária para armazenar o project_id
DO $$
DECLARE
  v_project_id UUID;
  v_company_id UUID;
  v_user_id UUID;
BEGIN
  -- Buscar o primeiro projeto (ajuste conforme necessário)
  -- Você pode trocar para um projeto específico:
  -- SELECT id, company_id INTO v_project_id, v_company_id FROM gp_projects WHERE title ILIKE '%GMAIA%' LIMIT 1;
  SELECT id, company_id INTO v_project_id, v_company_id
  FROM gp_projects
  ORDER BY created_at DESC
  LIMIT 1;

  -- Buscar um usuário para associar (primeiro admin encontrado)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Se não encontrar projeto, não faz nada
  IF v_project_id IS NULL THEN
    RAISE NOTICE 'Nenhum projeto encontrado. Pulando inserção de dados de teste.';
    RETURN;
  END IF;

  RAISE NOTICE 'Inserindo dados de teste para projeto: %', v_project_id;

  -- Inserir reuniões de teste (apenas se não existirem)
  INSERT INTO public.gp_meetings (
    project_id,
    title,
    description,
    meeting_date,
    duration_minutes,
    meeting_type,
    status,
    meeting_link,
    created_at
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

  INSERT INTO public.gp_meetings (
    project_id,
    title,
    description,
    meeting_date,
    duration_minutes,
    meeting_type,
    status,
    meeting_link,
    created_at
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

  INSERT INTO public.gp_meetings (
    project_id,
    title,
    description,
    meeting_date,
    duration_minutes,
    meeting_type,
    status,
    meeting_link,
    created_at
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

  -- Inserir expectativas de teste (apenas se não existirem)
  INSERT INTO public.gp_project_expectations (
    company_id,
    project_id,
    title,
    description,
    is_done,
    position,
    created_at
  )
  SELECT
    v_company_id,
    v_project_id,
    'Sistema de autenticação implementado',
    'O sistema deve permitir login, logout, recuperação de senha e gerenciamento de perfis de usuário.',
    true,
    1,
    NOW() - INTERVAL '10 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 1
  );

  INSERT INTO public.gp_project_expectations (
    company_id,
    project_id,
    title,
    description,
    is_done,
    position,
    created_at
  )
  SELECT
    v_company_id,
    v_project_id,
    'Dashboard com métricas em tempo real',
    'Interface responsiva exibindo KPIs principais, gráficos interativos e filtros por período.',
    true,
    2,
    NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 2
  );

  INSERT INTO public.gp_project_expectations (
    company_id,
    project_id,
    title,
    description,
    is_done,
    position,
    created_at
  )
  SELECT
    v_company_id,
    v_project_id,
    'Módulo de relatórios exportáveis',
    'Permitir geração e exportação de relatórios em PDF e Excel com dados filtrados.',
    false,
    3,
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 3
  );

  INSERT INTO public.gp_project_expectations (
    company_id,
    project_id,
    title,
    description,
    is_done,
    position,
    created_at
  )
  SELECT
    v_company_id,
    v_project_id,
    'Integração com sistema legado',
    'Sincronização bidirecional de dados entre o novo sistema e o sistema atual via API REST.',
    false,
    4,
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_expectations WHERE project_id = v_project_id AND position = 4
  );

  -- Inserir riscos de teste (apenas se não existirem)
  INSERT INTO public.gp_project_risks (
    company_id,
    project_id,
    title,
    probability,
    impact,
    mitigation,
    status,
    created_at
  )
  SELECT
    v_company_id,
    v_project_id,
    'Atraso na entrega de credenciais de API',
    'medium',
    'high',
    'Solicitar credenciais com 2 semanas de antecedência e ter ambiente de sandbox preparado para testes.',
    'monitoring',
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_risks WHERE project_id = v_project_id AND title ILIKE '%credenciais%'
  );

  INSERT INTO public.gp_project_risks (
    company_id,
    project_id,
    title,
    probability,
    impact,
    mitigation,
    status,
    created_at
  )
  SELECT
    v_company_id,
    v_project_id,
    'Mudança de requisitos durante o desenvolvimento',
    'high',
    'medium',
    'Estabelecer processo formal de change request com análise de impacto e aprovação antes de implementar.',
    'open',
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_project_risks WHERE project_id = v_project_id AND title ILIKE '%requisitos%'
  );

  -- Inserir tarefas que requerem ação do cliente (apenas se tabela e coluna existirem)
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gp_tasks'
  ) AND EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gp_tasks' AND column_name = 'requires_client_action'
  ) THEN
    INSERT INTO public.gp_tasks (
      company_id,
      project_id,
      title,
      description,
      status,
      priority,
      due_date,
      requires_client_action,
      created_at
    )
    SELECT
      v_company_id,
      v_project_id,
      'Validação dos layouts das telas principais',
      'Revisar e aprovar os protótipos de alta fidelidade das 5 telas principais do sistema. Feedbacks devem ser documentados até o prazo.',
      'pending',
      'high',
      CURRENT_DATE + INTERVAL '3 days',
      true,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM gp_tasks WHERE project_id = v_project_id AND requires_client_action = true AND title ILIKE '%layouts%'
    );

    INSERT INTO public.gp_tasks (
      company_id,
      project_id,
      title,
      description,
      status,
      priority,
      due_date,
      requires_client_action,
      created_at
    )
    SELECT
      v_company_id,
      v_project_id,
      'Fornecer massa de dados para testes',
      'Enviar planilha com dados reais (anonimizados) para popular o ambiente de homologação e realizar testes de carga.',
      'in_progress',
      'medium',
      CURRENT_DATE + INTERVAL '7 days',
      true,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM gp_tasks WHERE project_id = v_project_id AND requires_client_action = true AND title ILIKE '%dados%'
    );

    RAISE NOTICE 'Tarefas do cliente inseridas com sucesso';
  ELSE
    RAISE NOTICE 'Tabela gp_tasks ou coluna requires_client_action não existe. Pulando inserção de tarefas do cliente.';
  END IF;

  RAISE NOTICE 'Dados de teste inseridos com sucesso!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inserir dados de teste: %', SQLERRM;
END $$;

-- 4. Criar índices para melhor performance nas queries públicas
CREATE INDEX IF NOT EXISTS idx_meetings_project_date ON gp_meetings(project_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_expectations_project_position ON gp_project_expectations(project_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_risks_project_status ON gp_project_risks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_client_action ON gp_tasks(project_id, requires_client_action) WHERE requires_client_action = true;

-- 5. Comentários finais
COMMENT ON COLUMN gp_meetings.meeting_type IS 'Tipo de reunião: internal, client, kickoff, review';
COMMENT ON COLUMN gp_meetings.status IS 'Status: scheduled, completed, cancelled';
COMMENT ON TABLE gp_project_expectations IS 'Expectativas do projeto (Definition of Done / Acceptance Criteria)';
