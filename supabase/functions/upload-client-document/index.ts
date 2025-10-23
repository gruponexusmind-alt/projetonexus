import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📤 [upload-client-document] Request received');

    const formData = await req.formData();
    const token = formData.get('token') as string;
    const email = formData.get('email') as string;
    const file = formData.get('file') as File;

    console.log('🔑 [upload-client-document] Token:', token ? 'present' : 'missing');
    console.log('📧 [upload-client-document] Email:', email ? 'present' : 'missing');
    console.log('📄 [upload-client-document] File:', file ? file.name : 'missing');

    // Validações básicas
    if (!token || !email || !file) {
      return new Response(
        JSON.stringify({ error: 'Token, email e arquivo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande. Tamanho máximo: 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tipo do arquivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: 'Tipo de arquivo não permitido. Tipos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF',
          receivedType: file.type
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ [upload-client-document] Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Decodificar e validar token
    let decoded;
    try {
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      decoded = JSON.parse(atob(padded));
      console.log('📦 [upload-client-document] Token decoded successfully');
    } catch (e) {
      console.error('❌ [upload-client-document] Token decode error:', e);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar expiração
    if (decoded.exp && decoded.exp < Date.now()) {
      return new Response(
        JSON.stringify({ error: 'Link expirado', expired: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar email
    if (decoded.email.toLowerCase() !== email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email não corresponde ao convite' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const projectId = decoded.project_id;
    console.log('📁 [upload-client-document] Project ID:', projectId);

    // Verificar se o projeto existe
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('gp_projects')
      .select('id, company_id')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      return new Response(
        JSON.stringify({ error: 'Projeto não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${projectData.company_id}/${projectId}/client-uploads/${timestamp}-${sanitizedFileName}`;

    console.log('☁️ [upload-client-document] Uploading to storage:', storagePath);

    // Upload para Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('project-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [upload-client-document] Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload do arquivo', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [upload-client-document] File uploaded successfully');

    // Registrar no banco de dados
    const { data: docData, error: docError } = await supabaseAdmin
      .from('gp_project_documents')
      .insert({
        company_id: projectData.company_id,
        project_id: projectId,
        name: file.name,
        storage_path: storagePath,
        size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: null, // Cliente não tem user_id
        is_from_client: true,
        uploaded_by_client_email: email,
        client_upload_token: token.substring(0, 20) + '...', // Parcial para auditoria
        is_client_visible: false, // Documento do cliente não fica visível para ele mesmo
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ [upload-client-document] Database insert error:', docError);
      // Tentar remover arquivo do storage
      await supabaseAdmin.storage.from('project-documents').remove([storagePath]);
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar documento', details: docError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [upload-client-document] Document registered in database');
    console.log('📄 [upload-client-document] Document ID:', docData.id);

    return new Response(
      JSON.stringify({
        success: true,
        document: {
          id: docData.id,
          name: docData.name,
          size: docData.size_bytes,
          uploadedAt: docData.created_at,
        },
        message: 'Arquivo enviado com sucesso! A equipe será notificada.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [upload-client-document] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar upload' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
