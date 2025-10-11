-- Criar tabelas com prefixo gp_ (gestão de projetos)

-- Tabela de clientes do sistema de gestão de projetos
CREATE TABLE gp_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  segment TEXT,
  address TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de projetos do sistema de gestão
CREATE TABLE gp_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES gp_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'strategy', 'development', 'testing', 'delivery', 'monitoring')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  complexity INTEGER DEFAULT 1 CHECK (complexity BETWEEN 1 AND 5),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  deadline DATE,
  assigned_to UUID REFERENCES profiles(id),
  budget DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de checklist dos projetos
CREATE TABLE gp_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES gp_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tarefas/demandas dos projetos
CREATE TABLE gp_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES gp_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de reuniões dos projetos
CREATE TABLE gp_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES gp_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_type TEXT DEFAULT 'internal' CHECK (meeting_type IN ('internal', 'client', 'kickoff', 'review')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  meeting_link TEXT,
  attendees JSONB,
  agenda JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de documentos dos projetos
CREATE TABLE gp_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES gp_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  is_client_visible BOOLEAN DEFAULT false,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de comentários dos projetos e tarefas
CREATE TABLE gp_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES gp_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES gp_tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  parent_comment_id UUID REFERENCES gp_comments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE gp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acesso público temporário (será refinado com autenticação)
CREATE POLICY "Public access to gp_clients" ON gp_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to gp_projects" ON gp_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to gp_checklist_items" ON gp_checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to gp_tasks" ON gp_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to gp_meetings" ON gp_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to gp_documents" ON gp_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to gp_comments" ON gp_comments FOR ALL USING (true) WITH CHECK (true);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_gp_clients_updated_at
  BEFORE UPDATE ON gp_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gp_projects_updated_at
  BEFORE UPDATE ON gp_projects
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