-- Migration: Add order_index to gp_tasks for kanban reordering
-- Created: 2025-10-14

-- Add order_index column to gp_tasks
ALTER TABLE public.gp_tasks
ADD COLUMN IF NOT EXISTS order_index integer;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gp_tasks_order ON public.gp_tasks(project_id, status, order_index);

-- Populate order_index based on created_at for existing tasks
-- Group by project_id and status, order by created_at
WITH ranked_tasks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id, status ORDER BY created_at) - 1 AS new_order
  FROM public.gp_tasks
  WHERE order_index IS NULL
)
UPDATE public.gp_tasks t
SET order_index = rt.new_order
FROM ranked_tasks rt
WHERE t.id = rt.id;

-- Set default value for new tasks
ALTER TABLE public.gp_tasks
ALTER COLUMN order_index SET DEFAULT 0;

-- Add NOT NULL constraint after populating existing rows
ALTER TABLE public.gp_tasks
ALTER COLUMN order_index SET NOT NULL;
