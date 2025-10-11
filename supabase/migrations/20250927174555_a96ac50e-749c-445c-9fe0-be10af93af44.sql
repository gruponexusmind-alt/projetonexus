-- Corrigir problema de Security Definer View
-- Remover SECURITY DEFINER da view e recriar como view normal
DROP VIEW IF EXISTS public.v_project_task_stats;

CREATE VIEW public.v_project_task_stats AS
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