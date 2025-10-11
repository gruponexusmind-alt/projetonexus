-- =========================================
-- ADICIONAR COLUNAS PARA VISIBILIDADE DO CLIENTE
-- =========================================
-- Esta migration adiciona colunas necessárias para controlar
-- a visibilidade de conteúdo para clientes externos

-- ================================================================
-- GP_COMMENTS: Adicionar coluna is_internal
-- ================================================================
-- Permite marcar comentários como internos (não visíveis para clientes)

ALTER TABLE public.gp_comments
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_gp_comments_is_internal
  ON public.gp_comments(is_internal);

-- Comentário
COMMENT ON COLUMN public.gp_comments.is_internal IS
  'Se true, o comentário é interno e não será visível para clientes. Default: false (visível para clientes)';

-- ================================================================
-- GP_PROJECT_DOCUMENTS: Adicionar coluna is_client_visible
-- ================================================================
-- Permite controlar quais documentos são compartilhados com clientes

ALTER TABLE public.gp_project_documents
  ADD COLUMN IF NOT EXISTS is_client_visible BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_gp_project_documents_is_client_visible
  ON public.gp_project_documents(is_client_visible);

-- Comentário
COMMENT ON COLUMN public.gp_project_documents.is_client_visible IS
  'Se true, o documento está disponível para visualização do cliente. Default: true';

-- ================================================================
-- Atualizar registros existentes (opcional)
-- ================================================================
-- Se houver registros existentes, garantir que tenham valores adequados

-- Marcar todos os comentários existentes como não-internos (visíveis para clientes)
-- Isso é seguro pois é o comportamento default desejado
UPDATE public.gp_comments
SET is_internal = false
WHERE is_internal IS NULL;

-- Marcar todos os documentos existentes como visíveis para clientes
-- Isso é seguro pois é o comportamento default desejado
UPDATE public.gp_project_documents
SET is_client_visible = true
WHERE is_client_visible IS NULL;
