-- FASE 1: Remover todas as políticas RLS e desabilitar RLS temporariamente

-- Desabilitar RLS em todas as tabelas do sistema
ALTER TABLE public.gp_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_checklist DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_subtasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_expectations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas RLS das tabelas GP
DROP POLICY IF EXISTS "Users can manage projects from their company" ON public.gp_projects;
DROP POLICY IF EXISTS "Users can manage clients from their company" ON public.gp_clients;
DROP POLICY IF EXISTS "Public access to gp_tasks" ON public.gp_tasks;
DROP POLICY IF EXISTS "tasks_by_company" ON public.gp_tasks;
DROP POLICY IF EXISTS "task_checklist_by_company" ON public.gp_task_checklist;
DROP POLICY IF EXISTS "subtasks_by_company" ON public.gp_task_subtasks;
DROP POLICY IF EXISTS "task_comments_by_company" ON public.gp_task_comments;
DROP POLICY IF EXISTS "stages_by_company" ON public.gp_project_stages;
DROP POLICY IF EXISTS "expectativas_by_company" ON public.gp_project_expectations;
DROP POLICY IF EXISTS "project_documents_by_company" ON public.gp_project_documents;
DROP POLICY IF EXISTS "Public access to gp_comments" ON public.gp_comments;
DROP POLICY IF EXISTS "Public access to gp_meetings" ON public.gp_meetings;
DROP POLICY IF EXISTS "Public access to gp_checklist_items" ON public.gp_checklist_items;
DROP POLICY IF EXISTS "Admin can manage their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications for all users" ON public.notifications;

-- FASE 2: Corrigir Foreign Keys problemáticas

-- Remover constraint que está causando problema e permitir assigned_to NULL
ALTER TABLE public.gp_tasks ALTER COLUMN assigned_to DROP NOT NULL;

-- Limpar dados inconsistentes - remover tarefas com assigned_to inválido
UPDATE public.gp_tasks 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (SELECT id FROM auth.users);

-- Limpar dados inconsistentes em profiles - remover usuários que não existem em auth.users
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Garantir que company_id seja obrigatório onde necessário
UPDATE public.gp_projects SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.gp_clients SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;
UPDATE public.gp_tasks SET company_id = (SELECT id FROM public.companies LIMIT 1) WHERE company_id IS NULL;