-- Corrigir view de estatísticas de tarefas do projeto
DROP VIEW IF EXISTS v_project_task_stats;

CREATE VIEW v_project_task_stats AS
SELECT 
  t.project_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE t.status = 'pending') as pending,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE t.status = 'review') as review,
  COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
  -- Calcular progress_score baseado no progresso real das tarefas
  COALESCE(ROUND(AVG(t.progress)), 0)::integer as progress_score
FROM gp_tasks t
WHERE t.blocked = false
GROUP BY t.project_id;