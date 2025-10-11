-- Enable RLS on all project-related tables
ALTER TABLE public.gp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_checklist_items ENABLE ROW LEVEL SECURITY;

-- Create basic policies for gp_tasks (main issue)
CREATE POLICY "Users can view all tasks" 
ON public.gp_tasks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create tasks" 
ON public.gp_tasks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update all tasks" 
ON public.gp_tasks 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete all tasks" 
ON public.gp_tasks 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create basic policies for gp_projects
CREATE POLICY "Users can view all projects" 
ON public.gp_projects 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create projects" 
ON public.gp_projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update projects" 
ON public.gp_projects 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for gp_clients
CREATE POLICY "Users can view all clients" 
ON public.gp_clients 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create clients" 
ON public.gp_clients 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update clients" 
ON public.gp_clients 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for gp_project_stages
CREATE POLICY "Users can view all project stages" 
ON public.gp_project_stages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create project stages" 
ON public.gp_project_stages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update project stages" 
ON public.gp_project_stages 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for gp_task_checklist
CREATE POLICY "Users can manage task checklist" 
ON public.gp_task_checklist 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for gp_task_subtasks
CREATE POLICY "Users can manage task subtasks" 
ON public.gp_task_subtasks 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for gp_task_comments
CREATE POLICY "Users can manage task comments" 
ON public.gp_task_comments 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for other project-related tables
CREATE POLICY "Users can manage project expectations" 
ON public.gp_project_expectations 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage project documents" 
ON public.gp_project_documents 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage sprints" 
ON public.gp_sprints 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage project risks" 
ON public.gp_project_risks 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage resource allocations" 
ON public.gp_resource_allocations 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage comments" 
ON public.gp_comments 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage meetings" 
ON public.gp_meetings 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view activity logs" 
ON public.gp_activity_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage checklist items" 
ON public.gp_checklist_items 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);