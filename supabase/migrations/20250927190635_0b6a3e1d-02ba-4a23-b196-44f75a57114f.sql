-- FASE 1: ESTRUTURA COMPLETA DO BANCO DE DADOS

-- 1.1 Adicionar campos faltantes em gp_projects
ALTER TABLE public.gp_projects 
  ADD COLUMN IF NOT EXISTS budget numeric(14,2),
  ADD COLUMN IF NOT EXISTS sprint_length_days int2 DEFAULT 14,
  ADD COLUMN IF NOT EXISTS current_stage_id uuid,
  ADD COLUMN IF NOT EXISTS manager_id uuid,
  ADD COLUMN IF NOT EXISTS stakeholders text[];

-- 1.2 Criar tabela de Sprints
CREATE TABLE IF NOT EXISTS public.gp_sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  velocity_target int2,
  closed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.3 Adicionar campos faltantes em gp_tasks
ALTER TABLE public.gp_tasks
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES public.gp_sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS story_points int2,
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason text,
  ADD COLUMN IF NOT EXISTS dependency_task_id uuid REFERENCES public.gp_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS logged_hours numeric(6,2);

-- 1.4 Criar tabela de Riscos
CREATE TABLE IF NOT EXISTS public.gp_project_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  probability text NOT NULL CHECK (probability IN ('low','medium','high')),
  impact text NOT NULL CHECK (impact IN ('low','medium','high')),
  mitigation text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','monitoring','mitigated','closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.5 Criar tabela de Alocação de Recursos
CREATE TABLE IF NOT EXISTS public.gp_resource_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  weekly_capacity_hours int2 NOT NULL DEFAULT 20,
  role text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.6 Melhorar tabela de documentos
ALTER TABLE public.gp_project_documents
  ADD COLUMN IF NOT EXISTS version int2 DEFAULT 1;

-- 1.7 Criar tabela de Activity Logs
CREATE TABLE IF NOT EXISTS public.gp_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.8 Melhorar tabela de comentários (já existe mas vamos garantir estrutura)
DROP TABLE IF EXISTS public.gp_comments CASCADE;
CREATE TABLE public.gp_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.9 Criar view otimizada para estatísticas de projeto
CREATE OR REPLACE VIEW public.v_project_stats AS
SELECT 
  p.id as project_id,
  p.title,
  p.status as project_status,
  p.progress as project_progress,
  p.deadline,
  p.budget,
  p.current_stage_id,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status = 'review' THEN 1 END) as review_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 END) as overdue_tasks,
  ROUND(
    CASE 
      WHEN COUNT(t.id) > 0 
      THEN (COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / COUNT(t.id)::numeric) * 100
      ELSE 0 
    END, 1
  ) as completion_percentage,
  AVG(
    CASE 
      WHEN t.status = 'completed' AND t.created_at IS NOT NULL AND t.updated_at IS NOT NULL
      THEN EXTRACT(days FROM (t.updated_at - t.created_at))
      ELSE NULL 
    END
  ) as avg_lead_time_days
FROM public.gp_projects p
LEFT JOIN public.gp_tasks t ON t.project_id = p.id
GROUP BY p.id, p.title, p.status, p.progress, p.deadline, p.budget, p.current_stage_id;

-- 1.10 Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas as tabelas com updated_at
CREATE TRIGGER update_gp_sprints_updated_at BEFORE UPDATE ON public.gp_sprints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gp_project_risks_updated_at BEFORE UPDATE ON public.gp_project_risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gp_resource_allocations_updated_at BEFORE UPDATE ON public.gp_resource_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gp_comments_updated_at BEFORE UPDATE ON public.gp_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.11 Índices para performance
CREATE INDEX IF NOT EXISTS idx_gp_tasks_project_sprint ON public.gp_tasks(project_id, sprint_id);
CREATE INDEX IF NOT EXISTS idx_gp_tasks_status_due_date ON public.gp_tasks(status, due_date);
CREATE INDEX IF NOT EXISTS idx_gp_activity_logs_project_entity ON public.gp_activity_logs(project_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gp_sprints_project_active ON public.gp_sprints(project_id, closed);

-- 1.12 Inserir dados de teste básicos se não existirem
INSERT INTO public.companies (name, email) 
SELECT 'Empresa Teste', 'teste@exemplo.com'
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1);

-- Garantir que existe pelo menos um usuário/profile
INSERT INTO public.profiles (user_id, nome, email, role, company_id)
SELECT 
  gen_random_uuid(),
  'Usuário Teste',
  'usuario@teste.com',
  'admin'::user_role,
  (SELECT id FROM public.companies LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);