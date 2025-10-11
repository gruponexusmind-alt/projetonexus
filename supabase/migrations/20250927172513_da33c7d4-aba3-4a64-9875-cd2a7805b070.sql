-- Migrar dados de nm_clientes para gp_clients com associação à empresa Grupo Nexus Mind
-- Corrigindo campos para mapear corretamente
DO $$
DECLARE
    company_id_var UUID := 'a26a3e3b-cf5d-402e-b943-0647b2fc5e84';
BEGIN
    -- Migrar clientes de nm_clientes para gp_clients
    INSERT INTO public.gp_clients (
        name, 
        contact_person, 
        email, 
        phone, 
        company, 
        segment, 
        address, 
        observations,
        company_id
    )
    SELECT 
        nome as name,
        contato as contact_person,
        email,
        telefone as phone,
        nome as company, -- Usar nome como nome da empresa também
        segmento as segment,
        CONCAT_WS(', ', endereco, cidade, estado, cep) as address,
        observacoes as observations,
        company_id_var as company_id
    FROM public.nm_clientes
    WHERE NOT EXISTS (
        SELECT 1 FROM public.gp_clients gc 
        WHERE gc.email = nm_clientes.email OR gc.name = nm_clientes.nome
    );
END $$;

-- Configurar RLS para gp_clients se não estiver ativo
ALTER TABLE public.gp_clients ENABLE ROW LEVEL SECURITY;

-- Criar policy para leitura de clientes por empresa (se não existir)
DROP POLICY IF EXISTS "Users can manage clients from their company" ON public.gp_clients;
CREATE POLICY "Users can manage clients from their company"
ON public.gp_clients FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Criar policy adicional para garantir integridade na inserção de projetos
DROP POLICY IF EXISTS "Users can manage projects from their company" ON public.gp_projects;
CREATE POLICY "Users can manage projects from their company"
ON public.gp_projects FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    AND client_id IN (
        SELECT id FROM public.gp_clients
        WHERE company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
    )
);