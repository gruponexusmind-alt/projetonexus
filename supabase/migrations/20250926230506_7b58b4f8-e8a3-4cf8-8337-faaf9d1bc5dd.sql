-- Insert sample data step by step
INSERT INTO public.gp_clients (name, contact_person, email, phone, company, segment, company_id) 
SELECT 
    'TechCorp Solutions', 'João Silva', 'joao@techcorp.com', '(11) 99999-1234', 'TechCorp Solutions', 'Tecnologia', c.id
FROM public.companies c WHERE c.email = 'demo@nexusmind.com'
UNION ALL
SELECT 
    'Innovate Digital', 'Maria Santos', 'maria@innovate.com', '(11) 99999-2345', 'Innovate Digital', 'Marketing Digital', c.id
FROM public.companies c WHERE c.email = 'demo@nexusmind.com'
UNION ALL
SELECT 
    'FutureAI Labs', 'Pedro Costa', 'pedro@futureai.com', '(11) 99999-3456', 'FutureAI Labs', 'Inteligência Artificial', c.id
FROM public.companies c WHERE c.email = 'demo@nexusmind.com';

-- Insert a few sample projects
WITH demo_company AS (
    SELECT id as company_id FROM public.companies WHERE email = 'demo@nexusmind.com' LIMIT 1
),
tech_client AS (
    SELECT id as client_id FROM public.gp_clients WHERE name = 'TechCorp Solutions' LIMIT 1
),
innovate_client AS (
    SELECT id as client_id FROM public.gp_clients WHERE name = 'Innovate Digital' LIMIT 1
)
INSERT INTO public.gp_projects (title, description, status, priority, progress, client_id, company_id, deadline)
SELECT 'Agente de Vendas CRM', 'Desenvolvimento do agente de vendas integrado ao Salesforce', 'development', 'high', 75, tc.client_id, dc.company_id, CURRENT_DATE + INTERVAL '30 days'
FROM demo_company dc, tech_client tc
UNION ALL
SELECT 'Chatbot de Suporte', 'Bot inteligente para atendimento 24/7', 'development', 'medium', 40, ic.client_id, dc.company_id, CURRENT_DATE + INTERVAL '25 days'
FROM demo_company dc, innovate_client ic;