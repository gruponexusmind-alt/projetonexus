-- Migration: Adicionar Foreign Keys faltantes em gp_comments
-- Data: 2025-10-23
-- Propósito: Corrigir erro 400 ao buscar comentários com JOIN em profiles

-- A migration 20250927190635 recriou a tabela gp_comments mas esqueceu
-- de adicionar as foreign keys necessárias. Isso causa erro no Supabase
-- quando tentamos fazer JOIN com profiles usando a sintaxe:
-- author:profiles!gp_comments_author_id_fkey(nome, email)

-- ====================================
-- PASSO 1: Remover constraints antigas (se existirem)
-- ====================================

-- Remover constraint antiga (pode ter nome diferente)
ALTER TABLE IF EXISTS public.gp_comments
  DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE IF EXISTS public.gp_comments
  DROP CONSTRAINT IF EXISTS gp_comments_author_id_fkey;

ALTER TABLE IF EXISTS public.gp_comments
  DROP CONSTRAINT IF EXISTS gp_comments_company_id_fkey;

ALTER TABLE IF EXISTS public.gp_comments
  DROP CONSTRAINT IF EXISTS gp_comments_project_id_fkey;

-- ====================================
-- PASSO 2: Adicionar Foreign Keys
-- ====================================

-- Foreign Key: author_id -> profiles(id)
-- IMPORTANTE: Esta é a constraint que o Supabase procura quando usamos
-- author:profiles!gp_comments_author_id_fkey(nome, email)
ALTER TABLE public.gp_comments
  ADD CONSTRAINT gp_comments_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Foreign Key: company_id -> companies(id)
-- Garante integridade referencial com a tabela de empresas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) THEN
    ALTER TABLE public.gp_comments
      ADD CONSTRAINT gp_comments_company_id_fkey
      FOREIGN KEY (company_id)
      REFERENCES public.companies(id)
      ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key gp_comments_company_id_fkey adicionada';
  ELSE
    RAISE NOTICE 'Tabela companies não existe, pulando FK company_id';
  END IF;
END $$;

-- Foreign Key: project_id -> gp_projects(id)
-- Garante integridade referencial com a tabela de projetos
ALTER TABLE public.gp_comments
  ADD CONSTRAINT gp_comments_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES public.gp_projects(id)
  ON DELETE CASCADE;

-- ====================================
-- PASSO 3: Criar Índices para Performance
-- ====================================

-- Índice para buscas por projeto
CREATE INDEX IF NOT EXISTS idx_gp_comments_project_id
  ON public.gp_comments(project_id);

-- Índice para buscas por autor
CREATE INDEX IF NOT EXISTS idx_gp_comments_author_id
  ON public.gp_comments(author_id);

-- Índice para buscas por empresa
CREATE INDEX IF NOT EXISTS idx_gp_comments_company_id
  ON public.gp_comments(company_id);

-- Índice composto para ordenação por data
CREATE INDEX IF NOT EXISTS idx_gp_comments_project_created
  ON public.gp_comments(project_id, created_at DESC);

-- ====================================
-- PASSO 4: Comentários e Documentação
-- ====================================

COMMENT ON CONSTRAINT gp_comments_author_id_fkey ON public.gp_comments IS
  'Foreign key para profiles. Usada no Supabase para JOIN: author:profiles!gp_comments_author_id_fkey(nome, email)';

COMMENT ON CONSTRAINT gp_comments_project_id_fkey ON public.gp_comments IS
  'Foreign key para gp_projects. Garante que comentários pertencem a projetos válidos.';

COMMENT ON TABLE public.gp_comments IS
  'Comentários e atualizações de projetos. Pode ser interna (equipe) ou externa (visível ao cliente via is_internal=false)';

-- ====================================
-- RESUMO
-- ====================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ FOREIGN KEYS ADICIONADAS COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Tabela: gp_comments';
  RAISE NOTICE '';
  RAISE NOTICE 'Constraints criadas:';
  RAISE NOTICE '- gp_comments_author_id_fkey (author_id → profiles.id)';
  RAISE NOTICE '- gp_comments_company_id_fkey (company_id → companies.id)';
  RAISE NOTICE '- gp_comments_project_id_fkey (project_id → gp_projects.id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Índices criados:';
  RAISE NOTICE '- idx_gp_comments_project_id';
  RAISE NOTICE '- idx_gp_comments_author_id';
  RAISE NOTICE '- idx_gp_comments_company_id';
  RAISE NOTICE '- idx_gp_comments_project_created';
  RAISE NOTICE '';
  RAISE NOTICE '✅ A query com JOIN agora funcionará:';
  RAISE NOTICE '   author:profiles!gp_comments_author_id_fkey(nome, email)';
  RAISE NOTICE '====================================';
END $$;
