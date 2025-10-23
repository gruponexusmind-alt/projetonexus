-- Migration: Suporte para uploads de clientes e tarefas que requerem ação do cliente
-- Data: 2025-10-23

-- 1. Adicionar colunas em gp_project_documents para identificar uploads de clientes
ALTER TABLE public.gp_project_documents
  ADD COLUMN IF NOT EXISTS is_from_client BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS uploaded_by_client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_upload_token TEXT;

-- 2. Adicionar coluna em gp_tasks para marcar tarefas que requerem ação do cliente
ALTER TABLE public.gp_tasks
  ADD COLUMN IF NOT EXISTS requires_client_action BOOLEAN NOT NULL DEFAULT false;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_is_from_client
  ON public.gp_project_documents(project_id, is_from_client)
  WHERE is_from_client = true;

CREATE INDEX IF NOT EXISTS idx_tasks_requires_client_action
  ON public.gp_tasks(project_id, requires_client_action)
  WHERE requires_client_action = true;

-- 4. Comentários explicativos
COMMENT ON COLUMN public.gp_project_documents.is_from_client IS
  'Indica se o documento foi enviado por um cliente através do link público';

COMMENT ON COLUMN public.gp_project_documents.uploaded_by_client_email IS
  'Email do cliente que enviou o documento (validado pelo token)';

COMMENT ON COLUMN public.gp_project_documents.client_upload_token IS
  'Token usado no momento do upload (para auditoria)';

COMMENT ON COLUMN public.gp_tasks.requires_client_action IS
  'Indica se a tarefa requer alguma ação do cliente para ser concluída';
