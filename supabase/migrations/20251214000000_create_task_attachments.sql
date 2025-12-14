-- Migration: Sistema de Anexos para Tarefas
-- Data: 2025-12-14
-- Descrição: Adiciona suporte para anexar imagens às tarefas

-- 1. Criar tabela de anexos de tarefas
CREATE TABLE IF NOT EXISTS public.gp_task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.gp_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id
  ON public.gp_task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_company_id
  ON public.gp_task_attachments(company_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_created_at
  ON public.gp_task_attachments(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.gp_task_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS por empresa
CREATE POLICY "task_attachments_by_company"
  ON public.gp_task_attachments
  FOR ALL
  USING (
    company_id = (
      SELECT company_id
      FROM public.profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id = (
      SELECT company_id
      FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- 5. Trigger para updated_at
CREATE TRIGGER update_gp_task_attachments_updated_at
  BEFORE UPDATE ON public.gp_task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Criar bucket para anexos de tarefas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  10485760, -- 10 MB em bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- 7. Política de acesso ao bucket (leitura)
CREATE POLICY "task_attachments_read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT company_id::text
      FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- 8. Política de upload ao bucket
CREATE POLICY "task_attachments_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT company_id::text
      FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- 9. Política de delete ao bucket
CREATE POLICY "task_attachments_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'task-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT company_id::text
      FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- 10. Comentários descritivos
COMMENT ON TABLE public.gp_task_attachments IS
  'Armazena anexos (imagens) associados às tarefas';

COMMENT ON COLUMN public.gp_task_attachments.file_name IS
  'Nome original do arquivo anexado';

COMMENT ON COLUMN public.gp_task_attachments.file_path IS
  'Caminho completo do arquivo no storage: company_id/task_id/filename';

COMMENT ON COLUMN public.gp_task_attachments.file_size IS
  'Tamanho do arquivo em bytes';

COMMENT ON COLUMN public.gp_task_attachments.mime_type IS
  'Tipo MIME do arquivo (ex: image/png, image/jpeg)';
