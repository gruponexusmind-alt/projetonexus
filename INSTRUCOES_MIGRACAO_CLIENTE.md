# 🚀 Instruções para Aplicar Migrations do Portal do Cliente

## ⚠️ ORDEM DE EXECUÇÃO É CRÍTICA!

Execute as migrations **nesta ordem exata**:

### 1️⃣ Primeiro: Adicionar 'cliente' ao enum
```bash
supabase db push
```

Se der erro, execute manualmente:
```sql
-- Arquivo: 20251011125900_add_cliente_to_user_role.sql
-- Esta migration adiciona 'cliente' ao enum user_role
```

### 2️⃣ Segundo: Adicionar client_id ao profiles
```sql
-- Arquivo: 20251011130000_add_client_id_to_profiles.sql
-- Adiciona coluna client_id na tabela profiles
```

### 3️⃣ Terceiro: Criar tabela de acesso
```sql
-- Arquivo: 20251011130100_create_project_client_access.sql
-- Cria tabela gp_project_client_access
```

### 4️⃣ Quarto: Políticas RLS
```sql
-- Arquivo: 20251011130200_rls_policies_for_client_role.sql
-- Cria todas as políticas RLS para clientes
```

## 🔧 Solução de Problemas

### Erro: "invalid input value for enum user_role: cliente"
**Causa**: A migration 1 não foi executada
**Solução**: Execute manualmente o SQL:
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'cliente';
```

### Erro: "relation gp_project_client_access does not exist"
**Causa**: As migrations não foram executadas em ordem
**Solução**: Execute as migrations 2 e 3 primeiro

## ✅ Verificação

Depois de aplicar, verifique:

```sql
-- 1. Verificar enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Resultado esperado: admin, operacional, cliente, financeiro, vendas

-- 2. Verificar coluna client_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'client_id';

-- 3. Verificar tabela
SELECT * FROM gp_project_client_access LIMIT 1;
```

## 📝 Ordem dos Arquivos

```
supabase/migrations/
├── 20251011125900_add_cliente_to_user_role.sql     ← 1º
├── 20251011130000_add_client_id_to_profiles.sql   ← 2º
├── 20251011130100_create_project_client_access.sql ← 3º
└── 20251011130200_rls_policies_for_client_role.sql ← 4º
```

## 🎯 Após Migrations

1. Reinicie o servidor de desenvolvimento
2. Teste criando um convite em `/projects/{id}`
3. Use o botão "Compartilhar"

