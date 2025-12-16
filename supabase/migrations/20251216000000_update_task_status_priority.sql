-- Migration: Update task status and priority options for Linear-like experience
-- Date: 2025-12-16

-- =============================================================================
-- PHASE 1: Update task STATUS constraint
-- =============================================================================
-- New status values: backlog, todo, in_progress, review, done, canceled, duplicate
-- Mapping existing values: pending -> todo, completed -> done

-- First, update existing data to new values
UPDATE gp_tasks SET status = 'todo' WHERE status = 'pending';
UPDATE gp_tasks SET status = 'done' WHERE status = 'completed';

-- Drop existing constraint
ALTER TABLE gp_tasks
DROP CONSTRAINT IF EXISTS gp_tasks_status_check;

-- Add new constraint with all status values
ALTER TABLE gp_tasks
ADD CONSTRAINT gp_tasks_status_check
CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'canceled', 'duplicate'));

-- =============================================================================
-- PHASE 2: Update task PRIORITY constraint
-- =============================================================================
-- New priority values: none, low, medium, high, urgent

-- Drop existing constraint if exists
ALTER TABLE gp_tasks
DROP CONSTRAINT IF EXISTS gp_tasks_priority_check;

-- Add new constraint with all priority values (including 'none' and 'urgent')
ALTER TABLE gp_tasks
ADD CONSTRAINT gp_tasks_priority_check
CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent'));

-- =============================================================================
-- PHASE 3: Add comment for documentation
-- =============================================================================
COMMENT ON COLUMN gp_tasks.status IS 'Task status: backlog, todo, in_progress, review, done, canceled, duplicate';
COMMENT ON COLUMN gp_tasks.priority IS 'Task priority: none, low, medium, high, urgent';
