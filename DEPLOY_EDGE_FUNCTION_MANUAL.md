# 🚀 Guia: Deploy Manual da Edge Function validate-project-view

## ⚠️ Por que precisa de deploy manual?

O comando CLI `npx supabase functions deploy` está retornando erro 403 (sem permissão). Por isso, precisamos fazer deploy pelo Dashboard do Supabase.

---

## 📋 Passo a Passo

### 1️⃣ Acessar o Dashboard do Supabase

1. Abra: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto **Nexus Gestão de Projetos**
4. No menu lateral, clique em **Edge Functions**

### 2️⃣ Localizar a Edge Function

1. Na lista de Edge Functions, procure por: **`validate-project-view`**
2. Se NÃO existir, clique em **"New Function"** e crie com o nome exato: `validate-project-view`
3. Se já existir, clique no nome dela para abrir

### 3️⃣ Copiar o Código Atualizado

Abra o arquivo local:
```
supabase/functions/validate-project-view/index.ts
```

**OU** copie o código abaixo (já está com as correções):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 [validate-project-view] Request received');
    const { token, email } = await req.json();

    console.log('📧 [validate-project-view] Email:', email ? 'present' : 'missing');
    console.log('🔑 [validate-project-view] Token:', token ? 'present' : 'missing');

    if (!token) {
      console.error('❌ [validate-project-view] Token missing');
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      console.error('❌ [validate-project-view] Email missing');
      return new Response(
        JSON.stringify({ error: 'Email não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔐 [validate-project-view] SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('🔐 [validate-project-view] SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'NOT SET');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ [validate-project-view] Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com SERVICE_ROLE (bypassa RLS)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Decodificar token (base64url -> base64 -> JSON)
    let decoded;
    try {
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      decoded = JSON.parse(atob(padded));
      console.log('📦 [validate-project-view] Token decoded successfully');
      console.log('📋 [validate-project-view] Project ID:', decoded.project_id);
      console.log('📧 [validate-project-view] Token email:', decoded.email);
      console.log('⏰ [validate-project-view] Expires at:', new Date(decoded.exp).toISOString());
    } catch (e) {
      console.error('❌ [validate-project-view] Token decode error:', e);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou corrompido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar campos obrigatórios
    if (!decoded.project_id || !decoded.email) {
      return new Response(
        JSON.stringify({ error: 'Token não contém dados necessários' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar expiração (7 dias)
    if (decoded.exp && decoded.exp < Date.now()) {
      return new Response(
        JSON.stringify({
          error: 'Link expirado',
          expired: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar email fornecido com email do token
    if (decoded.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email não corresponde ao convite' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do projeto (SEM RLS - usando service_role)
    console.log('🔍 [validate-project-view] Fetching project data...');
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('gp_projects')
      .select('id, title, description, status, priority, progress, deadline, start_date, created_at')
      .eq('id', decoded.project_id)
      .single();

    if (projectError || !projectData) {
      console.error('❌ [validate-project-view] Project fetch error:', projectError);
      console.error('❌ [validate-project-view] Project ID queried:', decoded.project_id);
      return new Response(
        JSON.stringify({
          error: 'Projeto não encontrado',
          details: projectError?.message || 'Project does not exist'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [validate-project-view] Project found:', projectData.title);

    // Buscar stages do projeto
    console.log('🔍 [validate-project-view] Fetching stages...');
    const { data: stagesData, error: stagesError } = await supabaseAdmin
      .from('gp_project_stages')
      .select('id, name, order_index, is_current, completed_at')
      .eq('project_id', decoded.project_id)
      .order('order_index');

    if (stagesError) {
      console.warn('⚠️ [validate-project-view] Stages fetch warning:', stagesError);
    }
    console.log('📊 [validate-project-view] Stages count:', stagesData?.length || 0);

    // Buscar estatísticas de tarefas
    console.log('🔍 [validate-project-view] Fetching task stats...');
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from('v_project_task_stats')
      .select('*')
      .eq('project_id', decoded.project_id)
      .single();

    if (statsError) {
      console.warn('⚠️ [validate-project-view] Stats fetch warning (this is OK if project has no tasks):', statsError.message);
      // Não retornar erro - é normal não ter stats se não há tarefas
    }
    console.log('📊 [validate-project-view] Stats found:', statsData ? 'YES' : 'NO');

    // Buscar documentos visíveis para cliente
    console.log('🔍 [validate-project-view] Fetching documents...');
    const { data: documentsData, error: documentsError } = await supabaseAdmin
      .from('gp_project_documents')
      .select('id, name, storage_path, size_bytes, mime_type, created_at')
      .eq('project_id', decoded.project_id)
      .eq('is_client_visible', true)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.warn('⚠️ [validate-project-view] Documents fetch warning:', documentsError);
    }
    console.log('📄 [validate-project-view] Documents count:', documentsData?.length || 0);

    // Buscar comentários não-internos
    console.log('🔍 [validate-project-view] Fetching comments...');
    const { data: commentsData, error: commentsError } = await supabaseAdmin
      .from('gp_comments')
      .select('id, content, created_at')
      .eq('project_id', decoded.project_id)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (commentsError) {
      console.warn('⚠️ [validate-project-view] Comments fetch warning:', commentsError);
    }
    console.log('💬 [validate-project-view] Comments count:', commentsData?.length || 0);

    // Buscar reuniões do projeto
    console.log('🔍 [validate-project-view] Fetching meetings...');
    const { data: meetingsData, error: meetingsError } = await supabaseAdmin
      .from('gp_meetings')
      .select('id, title, description, meeting_date, duration_minutes, meeting_type, status, meeting_link')
      .eq('project_id', decoded.project_id)
      .order('meeting_date', { ascending: false })
      .limit(20);

    if (meetingsError) {
      console.warn('⚠️ [validate-project-view] Meetings fetch warning:', meetingsError);
    }
    console.log('📅 [validate-project-view] Meetings count:', meetingsData?.length || 0);

    // Buscar expectativas do projeto
    console.log('🔍 [validate-project-view] Fetching expectations...');
    console.log('🔍 [validate-project-view] Project ID for expectations:', decoded.project_id);
    const { data: expectationsData, error: expectationsError } = await supabaseAdmin
      .from('gp_project_expectations')
      .select('id, title, description, is_done, position')
      .eq('project_id', decoded.project_id)
      .order('position', { ascending: true });

    if (expectationsError) {
      console.error('❌ [validate-project-view] Expectations fetch ERROR:', expectationsError);
      console.error('❌ [validate-project-view] Expectations error details:', JSON.stringify(expectationsError));
    } else {
      console.log('✅ [validate-project-view] Expectations fetched successfully');
      console.log('🎯 [validate-project-view] Expectations count:', expectationsData?.length || 0);
      console.log('🎯 [validate-project-view] Expectations data:', JSON.stringify(expectationsData));
    }

    // Buscar riscos do projeto
    console.log('🔍 [validate-project-view] Fetching risks...');
    const { data: risksData, error: risksError } = await supabaseAdmin
      .from('gp_project_risks')
      .select('id, title, probability, impact, mitigation, status')
      .eq('project_id', decoded.project_id)
      .order('created_at', { ascending: false });

    if (risksError) {
      console.warn('⚠️ [validate-project-view] Risks fetch warning:', risksError);
    }
    console.log('⚠️ [validate-project-view] Risks count:', risksData?.length || 0);

    // Buscar tarefas que requerem ação do cliente
    console.log('🔍 [validate-project-view] Fetching client tasks...');
    const { data: clientTasksData, error: clientTasksError } = await supabaseAdmin
      .from('gp_tasks')
      .select('id, title, description, status, priority, due_date')
      .eq('project_id', decoded.project_id)
      .eq('requires_client_action', true)
      .order('due_date', { ascending: true });

    if (clientTasksError) {
      console.warn('⚠️ [validate-project-view] Client tasks fetch warning:', clientTasksError);
    }
    console.log('👤 [validate-project-view] Client tasks count:', clientTasksData?.length || 0);

    // Calcular progresso real do projeto (completed / total * 100) - igual ao sistema interno
    const projectProgress = statsData?.total > 0
      ? Math.round((statsData.completed / statsData.total) * 100)
      : 0;

    console.log('📊 [validate-project-view] Calculated progress:', projectProgress + '%');
    console.log('📊 [validate-project-view] Stats breakdown:', {
      total: statsData?.total,
      completed: statsData?.completed,
      in_progress: statsData?.in_progress,
      pending: statsData?.pending
    });

    // Retornar dados validados
    console.log('✅ [validate-project-view] Access granted successfully');
    console.log('📊 [validate-project-view] Stats:', statsData ? 'present' : 'null');
    console.log('📝 [validate-project-view] Comments count:', commentsData?.length || 0);

    return new Response(
      JSON.stringify({
        valid: true,
        project: { ...projectData, progress: projectProgress },
        stages: stagesData || [],
        stats: statsData ? { ...statsData, progress: projectProgress } : null,
        documents: documentsData || [],
        comments: commentsData || [],
        meetings: meetingsData || [],
        expectations: expectationsData || [],
        risks: risksData || [],
        clientTasks: clientTasksData || [],
        expires_at: decoded.exp,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao validar acesso' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4️⃣ Colar e Salvar

1. No editor da Edge Function no Dashboard
2. **DELETE TODO O CÓDIGO ANTIGO**
3. Cole o código novo (copiado acima ou do arquivo local)
4. Clique em **"Deploy"** (botão no canto superior direito)
5. Aguarde a mensagem de sucesso ✅

### 5️⃣ Verificar Variáveis de Ambiente

1. No Dashboard, vá em **Settings** → **Edge Functions**
2. Verifique se as seguintes variáveis estão configuradas:
   - `SUPABASE_URL` (deve estar preenchida automaticamente)
   - `SUPABASE_SERVICE_ROLE_KEY` (deve estar preenchida automaticamente)
3. Se não estiverem, copie de **Settings** → **API**

---

## 🧪 Como Testar Após Deploy

### 1. Verificar Logs

1. No Dashboard, vá em **Edge Functions** → **validate-project-view**
2. Clique na aba **"Logs"**
3. Acesse um link público do projeto
4. Veja os logs em tempo real:
   - ✅ `Project found: GMAIA`
   - ✅ `Meetings count: 3`
   - ✅ `Expectations count: 4`
   - ✅ `Access granted successfully`

### 2. Testar na Interface

1. Acesse o link público do projeto (formato: `/public-project/:token`)
2. Digite seu email
3. Verifique se as abas aparecem:
   - ✅ **Reuniões** → deve mostrar 3 reuniões
   - ✅ **Expectativas** → deve mostrar 4 expectativas
   - ✅ **Riscos** → deve mostrar 2 riscos
   - ✅ **Suas Tarefas** → deve mostrar 2 tarefas

### 3. Verificar Progresso Corrigido

- O progresso agora deve mostrar **68%** (correto)
- Não mais **54%** (cálculo errado antigo)

---

## ❓ Problemas Comuns

### Erro: "Token inválido"
**Solução**: Gere um novo link público no sistema interno

### Logs mostram: "Meetings count: 0"
**Solução**: Execute a migration de dados de teste primeiro (veja próxima seção)

### Erro: "SUPABASE_SERVICE_ROLE_KEY not set"
**Solução**: Configure as variáveis de ambiente em Settings → Edge Functions

---

## 📦 Executar Migration de Dados de Teste

Se os logs mostrarem 0 reuniões/expectativas:

1. Vá em **SQL Editor** no Dashboard
2. Abra o arquivo: `supabase/migrations/20251023000000_add_test_data_meetings_expectations.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"**
6. Aguarde mensagem: `Dados de teste inseridos com sucesso!`
7. Teste novamente o link público

---

## ✅ Checklist Final

- [ ] Edge Function deployada via Dashboard
- [ ] Variáveis de ambiente configuradas
- [ ] Migration de dados executada
- [ ] Logs mostram dados sendo buscados
- [ ] Interface exibe reuniões e expectativas
- [ ] Progresso mostra 68% (não 54%)

---

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs da Edge Function no Dashboard
2. Verifique o console do navegador (F12)
3. Confirme que o projeto GMAIA existe no banco
4. Execute o script `check_project_data.sql` para validar dados
