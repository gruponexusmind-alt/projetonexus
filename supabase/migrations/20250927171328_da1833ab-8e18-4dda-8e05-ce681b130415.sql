-- Associar usuários existentes à empresa "Grupo Nexus Mind"
-- Isso resolverá o problema de RLS na criação de projetos

UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE name = 'Grupo Nexus Mind' 
  LIMIT 1
)
WHERE company_id IS NULL;