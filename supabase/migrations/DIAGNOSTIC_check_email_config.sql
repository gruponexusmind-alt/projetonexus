-- ============================================================================
-- DIAGNÓSTICO RÁPIDO - Verificar Configuração de E-mail
-- Execute este script no SQL Editor do Supabase para verificar o estado atual
-- ============================================================================

-- 1. Verificar se a tabela configuracoes_integracoes existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'configuracoes_integracoes'
  ) THEN
    RAISE NOTICE '✅ Tabela "configuracoes_integracoes" existe';
  ELSE
    RAISE WARNING '❌ Tabela "configuracoes_integracoes" NÃO existe';
  END IF;
END $$;

-- 2. Listar TODAS as configurações de integrações
SELECT
  id,
  company_id,
  nome,
  ativo,
  configuracoes,
  created_at
FROM public.configuracoes_integracoes
ORDER BY created_at DESC;

-- 3. Verificar especificamente configuração de E-mail
SELECT
  ci.id,
  c.name as empresa,
  ci.nome as tipo_integracao,
  ci.ativo,
  ci.configuracoes->>'provider' as provedor,
  ci.configuracoes->>'host' as host,
  ci.configuracoes->>'port' as porta,
  ci.configuracoes->>'from_email' as email_remetente
FROM public.configuracoes_integracoes ci
LEFT JOIN public.companies c ON ci.company_id = c.id
WHERE ci.nome = 'email';

-- 4. Verificar quantas empresas existem
SELECT
  COUNT(*) as total_empresas,
  string_agg(name, ', ') as nomes_empresas
FROM public.companies;

-- 5. Verificar se o usuário atual tem company_id
SELECT
  p.id,
  p.nome,
  p.email,
  p.company_id,
  c.name as empresa_nome
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE p.user_id = auth.uid();

-- 6. Testar política RLS - Ver se o usuário consegue acessar a configuração
SELECT
  'Teste RLS: ' || CASE
    WHEN COUNT(*) > 0 THEN '✅ Usuário consegue ver configurações'
    ELSE '❌ Usuário NÃO consegue ver configurações (problema de RLS)'
  END as resultado
FROM public.configuracoes_integracoes
WHERE nome = 'email';

-- ============================================================================
-- RESUMO
-- ============================================================================
DO $$
DECLARE
  config_count INTEGER;
  company_count INTEGER;
  user_has_company BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '📊 RESUMO DO DIAGNÓSTICO';
  RAISE NOTICE '====================================================================';

  -- Contar configurações de email
  SELECT COUNT(*) INTO config_count
  FROM public.configuracoes_integracoes
  WHERE nome = 'email' AND ativo = true;

  -- Contar empresas
  SELECT COUNT(*) INTO company_count
  FROM public.companies;

  -- Verificar se usuário tem company_id
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND company_id IS NOT NULL
  ) INTO user_has_company;

  RAISE NOTICE '';
  RAISE NOTICE 'Configurações de E-mail: %', config_count;
  RAISE NOTICE 'Total de Empresas: %', company_count;
  RAISE NOTICE 'Usuário tem empresa vinculada: %', user_has_company;
  RAISE NOTICE '';

  IF config_count = 0 THEN
    RAISE NOTICE '❌ PROBLEMA: Nenhuma configuração de e-mail encontrada!';
    RAISE NOTICE '   SOLUÇÃO: Execute a migration 20251212000002_fix_email_config.sql';
  ELSIF NOT user_has_company THEN
    RAISE NOTICE '❌ PROBLEMA: Usuário não tem company_id definido!';
    RAISE NOTICE '   SOLUÇÃO: Atualize o perfil do usuário com uma empresa válida';
  ELSE
    RAISE NOTICE '✅ Tudo OK! A configuração deveria estar visível na interface.';
    RAISE NOTICE '   Se não estiver, verifique o console do navegador (F12) para erros.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
END $$;
