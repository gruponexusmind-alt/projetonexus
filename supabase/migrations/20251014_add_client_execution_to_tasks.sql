-- Migration: Add client_execution field to gp_tasks
-- Created: 2025-10-14
-- Purpose: Track if task execution is client's responsibility

-- Add client_execution column to gp_tasks
ALTER TABLE public.gp_tasks
ADD COLUMN IF NOT EXISTS client_execution BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the column
COMMENT ON COLUMN public.gp_tasks.client_execution IS 'Indicates if the task execution is the client''s responsibility';

-- Create index for better performance when filtering by client_execution
CREATE INDEX IF NOT EXISTS idx_gp_tasks_client_execution
ON public.gp_tasks(company_id, client_execution)
WHERE client_execution = true;

-- Create composite index for common queries (company + status + client_execution)
CREATE INDEX IF NOT EXISTS idx_gp_tasks_company_status_client
ON public.gp_tasks(company_id, status, client_execution);
