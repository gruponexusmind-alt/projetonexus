-- Fase 1: Criar tabelas necessárias para o sistema completo de projetos

-- Tabela de expectativas do projeto (Definition of Done)
CREATE TABLE IF NOT EXISTS public.gp_project_expectations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de etapas/marcos do projeto
CREATE TABLE IF NOT EXISTS public.gp_project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atualizar tabela de tarefas para incluir company_id e outros campos necessários
ALTER TABLE public.gp_tasks ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.gp_tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.gp_tasks ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0;

-- Preencher company_id nas tarefas existentes baseado no projeto
UPDATE public.gp_tasks 
SET company_id = (
  SELECT p.company_id 
  FROM public.gp_projects p 
  WHERE p.id = gp_tasks.project_id
)
WHERE company_id IS NULL;

-- Tabela de checklist por tarefa (não por projeto)
CREATE TABLE IF NOT EXISTS public.gp_task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.gp_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de documentos do projeto
CREATE TABLE IF NOT EXISTS public.gp_project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de comentários de tarefa
CREATE TABLE IF NOT EXISTS public.gp_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.gp_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.gp_project_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_comments ENABLE ROW LEVEL SECURITY;

-- Atualizar RLS para gp_tasks
ALTER TABLE public.gp_tasks ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS por empresa
CREATE POLICY "expectativas_by_company" ON public.gp_project_expectations
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "stages_by_company" ON public.gp_project_stages
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "tasks_by_company" ON public.gp_tasks
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "task_checklist_by_company" ON public.gp_task_checklist
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "project_documents_by_company" ON public.gp_project_documents
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "task_comments_by_company" ON public.gp_task_comments
FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Função para recalcular progresso das tarefas baseado no checklist
CREATE OR REPLACE FUNCTION public.recalc_task_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.gp_tasks t
  SET progress = COALESCE((
    SELECT ROUND(100.0 * SUM(CASE WHEN c.is_done THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::INTEGER
    FROM public.gp_task_checklist c
    WHERE c.task_id = t.id
  ), t.progress)
  WHERE t.id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN NULL;
END;
$$;

-- Trigger para atualização automática do progresso
DROP TRIGGER IF EXISTS tr_checklist_progress ON public.gp_task_checklist;
CREATE TRIGGER tr_checklist_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.gp_task_checklist
  FOR EACH ROW EXECUTE FUNCTION public.recalc_task_progress();

-- View para estatísticas das tarefas por projeto
CREATE OR REPLACE VIEW public.v_project_task_stats AS
SELECT
  t.project_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status='pending') as pending,
  COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status='review') as review,
  COUNT(*) FILTER (WHERE status='completed') as completed,
  ROUND(AVG(
    CASE status
      WHEN 'pending' then 10
      when 'in_progress' then 50
      when 'review' then 80
      when 'completed' then 100
    END
  ))::INTEGER as progress_score
FROM public.gp_tasks t
GROUP BY t.project_id;

-- Criar bucket para documentos do projeto se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Política para documentos do projeto no Storage
CREATE POLICY "project_docs_access" ON storage.objects
FOR ALL USING (
  bucket_id = 'project-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT company_id::text 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_gp_project_expectations_updated_at 
  BEFORE UPDATE ON public.gp_project_expectations 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_gp_project_stages_updated_at 
  BEFORE UPDATE ON public.gp_project_stages 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_gp_project_documents_updated_at 
  BEFORE UPDATE ON public.gp_project_documents 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_gp_task_comments_updated_at 
  BEFORE UPDATE ON public.gp_task_comments 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();