-- Criar constraint única para email na tabela companies
ALTER TABLE public.companies ADD CONSTRAINT companies_email_unique UNIQUE (email);

-- Garantir que a empresa Grupo Nexus Mind existe
INSERT INTO public.companies (name, email) 
VALUES ('Grupo Nexus Mind', 'lucas@gruponexusmind.com.br')
ON CONFLICT (email) DO NOTHING;

-- Função para configurar usuário admin quando ele for criado via Supabase Auth
CREATE OR REPLACE FUNCTION public.setup_admin_user(user_email text, user_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    company_id_var UUID;
    user_id_var UUID;
BEGIN
    -- Buscar a empresa
    SELECT id INTO company_id_var 
    FROM public.companies 
    WHERE email = user_email OR name = 'Grupo Nexus Mind' 
    LIMIT 1;
    
    -- Buscar o usuário na tabela auth.users pelo email
    SELECT id INTO user_id_var 
    FROM auth.users 
    WHERE email = user_email 
    LIMIT 1;
    
    -- Se o usuário existe, criar/atualizar o perfil
    IF user_id_var IS NOT NULL AND company_id_var IS NOT NULL THEN
        INSERT INTO public.profiles (user_id, nome, email, role, company_id)
        VALUES (user_id_var, user_name, user_email, 'admin'::user_role, company_id_var)
        ON CONFLICT (user_id) DO UPDATE SET
            nome = EXCLUDED.nome,
            role = 'admin'::user_role,
            company_id = EXCLUDED.company_id;
    END IF;
END;
$$;