# ✅ PROBLEMA RESOLVIDO - Instruções de Migração Atualizadas

## 🎯 O QUE FOI CORRIGIDO

### Problema Original
```
ERROR: column "is_internal" does not exist
```

### Causa
- A tabela `gp_comments` foi recriada sem a coluna `is_internal`
- A tabela `gp_documents` foi substituída por `gp_project_documents`

### Solução Implementada
1. ✅ Criada migration para adicionar colunas faltantes
2. ✅ Atualizada migration de RLS policies

---

## 📦 ARQUIVOS CRIADOS/MODIFICADOS

### Arquivos de Migration (em ordem):

```
supabase/migrations/
├── 20251011125900_add_cliente_to_user_role.sql              ← 1º
├── 20251011130000_add_client_id_to_profiles.sql            ← 2º
├── 20251011130100_create_project_client_access.sql         ← 3º
├── 20251011130150_add_missing_columns_for_client_visibility.sql ← 4º NOVA
└── 20251011130200_rls_policies_for_client_role.sql         ← 5º MODIFICADA
```

### O que a Migration 4 faz:
```sql
-- Adiciona is_internal a gp_comments
ALTER TABLE gp_comments ADD COLUMN is_internal BOOLEAN DEFAULT false;

-- Adiciona is_client_visible a gp_project_documents
ALTER TABLE gp_project_documents ADD COLUMN is_client_visible BOOLEAN DEFAULT true;
```

### O que mudou na Migration 5:
- ❌ REMOVIDA: Policy para `gp_documents` (tabela antiga)
- ✅ ADICIONADA: Filtro `is_client_visible` em `gp_project_documents`
- ✅ MANTIDA: Filtro `is_internal` em `gp_comments`

---

## 🚀 COMO APLICAR

### Opção 1: Automática (Recomendado)
```bash
cd /Users/igorazevedo/Documents/nexusgestaoprojeto/projetonexus/projetonexus
supabase db push
```

### Opção 2: Manual (se necessário)
```bash
# Aplicar todas as migrations em ordem
psql $DATABASE_URL -f supabase/migrations/20251011125900_add_cliente_to_user_role.sql
psql $DATABASE_URL -f supabase/migrations/20251011130000_add_client_id_to_profiles.sql
psql $DATABASE_URL -f supabase/migrations/20251011130100_create_project_client_access.sql
psql $DATABASE_URL -f supabase/migrations/20251011130150_add_missing_columns_for_client_visibility.sql
psql $DATABASE_URL -f supabase/migrations/20251011130200_rls_policies_for_client_role.sql
```

---

## ✅ VERIFICAÇÃO

Depois de aplicar, rode estes comandos no Supabase SQL Editor:

```sql
-- 1. Verificar enum user_role
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
-- Esperado: admin, operacional, cliente, financeiro, vendas

-- 2. Verificar coluna is_internal em gp_comments
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'gp_comments' AND column_name = 'is_internal';
-- Esperado: is_internal | boolean | false

-- 3. Verificar coluna is_client_visible em gp_project_documents
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'gp_project_documents' AND column_name = 'is_client_visible';
-- Esperado: is_client_visible | boolean | true

-- 4. Verificar tabela gp_project_client_access
SELECT COUNT(*) FROM gp_project_client_access;
-- Deve retornar um número (mesmo que 0)

-- 5. Listar todas as policies para clientes
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%client%';
```

---

## 🎨 COMO USAR - FLUXO COMPLETO

### Para ADMIN:
1. Acesse um projeto em `/projects/{id}`
2. Clique no botão **"Compartilhar"**
3. Preencha nome e email do cliente
4. Copie o link gerado
5. Envie para o cliente

### Para CLIENTE:
1. Cliente clica no link de convite
2. Cria senha e confirma
3. É redirecionado para `/client/dashboard`
4. Vê apenas os projetos compartilhados com ele

---

## 🔒 CONTROLE DE VISIBILIDADE

### Documentos:
```typescript
// Marcar documento como visível para cliente
await supabase
  .from('gp_project_documents')
  .update({ is_client_visible: true })
  .eq('id', documentId);

// Cliente verá automaticamente
```

### Comentários:
```typescript
// Criar comentário interno (não visível para cliente)
await supabase
  .from('gp_comments')
  .insert({ 
    content: 'Comentário interno da equipe',
    is_internal: true 
  });

// Criar comentário visível para cliente
await supabase
  .from('gp_comments')
  .insert({ 
    content: 'Atualização para o cliente',
    is_internal: false 
  });
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Erro: "enum user_role already has value cliente"
**Solução:** Já foi aplicado, pode ignorar

### Erro: "column is_internal already exists"
**Solução:** Já foi aplicado, pode ignorar

### Erro: "relation gp_project_client_access already exists"
**Solução:** Já foi aplicado, pode ignorar

### Erro: "policy already exists"
**Solução:** Drop a policy antes:
```sql
DROP POLICY IF EXISTS "nome_da_policy" ON public.nome_da_tabela;
```

---

## ✨ PRONTO PARA USAR!

Após aplicar as migrations com `supabase db push`, o sistema estará completo:
- ✅ Role 'cliente' criada
- ✅ Tabelas configuradas
- ✅ RLS policies aplicadas
- ✅ Frontend funcionando
- ✅ Controle de visibilidade implementado

**Teste criando um convite agora!**

