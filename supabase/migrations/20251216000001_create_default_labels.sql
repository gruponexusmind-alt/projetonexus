-- Migration: Create default labels for Linear-like task management
-- Date: 2025-12-16

-- =============================================================================
-- Create function to add default labels to a company
-- =============================================================================
CREATE OR REPLACE FUNCTION create_default_labels_for_company(p_company_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert Bug label if not exists
  INSERT INTO gp_labels (company_id, name, color)
  SELECT p_company_id, 'Bug', '#ef4444'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_labels
    WHERE company_id = p_company_id AND name = 'Bug'
  );

  -- Insert Feature label if not exists
  INSERT INTO gp_labels (company_id, name, color)
  SELECT p_company_id, 'Feature', '#8b5cf6'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_labels
    WHERE company_id = p_company_id AND name = 'Feature'
  );

  -- Insert Improvement label if not exists
  INSERT INTO gp_labels (company_id, name, color)
  SELECT p_company_id, 'Improvement', '#3b82f6'
  WHERE NOT EXISTS (
    SELECT 1 FROM gp_labels
    WHERE company_id = p_company_id AND name = 'Improvement'
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Add default labels to all existing companies
-- =============================================================================
DO $$
DECLARE
  company_record RECORD;
BEGIN
  -- Get all unique company_ids from gp_tasks or gp_projects
  FOR company_record IN
    SELECT DISTINCT company_id FROM gp_tasks WHERE company_id IS NOT NULL
    UNION
    SELECT DISTINCT company_id FROM gp_projects WHERE company_id IS NOT NULL
  LOOP
    PERFORM create_default_labels_for_company(company_record.company_id);
  END LOOP;
END $$;

-- =============================================================================
-- Comment for documentation
-- =============================================================================
COMMENT ON FUNCTION create_default_labels_for_company IS 'Creates default labels (Bug, Feature, Improvement) for a company if they do not already exist';
