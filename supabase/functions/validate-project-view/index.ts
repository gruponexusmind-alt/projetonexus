import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, email } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com SERVICE_ROLE (bypassa RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
    } catch (e) {
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
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('gp_projects')
      .select('id, title, description, status, priority, progress, deadline, start_date, created_at')
      .eq('id', decoded.project_id)
      .single();

    if (projectError || !projectData) {
      console.error('Erro ao buscar projeto:', projectError);
      return new Response(
        JSON.stringify({ error: 'Projeto não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar stages do projeto
    const { data: stagesData } = await supabaseAdmin
      .from('gp_project_stages')
      .select('id, name, order_index, is_current, completed_at')
      .eq('project_id', decoded.project_id)
      .order('order_index');

    // Buscar estatísticas de tarefas
    const { data: statsData } = await supabaseAdmin
      .from('v_project_task_stats')
      .select('*')
      .eq('project_id', decoded.project_id)
      .single();

    // Buscar documentos visíveis para cliente
    const { data: documentsData } = await supabaseAdmin
      .from('gp_project_documents')
      .select('id, name, storage_path, size_bytes, mime_type, created_at')
      .eq('project_id', decoded.project_id)
      .eq('is_client_visible', true)
      .order('created_at', { ascending: false });

    // Buscar comentários não-internos
    const { data: commentsData } = await supabaseAdmin
      .from('gp_comments')
      .select('id, content, created_at')
      .eq('project_id', decoded.project_id)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Retornar dados validados
    return new Response(
      JSON.stringify({
        valid: true,
        project: projectData,
        stages: stagesData || [],
        stats: statsData || null,
        documents: documentsData || [],
        comments: commentsData || [],
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
