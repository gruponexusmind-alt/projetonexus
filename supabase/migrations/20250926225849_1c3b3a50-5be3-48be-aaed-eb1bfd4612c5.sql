-- Create companies table for multi-tenancy
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to profiles
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update profiles policies to be company-aware
DROP POLICY IF EXISTS "Allow viewing profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

CREATE POLICY "Users can view profiles from their company" 
ON public.profiles FOR SELECT 
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Allow profile creation during signup" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- Companies policies
CREATE POLICY "Users can view their company" 
ON public.companies FOR SELECT 
USING (id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage their company" 
ON public.companies FOR ALL 
USING (id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Update gp_clients to be company-aware
ALTER TABLE public.gp_clients ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update gp_clients policies
DROP POLICY IF EXISTS "Public access to gp_clients" ON public.gp_clients;

CREATE POLICY "Users can manage clients from their company" 
ON public.gp_clients FOR ALL 
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Update gp_projects to be company-aware
ALTER TABLE public.gp_projects ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update gp_projects policies
DROP POLICY IF EXISTS "Public access to gp_projects" ON public.gp_projects;

CREATE POLICY "Users can manage projects from their company" 
ON public.gp_projects FOR ALL 
USING (company_id = (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- Function to handle new user registration with company
CREATE OR REPLACE FUNCTION public.handle_new_user_with_company()
RETURNS TRIGGER AS $$
DECLARE
    company_id_var UUID;
BEGIN
    -- Check if company_id is provided in metadata
    IF NEW.raw_user_meta_data ? 'company_id' THEN
        company_id_var := (NEW.raw_user_meta_data->>'company_id')::UUID;
    ELSE
        -- Create new company for first user
        INSERT INTO public.companies (name, email)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'Nova Empresa'),
            NEW.email
        )
        RETURNING id INTO company_id_var;
    END IF;

    -- Create profile
    INSERT INTO public.profiles (user_id, nome, email, role, company_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
        NEW.email,
        CASE 
            WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE company_id = company_id_var)
            THEN 'admin'::user_role
            ELSE 'operacional'::user_role
        END,
        company_id_var
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_company();