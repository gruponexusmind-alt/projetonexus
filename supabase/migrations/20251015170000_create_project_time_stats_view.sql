-- Criar view para calcular estatísticas de tempo por projeto
-- Primeiro, remover a view antiga se existir
DROP VIEW IF EXISTS v_project_time_stats;

-- Criar a nova view
CREATE VIEW v_project_time_stats AS
SELECT
  p.id as project_id,
  COUNT(te.id) as total_entries,
  COUNT(DISTINCT te.user_id) FILTER (WHERE te.id IS NOT NULL) as unique_users,
  COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
  COALESCE(ROUND(SUM(te.duration_minutes) / 60.0, 2), 0) as total_hours,
  COALESCE(ROUND(AVG(te.duration_minutes) FILTER (WHERE te.duration_minutes IS NOT NULL) / 60.0, 2), 0) as avg_hours_per_entry
FROM gp_projects p
LEFT JOIN gp_tasks t ON t.project_id = p.id
LEFT JOIN gp_time_entries te ON te.task_id = t.id
GROUP BY p.id;

-- Comentário
COMMENT ON VIEW v_project_time_stats IS 'Estatísticas de tempo trabalhado por projeto, incluindo total de horas e distribuição por usuário';

-- Garantir permissões
GRANT SELECT ON v_project_time_stats TO authenticated;
