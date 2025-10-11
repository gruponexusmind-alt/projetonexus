-- Fix security issues: Update functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_with_company()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;