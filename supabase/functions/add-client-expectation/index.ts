import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  token: string;
  email: string;
  title: string;
  description?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [add-client-expectation] Function invoked');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { token, email, title, description }: RequestBody = await req.json()

    console.log('📧 [add-client-expectation] Email:', email);
    console.log('📝 [add-client-expectation] Title:', title);

    // Validações básicas
    if (!token || !email || !title) {
      return new Response(
        JSON.stringify({ error: 'Token, email e título são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar tamanho dos campos
    if (title.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Título deve ter no mínimo 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (title.trim().length > 200) {
      return new Response(
        JSON.stringify({ error: 'Título muito longo (máximo 200 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (description && description.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Descrição muito longa (máximo 500 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar e decodificar token
    console.log('🔐 [add-client-expectation] Verifying token...');
    const secret = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'your-secret-key')

    let decoded: any;
    try {
      const { payload } = await jose.jwtVerify(token, secret)
      decoded = payload
      console.log('✅ [add-client-expectation] Token verified');
    } catch (error) {
      console.error('❌ [add-client-expectation] Invalid token:', error);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar email
    if (decoded.email !== email.trim().toLowerCase()) {
      console.error('❌ [add-client-expectation] Email mismatch');
      return new Response(
        JSON.stringify({ error: 'Email não corresponde ao token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar expiração
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      console.error('❌ [add-client-expectation] Token expired');
      return new Response(
        JSON.stringify({ error: 'Token expirado', expired: true }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { project_id, company_id } = decoded;

    console.log('🔍 [add-client-expectation] Project ID:', project_id);
    console.log('🏢 [add-client-expectation] Company ID:', company_id);

    // Verificar se já existe expectativa com mesmo título (case-insensitive)
    const { data: existingExpectation } = await supabaseAdmin
      .from('gp_project_expectations')
      .select('id')
      .eq('project_id', project_id)
      .ilike('title', title.trim())
      .single();

    if (existingExpectation) {
      return new Response(
        JSON.stringify({ error: 'Já existe uma expectativa com este título' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar posição máxima atual
    const { data: maxPositionData } = await supabaseAdmin
      .from('gp_project_expectations')
      .select('position')
      .eq('project_id', project_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (maxPositionData?.position ?? -1) + 1;

    console.log('📍 [add-client-expectation] Next position:', nextPosition);

    // Inserir nova expectativa
    const { data: newExpectation, error: insertError } = await supabaseAdmin
      .from('gp_project_expectations')
      .insert({
        company_id,
        project_id,
        title: title.trim(),
        description: description?.trim() || null,
        is_done: false,
        position: nextPosition,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [add-client-expectation] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao adicionar expectativa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [add-client-expectation] Expectation added successfully');

    return new Response(
      JSON.stringify({
        success: true,
        expectation: newExpectation,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 [add-client-expectation] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
