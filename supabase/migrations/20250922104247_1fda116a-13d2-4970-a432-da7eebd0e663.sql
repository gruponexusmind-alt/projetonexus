-- Renomear tabelas para usar prefixo gp_ (gestão de projetos)
ALTER TABLE IF EXISTS projects RENAME TO gp_projects;
ALTER TABLE IF EXISTS clients RENAME TO gp_clients;
ALTER TABLE IF EXISTS checklist_items RENAME TO gp_checklist_items;
ALTER TABLE IF EXISTS tasks RENAME TO gp_tasks;
ALTER TABLE IF EXISTS meetings RENAME TO gp_meetings;
ALTER TABLE IF EXISTS documents RENAME TO gp_documents;
ALTER TABLE IF EXISTS comments RENAME TO gp_comments;

-- Atualizar foreign keys para as novas tabelas
ALTER TABLE IF EXISTS gp_checklist_items DROP CONSTRAINT IF EXISTS checklist_items_project_id_fkey;
ALTER TABLE IF EXISTS gp_checklist_items ADD CONSTRAINT gp_checklist_items_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES gp_projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS gp_tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE IF EXISTS gp_tasks ADD CONSTRAINT gp_tasks_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES gp_projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS gp_tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE IF EXISTS gp_tasks ADD CONSTRAINT gp_tasks_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES profiles(id);

ALTER TABLE IF EXISTS gp_meetings DROP CONSTRAINT IF EXISTS meetings_project_id_fkey;
ALTER TABLE IF EXISTS gp_meetings ADD CONSTRAINT gp_meetings_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES gp_projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS gp_documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
ALTER TABLE IF EXISTS gp_documents ADD CONSTRAINT gp_documents_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES gp_projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS gp_documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
ALTER TABLE IF EXISTS gp_documents ADD CONSTRAINT gp_documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES profiles(id);

ALTER TABLE IF EXISTS gp_comments DROP CONSTRAINT IF EXISTS comments_project_id_fkey;
ALTER TABLE IF EXISTS gp_comments ADD CONSTRAINT gp_comments_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES gp_projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS gp_comments DROP CONSTRAINT IF EXISTS comments_task_id_fkey;
ALTER TABLE IF EXISTS gp_comments ADD CONSTRAINT gp_comments_task_id_fkey 
  FOREIGN KEY (task_id) REFERENCES gp_tasks(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS gp_comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE IF EXISTS gp_comments ADD CONSTRAINT gp_comments_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES profiles(id);

-- Atualizar triggers para as novas tabelas
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;

CREATE TRIGGER update_gp_projects_updated_at
  BEFORE UPDATE ON gp_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gp_clients_updated_at
  BEFORE UPDATE ON gp_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gp_tasks_updated_at
  BEFORE UPDATE ON gp_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gp_meetings_updated_at
  BEFORE UPDATE ON gp_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gp_documents_updated_at
  BEFORE UPDATE ON gp_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gp_comments_updated_at
  BEFORE UPDATE ON gp_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();