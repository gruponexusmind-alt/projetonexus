-- 1. CORRIGIR POLÍTICAS RLS RECURSIVAS NA TABELA PROFILES
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- Criar função security definer para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = 'admin'::user_role
  );
$$;

-- Criar função security definer para obter company_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Novas políticas sem recursão
CREATE POLICY "Users can view profiles from their company" 
ON public.profiles 
FOR SELECT 
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Allow profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Admin pode gerenciar todos os perfis
CREATE POLICY "Admin can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin_user(auth.uid()));

-- 2. VERIFICAR E CRIAR EMPRESA GRUPO NEXUS MIND SE NÃO EXISTIR
INSERT INTO public.companies (name, email)
SELECT 'Grupo Nexus Mind', 'lucas@gruponexusmind.com.br'
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies 
  WHERE name = 'Grupo Nexus Mind' OR email = 'lucas@gruponexuzmind.com.br'
);

-- 3. CORRIGIR FUNÇÃO SETUP_ADMIN_USER PARA FUNCIONAR CORRETAMENTE  
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
    -- Buscar a empresa (tentar por email primeiro, depois por nome)
    SELECT id INTO company_id_var 
    FROM public.companies 
    WHERE email = user_email OR name = 'Grupo Nexus Mind' 
    ORDER BY (CASE WHEN email = user_email THEN 1 ELSE 2 END)
    LIMIT 1;
    
    -- Se não encontrou empresa, criar uma nova
    IF company_id_var IS NULL THEN
        INSERT INTO public.companies (name, email)
        VALUES ('Grupo Nexus Mind', user_email)
        RETURNING id INTO company_id_var;
    END IF;
    
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
            email = EXCLUDED.email,
            role = 'admin'::user_role,
            company_id = EXCLUDED.company_id,
            updated_at = now();
    END IF;
END;
$$;