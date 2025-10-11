-- =========================================
-- RLS POLICIES PARA ROLE CLIENTE
-- =========================================
-- Esta migration cria políticas RLS específicas para usuários
-- com role='cliente' para que vejam apenas seus projetos e
-- informações não-internas

-- ================================================================
-- GP_PROJECTS: Clientes veem apenas projetos compartilhados com eles
-- ================================================================

CREATE POLICY "clients_view_shared_projects"
  ON public.gp_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_projects.id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_CLIENTS: Clientes veem apenas seus próprios dados
-- ================================================================

CREATE POLICY "clients_view_own_data"
  ON public.gp_clients
  FOR SELECT
  USING (
    id = (
      SELECT client_id FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'cliente'
    )
  );

-- ================================================================
-- GP_PROJECT_STAGES: Clientes veem etapas dos projetos compartilhados
-- ================================================================

CREATE POLICY "clients_view_stages_of_shared_projects"
  ON public.gp_project_stages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_project_stages.project_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_TASKS: Clientes veem apenas estatísticas agregadas (não detalhes)
-- Usarão a view v_project_task_stats para visualização
-- ================================================================

CREATE POLICY "clients_view_tasks_of_shared_projects"
  ON public.gp_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_tasks.project_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_PROJECT_DOCUMENTS: Clientes veem apenas documentos marcados como visíveis
-- ================================================================

CREATE POLICY "clients_view_project_documents"
  ON public.gp_project_documents
  FOR SELECT
  USING (
    is_client_visible = true
    AND EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_project_documents.project_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_COMMENTS: Clientes veem apenas comentários NÃO-INTERNOS
-- ================================================================

CREATE POLICY "clients_view_non_internal_comments"
  ON public.gp_comments
  FOR SELECT
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_comments.project_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_TASK_COMMENTS: Clientes veem comentários de tarefas dos projetos compartilhados
-- ================================================================

CREATE POLICY "clients_view_task_comments_of_shared_projects"
  ON public.gp_task_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.gp_tasks t
      INNER JOIN public.gp_project_client_access pca ON pca.project_id = t.project_id
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE t.id = gp_task_comments.task_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_PROJECT_EXPECTATIONS: Clientes veem expectativas dos projetos compartilhados
-- ================================================================

CREATE POLICY "clients_view_expectations_of_shared_projects"
  ON public.gp_project_expectations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_project_expectations.project_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- GP_MEETINGS: Clientes veem reuniões dos projetos compartilhados
-- ================================================================

CREATE POLICY "clients_view_meetings_of_shared_projects"
  ON public.gp_meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gp_project_client_access pca
      INNER JOIN public.profiles p ON p.client_id = pca.client_id
      WHERE pca.project_id = gp_meetings.project_id
      AND p.user_id = auth.uid()
      AND p.role = 'cliente'
      AND pca.revoked_at IS NULL
    )
  );

-- ================================================================
-- PROFILES: Clientes podem ver apenas seu próprio perfil
-- ================================================================

CREATE POLICY "clients_view_own_profile"
  ON public.profiles
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- ================================================================
-- COMENTÁRIOS FINAIS
-- ================================================================

COMMENT ON POLICY "clients_view_shared_projects" ON public.gp_projects IS 'Permite clientes visualizarem apenas projetos compartilhados com eles via gp_project_client_access';
COMMENT ON POLICY "clients_view_project_documents" ON public.gp_project_documents IS 'Clientes veem apenas documentos marcados como is_client_visible=true dos projetos compartilhados';
COMMENT ON POLICY "clients_view_non_internal_comments" ON public.gp_comments IS 'Clientes NÃO veem comentários marcados como is_internal=true';
