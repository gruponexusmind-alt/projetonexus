-- Fix security issues identified by linter

-- 1. Fix function search paths (security warnings)
CREATE OR REPLACE FUNCTION public.fn_check_task_stage_same_project()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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

CREATE OR REPLACE FUNCTION public.fn_recalc_task_progress()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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