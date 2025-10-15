-- Criar view para calcular estatísticas de tempo por projeto
CREATE OR REPLACE VIEW v_project_time_stats AS
WITH user_hours AS (
  SELECT
    t.project_id,
    te.user_id,
    p.nome as user_name,
    SUM(te.duration_minutes) as total_minutes
  FROM gp_tasks t
  LEFT JOIN gp_time_entries te ON te.task_id = t.id
  LEFT JOIN profiles p ON p.id = te.user_id
  WHERE te.id IS NOT NULL
  GROUP BY t.project_id, te.user_id, p.nome
)
SELECT
  t.project_id,
  COUNT(DISTINCT te.id) as total_entries,
  COUNT(DISTINCT te.user_id) as unique_users,
  COALESCE(SUM(te.duration_minutes), 0) as total_minutes,
  COALESCE(ROUND(SUM(te.duration_minutes) / 60.0, 2), 0) as total_hours,
  COALESCE(ROUND(AVG(te.duration_minutes) / 60.0, 2), 0) as avg_hours_per_entry,
  -- Horas por usuário (formato JSON)
  (
    SELECT json_agg(jsonb_build_object(
      'user_id', uh.user_id,
      'user_name', uh.user_name,
      'hours', ROUND(uh.total_minutes / 60.0, 2)
    ))
    FROM user_hours uh
    WHERE uh.project_id = t.project_id
  ) as hours_by_user
FROM gp_tasks t
LEFT JOIN gp_time_entries te ON te.task_id = t.id
GROUP BY t.project_id;

-- Comentário
COMMENT ON VIEW v_project_time_stats IS 'Estatísticas de tempo trabalhado por projeto, incluindo total de horas e distribuição por usuário';

-- Garantir permissões
GRANT SELECT ON v_project_time_stats TO authenticated;
