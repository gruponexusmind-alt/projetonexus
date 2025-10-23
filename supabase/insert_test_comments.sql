-- Script para inserir comentários de teste na tabela gp_comments
-- Execute este script DIRETAMENTE no SQL Editor do Supabase Dashboard

-- PASSO 1: Primeiro, descubra o ID do seu projeto
-- Execute esta query primeiro:
/*
SELECT id, title, created_at
FROM gp_projects
ORDER BY created_at DESC
LIMIT 5;
*/

-- PASSO 2: Descubra o ID do seu usuário (author_id)
-- Execute esta query:
/*
SELECT id, nome, email
FROM profiles
LIMIT 5;
*/

-- PASSO 3: Copie os IDs e cole abaixo
-- Substitua 'SEU_PROJECT_ID_AQUI' pelo UUID real do projeto
-- Substitua 'SEU_USER_ID_AQUI' pelo UUID real do usuário

DO $$
DECLARE
  v_project_id UUID := 'SEU_PROJECT_ID_AQUI'; -- ⚠️ SUBSTITUA AQUI!
  v_author_id UUID := 'SEU_USER_ID_AQUI';    -- ⚠️ SUBSTITUA AQUI!
BEGIN
  RAISE NOTICE 'Inserindo comentários de teste para projeto: %', v_project_id;
  RAISE NOTICE 'Autor: %', v_author_id;

  -- ====================================
  -- 1. INSERIR COMENTÁRIOS VISÍVEIS AO CLIENTE (is_internal = false)
  -- ====================================

  -- Comentário 1: Atualização de progresso (Visível ao cliente)
  INSERT INTO gp_comments (
    project_id, author_id, content, is_internal, created_at
  )
  SELECT
    v_project_id,
    v_author_id,
    'Olá! Temos boas notícias sobre o andamento do projeto. Concluímos com sucesso a fase de desenvolvimento das funcionalidades principais. A equipe de QA já iniciou os testes preliminares e os resultados estão muito positivos.

Próximos passos:
- Finalizar testes de integração (esta semana)
- Preparar ambiente de homologação (próxima semana)
- Agendar reunião de apresentação para validação

Em breve entraremos em contato para agendarmos a demonstração das funcionalidades implementadas.',
    false, -- Visível ao cliente
    NOW() - INTERVAL '3 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_comments
    WHERE project_id = v_project_id
    AND content ILIKE '%boas notícias%'
  );

  -- Comentário 2: Solicitação de aprovação (Visível ao cliente)
  INSERT INTO gp_comments (
    project_id, author_id, content, is_internal, created_at
  )
  SELECT
    v_project_id,
    v_author_id,
    'Prezado cliente,

Os protótipos das telas principais estão disponíveis para sua análise. Precisamos da sua aprovação para prosseguirmos com a implementação final do design.

Por favor, revise os layouts e nos envie seu feedback até o final desta semana. Qualquer ajuste necessário será realizado prontamente.

Link para visualização: [será inserido pelo gestor]

Aguardamos seu retorno!',
    false, -- Visível ao cliente
    NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_comments
    WHERE project_id = v_project_id
    AND content ILIKE '%protótipos%'
  );

  -- Comentário 3: Milestone alcançado (Visível ao cliente)
  INSERT INTO gp_comments (
    project_id, author_id, content, is_internal, created_at
  )
  SELECT
    v_project_id,
    v_author_id,
    '🎉 Milestone importante alcançado!

Temos o prazer de informar que atingimos 70% de conclusão do projeto. O sistema de autenticação e o dashboard principal já estão 100% funcionais.

Destaques da semana:
✅ Login/Logout implementado e testado
✅ Dashboard com métricas em tempo real funcionando
✅ Integração com banco de dados concluída
✅ Testes de segurança aprovados

Continuaremos trabalhando para manter este excelente ritmo!',
    false, -- Visível ao cliente
    NOW() - INTERVAL '7 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_comments
    WHERE project_id = v_project_id
    AND content ILIKE '%Milestone%'
  );

  -- ====================================
  -- 2. INSERIR COMENTÁRIOS INTERNOS (is_internal = true)
  -- ====================================

  -- Comentário interno 1: Nota técnica da equipe
  INSERT INTO gp_comments (
    project_id, author_id, content, is_internal, created_at
  )
  SELECT
    v_project_id,
    v_author_id,
    'NOTA INTERNA: Identificamos gargalo de performance na query de relatórios. João está trabalhando na otimização usando índices. Previsão de conclusão: amanhã.

Não comunicar ao cliente ainda, vamos resolver antes.',
    true, -- Apenas interno
    NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_comments
    WHERE project_id = v_project_id
    AND content ILIKE '%NOTA INTERNA%'
  );

  -- Comentário interno 2: Discussão técnica
  INSERT INTO gp_comments (
    project_id, author_id, content, is_internal, created_at
  )
  SELECT
    v_project_id,
    v_author_id,
    'Reunião interna com a equipe: decidimos migrar a autenticação para JWT em vez de sessions. Melhor performance e escalabilidade.

TODO:
- Atualizar documentação técnica
- Revisar testes unitários
- Validar com arquiteto',
    true, -- Apenas interno
    NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_comments
    WHERE project_id = v_project_id
    AND content ILIKE '%JWT%'
  );

  -- ====================================
  -- RESUMO
  -- ====================================
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ COMENTÁRIOS INSERIDOS COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Projeto ID: %', v_project_id;
  RAISE NOTICE 'Autor ID: %', v_author_id;
  RAISE NOTICE '- 3 comentários VISÍVEIS AO CLIENTE (is_internal = false)';
  RAISE NOTICE '- 2 comentários INTERNOS (is_internal = true)';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📌 IMPORTANTE:';
  RAISE NOTICE 'Os comentários com is_internal = false aparecerão na aba';
  RAISE NOTICE '"Atualizações" do link público do projeto.';
  RAISE NOTICE '';
  RAISE NOTICE 'Os comentários com is_internal = true são visíveis apenas';
  RAISE NOTICE 'na aba "Comunicação" do painel administrativo.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO: %', SQLERRM;
    RAISE EXCEPTION '%', SQLERRM;
END $$;

-- ====================================
-- VERIFICAR COMENTÁRIOS INSERIDOS
-- ====================================
-- Descomente e execute após inserir os dados:
/*
-- Verificar comentários visíveis ao cliente
SELECT
  id,
  LEFT(content, 50) as preview,
  is_internal,
  created_at
FROM gp_comments
WHERE project_id = 'SEU_PROJECT_ID_AQUI'
  AND is_internal = false
ORDER BY created_at DESC;

-- Verificar comentários internos
SELECT
  id,
  LEFT(content, 50) as preview,
  is_internal,
  created_at
FROM gp_comments
WHERE project_id = 'SEU_PROJECT_ID_AQUI'
  AND is_internal = true
ORDER BY created_at DESC;

-- Verificar TODOS os comentários
SELECT
  COUNT(*) FILTER (WHERE is_internal = false) as visiveis_cliente,
  COUNT(*) FILTER (WHERE is_internal = true) as apenas_internos,
  COUNT(*) as total
FROM gp_comments
WHERE project_id = 'SEU_PROJECT_ID_AQUI';
*/
