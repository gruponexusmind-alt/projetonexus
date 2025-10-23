# ⚡ Instruções Rápidas - Reuniões e Expectativas

## 🎯 Problema
Reuniões e expectativas não aparecem na página pública do projeto.

## ✅ Solução Rápida (15 minutos)

### 📝 PASSO 1: Inserir Dados de Teste (5 min)

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo: `supabase/insert_test_data_simple.sql`
4. **PRIMEIRO**, execute esta query para pegar o ID do projeto:
   ```sql
   SELECT id, title, created_at
   FROM gp_projects
   ORDER BY created_at DESC
   LIMIT 5;
   ```
5. **Copie o ID do projeto GMAIA** (formato UUID)
6. No arquivo `insert_test_data_simple.sql`:
   - **SUBSTITUA** `'SEU_PROJECT_ID_AQUI'` pelo ID real (linha 17)
   - Cole TODO o conteúdo no SQL Editor
   - Clique **RUN**
7. Deve aparecer:
   ```
   ✅ DADOS INSERIDOS COM SUCESSO!
   - 3 reuniões
   - 4 expectativas (2 concluídas, 2 pendentes)
   - 2 riscos
   ```

### 🚀 PASSO 2: Deploy da Edge Function (5 min)

1. No Dashboard, vá em **Edge Functions**
2. Clique em **`validate-project-view`**
3. Abra o arquivo local: `supabase/functions/validate-project-view/index.ts`
4. Copie **TODO O CÓDIGO** do arquivo
5. Cole no editor da Edge Function (substitua tudo)
6. Clique **Deploy** (canto superior direito)
7. Aguarde confirmação ✅

### 🧪 PASSO 3: Testar (5 min)

1. Acesse o link público do projeto
2. Digite seu email
3. Verifique as abas:
   - ✅ **Reuniões**: 3 reuniões (1 futura, 2 passadas)
   - ✅ **Expectativas**: 4 expectativas (2 ✓, 2 pendentes)
   - ✅ **Riscos**: 2 riscos
4. Verifique os **Logs** da Edge Function:
   - Dashboard → Edge Functions → validate-project-view → Logs
   - Deve mostrar: `Meetings count: 3`, `Expectations count: 4`

---

## 🔍 Se Ainda Não Funcionar

### Verificar Dados no Banco
```sql
-- Execute no SQL Editor, substituindo o PROJECT_ID
SELECT
  (SELECT COUNT(*) FROM gp_meetings WHERE project_id = 'PROJECT_ID') as meetings,
  (SELECT COUNT(*) FROM gp_project_expectations WHERE project_id = 'PROJECT_ID') as expectations,
  (SELECT COUNT(*) FROM gp_project_risks WHERE project_id = 'PROJECT_ID') as risks;
```

Se retornar 0, execute o PASSO 1 novamente.

### Verificar Edge Function
1. Vá em Edge Functions → validate-project-view → Logs
2. Acesse o link público
3. Veja os logs aparecerem em tempo real
4. Procure por erros em vermelho

### Limpar Cache do Navegador
1. Pressione **Ctrl+Shift+R** (Windows) ou **Cmd+Shift+R** (Mac)
2. Ou abra em **aba anônima**

---

## 📂 Arquivos Importantes

- `insert_test_data_simple.sql` - Script para inserir dados ⭐ USE ESTE
- `check_project_data.sql` - Script para verificar dados
- `DEPLOY_EDGE_FUNCTION_MANUAL.md` - Guia completo de deploy
- `20251023000000_add_test_data_meetings_expectations.sql` - Migration (use apenas se souber o que está fazendo)

---

## ✅ Resultado Esperado

Após os 3 passos:

| Tab | Quantidade | Status |
|-----|------------|--------|
| Reuniões | 3 | ✅ 1 agendada, 2 concluídas |
| Expectativas | 4 | ✅ 2 concluídas, 2 pendentes |
| Riscos | 2 | ✅ 1 monitorando, 1 aberto |
| Suas Tarefas | 0 | ⚠️ Requer coluna na tabela |

O progresso também deve mostrar **68%** (não mais 54%).

---

## 💡 Dicas

- **Sempre use** `insert_test_data_simple.sql` para inserir dados de teste
- **Não execute** a migration `20251023000000...` se tiver erro de tabela não existente
- **Verifique os logs** da Edge Function para debug
- **Limpe o cache** se não ver mudanças

---

## 📞 Ainda com problemas?

1. Verifique se o projeto GMAIA existe: `SELECT * FROM gp_projects WHERE title ILIKE '%GMAIA%'`
2. Verifique se as tabelas existem: `SELECT * FROM gp_meetings LIMIT 1`
3. Execute `check_project_data.sql` com o ID correto
4. Veja os logs da Edge Function no Dashboard
