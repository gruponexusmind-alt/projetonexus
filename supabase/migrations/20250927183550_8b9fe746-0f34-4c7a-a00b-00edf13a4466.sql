-- Migration: Complete project management system fixes (corrected)

-- 1. Add stage_id to tasks
ALTER TABLE public.gp_tasks 
ADD COLUMN IF NOT EXISTS stage_id uuid REFERENCES public.gp_project_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gp_tasks_stage ON public.gp_tasks(stage_id);

-- 2. Create task subtasks table
CREATE TABLE IF NOT EXISTS public.gp_task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.gp_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for subtasks
ALTER TABLE public.gp_task_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subtasks_by_company" ON public.gp_task_subtasks;
CREATE POLICY "subtasks_by_company" ON public.gp_task_subtasks
FOR ALL 
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- 3. Task-Stage project consistency check
CREATE OR REPLACE FUNCTION public.fn_check_task_stage_same_project()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  stage_project uuid;
BEGIN
  IF NEW.stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT project_id INTO stage_project
  FROM public.gp_project_stages
  WHERE id = NEW.stage_id;

  IF stage_project IS NULL OR stage_project <> NEW.project_id THEN
    RAISE EXCEPTION 'Stage não pertence ao mesmo projeto da tarefa';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_check_task_stage_same_project ON public.gp_tasks;
CREATE TRIGGER tr_check_task_stage_same_project
  BEFORE INSERT OR UPDATE ON public.gp_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_task_stage_same_project();

-- 4. Enhanced progress calculation (checklist + subtasks)
CREATE OR REPLACE FUNCTION public.fn_recalc_task_progress()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  checklist_done int;
  checklist_total int;
  subtasks_done int;
  subtasks_total int;
  pct_checklist numeric := null;
  pct_subtasks numeric := null;
  pct_final int := 0;
  _task_id uuid := COALESCE(NEW.task_id, OLD.task_id);
BEGIN
  -- checklist count
  SELECT sum(CASE WHEN is_done THEN 1 ELSE 0 END), count(*)
    INTO checklist_done, checklist_total
  FROM public.gp_task_checklist WHERE task_id = _task_id;

  IF checklist_total > 0 THEN
    pct_checklist := 100.0 * checklist_done / checklist_total;
  END IF;

  -- subtasks count
  SELECT sum(CASE WHEN is_done THEN 1 ELSE 0 END), count(*)
    INTO subtasks_done, subtasks_total
  FROM public.gp_task_subtasks WHERE task_id = _task_id;

  IF subtasks_total > 0 THEN
    pct_subtasks := 100.0 * subtasks_done / subtasks_total;
  END IF;

  -- combine percentages
  IF pct_checklist IS NOT NULL AND pct_subtasks IS NOT NULL THEN
    pct_final := round((pct_checklist + pct_subtasks) / 2.0);
  ELSIF pct_checklist IS NOT NULL THEN
    pct_final := round(pct_checklist);
  ELSIF pct_subtasks IS NOT NULL THEN
    pct_final := round(pct_subtasks);
  ELSE
    -- fallback by status
    SELECT CASE status
      WHEN 'pending' THEN 10
      WHEN 'in_progress' THEN 50
      WHEN 'review' THEN 80
      WHEN 'completed' THEN 100
      ELSE 0
    END
    INTO pct_final
    FROM public.gp_tasks WHERE id = _task_id;
  END IF;

  UPDATE public.gp_tasks 
  SET progress = GREATEST(LEAST(pct_final, 100), 0)
  WHERE id = _task_id;

  RETURN NULL;
END $$;

-- Update existing trigger and add subtasks trigger
DROP TRIGGER IF EXISTS tr_checklist_progress ON public.gp_task_checklist;
CREATE TRIGGER tr_checklist_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.gp_task_checklist
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_task_progress();

DROP TRIGGER IF EXISTS tr_subtasks_progress ON public.gp_task_subtasks;
CREATE TRIGGER tr_subtasks_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.gp_task_subtasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_task_progress();

-- 5. Enhanced Gantt view with stage info (fixed date calculation)
CREATE OR REPLACE VIEW public.v_project_gantt AS
SELECT
  t.id as task_id,
  t.project_id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assigned_to,
  COALESCE(t.start_date, t.created_at::date) as start_date,
  t.due_date,
  t.progress,
  t.stage_id,
  s.name as stage_name,
  s.order_index as stage_order,
  -- Calculate if overdue
  CASE 
    WHEN t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE AND t.status != 'completed' 
    THEN true 
    ELSE false 
  END as is_overdue,
  -- Calculate duration in days (fixed)
  CASE 
    WHEN t.due_date IS NOT NULL 
    THEN (t.due_date - COALESCE(t.start_date, t.created_at::date)) + 1
    ELSE 1 
  END as duration_days,
  t.created_at,
  t.updated_at
FROM public.gp_tasks t
LEFT JOIN public.gp_project_stages s ON t.stage_id = s.id
ORDER BY COALESCE(s.order_index, 999), t.created_at;