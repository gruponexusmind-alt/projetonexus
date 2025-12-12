-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO - NÃO É UMA MIGRATION
-- Execute este script manualmente no SQL Editor do Supabase para diagnosticar
-- problemas antes de rodar as migrations de configuração de integrações
-- ============================================================================

-- 1. Verificar se a tabela companies existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'companies'
  ) THEN
    RAISE NOTICE '✅ Tabela "companies" existe';
  ELSE
    RAISE WARNING '❌ Tabela "companies" NÃO existe - Execute migration 20250926225849 primeiro';
  END IF;
END $$;

-- 2. Verificar se a tabela profiles existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '✅ Tabela "profiles" existe';
  ELSE
    RAISE WARNING '❌ Tabela "profiles" NÃO existe - Crie a tabela profiles primeiro';
  END IF;
END $$;

-- 3. Verificar se a coluna company_id existe na tabela profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'company_id'
  ) THEN
    RAISE NOTICE '✅ Coluna "profiles.company_id" existe';
  ELSE
    RAISE WARNING '❌ Coluna "profiles.company_id" NÃO existe - Execute migration 20250926225849 primeiro';
  END IF;
END $$;

-- 4. Verificar se a coluna user_id existe na tabela profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '✅ Coluna "profiles.user_id" existe';
  ELSE
    RAISE WARNING '❌ Coluna "profiles.user_id" NÃO existe - Verifique estrutura da tabela profiles';
  END IF;
END $$;

-- 5. Listar todas as colunas da tabela profiles (se existir)
DO $$
DECLARE
  col_record RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE NOTICE '📋 Estrutura da tabela "profiles":';
    FOR col_record IN
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '   - %: % (nullable: %, default: %)',
        col_record.column_name,
        col_record.data_type,
        col_record.is_nullable,
        COALESCE(col_record.column_default, 'none');
    END LOOP;
  END IF;
END $$;

-- 6. Verificar se existem empresas cadastradas
DO $$
DECLARE
  company_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) THEN
    SELECT COUNT(*) INTO company_count FROM public.companies;
    IF company_count > 0 THEN
      RAISE NOTICE '✅ Existem % empresa(s) cadastrada(s)', company_count;
    ELSE
      RAISE WARNING '⚠️  Nenhuma empresa cadastrada - A seed data não terá efeito';
    END IF;
  END IF;
END $$;

-- 7. Verificar migrations já executadas (opcional - requer extensão)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'supabase_migrations'
    AND table_name = 'schema_migrations'
  ) THEN
    RAISE NOTICE '📜 Últimas 10 migrations executadas:';
    PERFORM version FROM supabase_migrations.schema_migrations
    ORDER BY version DESC LIMIT 10;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Não foi possível verificar histórico de migrations';
END $$;

-- ============================================================================
-- CONCLUSÃO DO DIAGNÓSTICO
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '🔍 DIAGNÓSTICO CONCLUÍDO';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Se todas as verificações acima mostraram ✅, você pode executar:';
  RAISE NOTICE '  1. npx supabase db push';
  RAISE NOTICE '  OU';
  RAISE NOTICE '  2. Executar manualmente as migrations 20251212000000 e 20251212000001';
  RAISE NOTICE '';
  RAISE NOTICE 'Se alguma verificação mostrou ❌, você precisa:';
  RAISE NOTICE '  1. Executar primeiro a migration 20250926225849';
  RAISE NOTICE '  2. Ou criar manualmente as tabelas/colunas faltantes';
  RAISE NOTICE '';
END $$;
