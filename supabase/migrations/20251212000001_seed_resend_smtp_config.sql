-- Inserir configuração SMTP do Resend para todas as empresas existentes
-- Esta migration adiciona automaticamente a configuração do Resend para envio de e-mails

-- Inserir configuração SMTP do Resend para cada empresa
INSERT INTO public.configuracoes_integracoes (company_id, nome, ativo, configuracoes)
SELECT
  id,
  'email',
  true,
  jsonb_build_object(
    'provider', 'smtp',
    'host', 'smtp.resend.com',
    'port', '465',
    'username', 'resend',
    'password', 're_W47ykKBN_BBtHebV3Cb7eMKB1yaMi3Xzf',
    'from_name', 'Nexus',
    'from_email', 'noreply@gruponexusmind.com.br'
  )
FROM public.companies
ON CONFLICT (company_id, nome) DO NOTHING;
