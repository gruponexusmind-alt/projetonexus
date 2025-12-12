-- Correção: Inserir/Atualizar configuração SMTP do Resend
-- Este script garante que a configuração de e-mail existe no banco de dados

-- Inserir ou atualizar configuração SMTP do Resend para todas as empresas
INSERT INTO public.configuracoes_integracoes (company_id, nome, ativo, configuracoes)
SELECT
  c.id as company_id,
  'email' as nome,
  true as ativo,
  jsonb_build_object(
    'provider', 'smtp',
    'host', 'smtp.resend.com',
    'port', '465',
    'username', 'resend',
    'password', 're_W47ykKBN_BBtHebV3Cb7eMKB1yaMi3Xzf',
    'from_name', 'Nexus',
    'from_email', 'noreply@gruponexusmind.com.br'
  ) as configuracoes
FROM public.companies c
WHERE NOT EXISTS (
  -- Só insere se não existir configuração de email para essa empresa
  SELECT 1 FROM public.configuracoes_integracoes ci
  WHERE ci.company_id = c.id AND ci.nome = 'email'
)
ON CONFLICT (company_id, nome) DO UPDATE
SET
  ativo = EXCLUDED.ativo,
  configuracoes = EXCLUDED.configuracoes,
  updated_at = now();

-- Verificar se foi inserido com sucesso
DO $$
DECLARE
  config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO config_count
  FROM public.configuracoes_integracoes
  WHERE nome = 'email' AND ativo = true;

  IF config_count > 0 THEN
    RAISE NOTICE '✅ Configuração SMTP inserida com sucesso para % empresa(s)', config_count;
  ELSE
    RAISE WARNING '⚠️  Nenhuma configuração foi inserida. Verifique se existem empresas na tabela companies.';
  END IF;
END $$;
