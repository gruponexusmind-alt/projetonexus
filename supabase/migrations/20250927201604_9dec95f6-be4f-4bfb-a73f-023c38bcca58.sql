-- Create labels table
CREATE TABLE IF NOT EXISTS public.gp_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Create project labels junction table
CREATE TABLE IF NOT EXISTS public.gp_project_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.gp_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, label_id)
);

-- Create task labels junction table  
CREATE TABLE IF NOT EXISTS public.gp_task_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.gp_tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.gp_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, label_id)
);

-- Enable RLS
ALTER TABLE public.gp_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gp_project_labels ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.gp_task_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for labels
CREATE POLICY "Users can manage labels" ON public.gp_labels
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage project labels" ON public.gp_project_labels
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage task labels" ON public.gp_task_labels
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Create updated_at trigger for labels
CREATE TRIGGER update_gp_labels_updated_at BEFORE UPDATE ON public.gp_labels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();