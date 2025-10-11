-- =========================================
-- CRIAR TABELA GP_PROJECT_CLIENT_ACCESS
-- =========================================
-- Esta migration cria a tabela que controla quais clientes
-- têm acesso para visualizar quais projetos

-- 1. Criar tabela gp_project_client_access
CREATE TABLE IF NOT EXISTS public.gp_project_client_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.gp_projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.gp_clients(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID NOT NULL REFERENCES public.profiles(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Garantir que não haja duplicatas
  UNIQUE(project_id, client_id)
);

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_project_client_access_project ON public.gp_project_client_access(project_id);
CREATE INDEX IF NOT EXISTS idx_project_client_access_client ON public.gp_project_client_access(client_id);

-- 3. Habilitar RLS
ALTER TABLE public.gp_project_client_access ENABLE ROW LEVEL SECURITY;

-- 4. Política: Admins e operacionais podem gerenciar tudo
CREATE POLICY "admin_operacional_manage_client_access"
  ON public.gp_project_client_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'operacional')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'operacional')
    )
  );

-- 5. Política: Clientes podem apenas visualizar seus próprios acessos
CREATE POLICY "clients_view_own_access"
  ON public.gp_project_client_access
  FOR SELECT
  USING (
    client_id = (
      SELECT client_id FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'cliente'
    )
    AND revoked_at IS NULL
  );

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_gp_project_client_access_updated_at
  BEFORE UPDATE ON public.gp_project_client_access
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Comentários
COMMENT ON TABLE public.gp_project_client_access IS 'Controla quais clientes têm acesso para visualizar quais projetos no portal do cliente';
COMMENT ON COLUMN public.gp_project_client_access.revoked_at IS 'Se preenchido, indica que o acesso foi revogado';
