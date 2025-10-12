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
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token não fornecido' }),
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
    if (!decoded.client_id || !decoded.project_id || !decoded.email) {
      return new Response(
        JSON.stringify({ error: 'Token não contém dados necessários' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar expiração
    if (decoded.exp && decoded.exp < Date.now()) {
      return new Response(
        JSON.stringify({
          error: 'Convite expirado',
          expired: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do cliente (SEM RLS - usando service_role)
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('gp_clients')
      .select('id, name')
      .eq('id', decoded.client_id)
      .single();

    if (clientError || !clientData) {
      console.error('Erro ao buscar cliente:', clientError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do projeto (SEM RLS - usando service_role)
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('gp_projects')
      .select('id, title')
      .eq('id', decoded.project_id)
      .single();

    if (projectError || !projectData) {
      console.error('Erro ao buscar projeto:', projectError);
      return new Response(
        JSON.stringify({ error: 'Projeto não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar dados validados
    return new Response(
      JSON.stringify({
        valid: true,
        client_id: clientData.id,
        client_name: clientData.name,
        project_id: projectData.id,
        project_title: projectData.title,
        email: decoded.email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao validar convite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
