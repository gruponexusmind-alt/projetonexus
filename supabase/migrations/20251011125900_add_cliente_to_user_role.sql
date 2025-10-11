-- =========================================
-- ADICIONAR 'CLIENTE' AO ENUM USER_ROLE
-- =========================================
-- Esta migration adiciona o valor 'cliente' ao enum user_role
-- para suportar usuários externos (clientes) no sistema

-- 1. Adicionar 'cliente' ao enum user_role se ainda não existir
DO $$
BEGIN
    -- Verificar se o tipo user_role existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'operacional', 'cliente', 'financeiro', 'vendas');
    ELSE
        -- Se existe, adicionar 'cliente' se ainda não estiver lá
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumlabel = 'cliente'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'cliente';
        END IF;

        -- Adicionar 'financeiro' se não existir
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumlabel = 'financeiro'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'financeiro';
        END IF;

        -- Adicionar 'vendas' se não existir
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumlabel = 'vendas'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'vendas';
        END IF;
    END IF;
END $$;

-- 2. Comentário
COMMENT ON TYPE user_role IS 'Roles de usuários: admin, operacional, cliente, financeiro, vendas';
