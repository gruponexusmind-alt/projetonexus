-- Migration: Renomear coluna 'body' para 'content' em gp_comments
-- Data: 2025-10-24
-- Propósito: Corrigir erro 400 ao criar comentários

-- CONTEXTO:
-- A migration 20250922104349 criou gp_comments com coluna 'content'
-- A migration 20250927190635 fez DROP TABLE e recriou com coluna 'body'
-- O código React/TypeScript usa 'content' em todos os componentes
-- Resultado: Erro PGRST204 "Could not find the 'content' column"

-- SOLUÇÃO:
-- Renomear 'body' para 'content' para manter compatibilidade com o código

-- ====================================
-- PASSO 1: Renomear Coluna
-- ====================================

ALTER TABLE public.gp_comments
  RENAME COLUMN body TO content;

-- ====================================
-- PASSO 2: Atualizar Comentários da Coluna
-- ====================================

COMMENT ON COLUMN public.gp_comments.content IS
  'Conteúdo do comentário ou atualização do projeto. Se is_internal=false, será visível ao cliente.';

-- ====================================
-- PASSO 3: Verificar Estrutura Final
-- ====================================

-- A tabela agora deve ter:
-- - id (UUID)
-- - company_id (UUID)
-- - project_id (UUID)
-- - entity_type (TEXT)
-- - entity_id (UUID)
-- - author_id (UUID) → profiles(id)  [FK adicionada na migration 20251023200000]
-- - content (TEXT) ← RENOMEADA de 'body'
-- - created_at (TIMESTAMPTZ)
-- - updated_at (TIMESTAMPTZ)

-- ====================================
-- RESUMO
-- ====================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ COLUNA RENOMEADA COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Tabela: gp_comments';
  RAISE NOTICE 'Mudança: body → content';
  RAISE NOTICE '';
  RAISE NOTICE '✅ O código React agora funcionará:';
  RAISE NOTICE '   .insert({ content: "..." })';
  RAISE NOTICE '   .select("*, content")';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Componentes afetados (agora funcionam):';
  RAISE NOTICE '   - ProjectCommunicationTab.tsx';
  RAISE NOTICE '   - validate-project-view/index.ts (Edge Function)';
  RAISE NOTICE '   - ClientProjectDetail.tsx';
  RAISE NOTICE '   - PublicProjectView.tsx';
  RAISE NOTICE '====================================';
END $$;
