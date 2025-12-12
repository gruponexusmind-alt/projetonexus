import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to } = await req.json()

    if (!to || !to.includes('@')) {
      throw new Error('E-mail de destino inválido')
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar configuração SMTP do banco
    const { data: config, error: configError } = await supabase
      .from('configuracoes_integracoes')
      .select('configuracoes')
      .eq('nome', 'email')
      .eq('ativo', true)
      .single()

    if (configError || !config) {
      throw new Error('Configuração de e-mail não encontrada ou inativa')
    }

    const emailConfig = config.configuracoes

    // Validar configuração
    if (!emailConfig.password || !emailConfig.from_email) {
      throw new Error('Configuração SMTP incompleta')
    }

    console.log('Enviando e-mail de teste para:', to)
    console.log('De:', emailConfig.from_email)

    // Enviar e-mail via API do Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailConfig.password}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${emailConfig.from_name || 'Nexus'} <${emailConfig.from_email}>`,
        to: to,
        subject: '✅ Teste de Integração - Nexus',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-icon { font-size: 48px; margin-bottom: 10px; }
              .config-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .config-box h3 { margin-top: 0; color: #667eea; }
              .config-box ul { list-style: none; padding: 0; }
              .config-box li { padding: 5px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">🎉</div>
                <h1 style="margin: 0;">Teste de Integração Bem-Sucedido!</h1>
              </div>
              <div class="content">
                <p>Parabéns! Este é um e-mail de teste enviado pelo <strong>Sistema Nexus</strong>.</p>
                <p>Se você está recebendo este e-mail, significa que a integração SMTP com o Resend está funcionando perfeitamente! ✨</p>

                <div class="config-box">
                  <h3>📋 Detalhes da Configuração</h3>
                  <ul>
                    <li><strong>Provedor:</strong> Resend</li>
                    <li><strong>Host:</strong> ${emailConfig.host}</li>
                    <li><strong>Porta:</strong> ${emailConfig.port}</li>
                    <li><strong>Remetente:</strong> ${emailConfig.from_email}</li>
                    <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</li>
                  </ul>
                </div>

                <p>Agora você pode usar esta integração para enviar notificações, relatórios e outros e-mails automáticos do sistema! 🚀</p>

                <div class="footer">
                  <p>Enviado automaticamente pelo <strong>Nexus - Sistema de Gestão de Projetos</strong></p>
                  <p>gruponexusmind.com.br</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Erro do Resend:', resendResult)
      throw new Error(resendResult.message || 'Erro ao enviar e-mail via Resend')
    }

    console.log('E-mail enviado com sucesso! ID:', resendResult.id)

    return new Response(JSON.stringify({
      success: true,
      message: 'E-mail de teste enviado com sucesso!',
      emailId: resendResult.id,
      to: to
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido ao enviar e-mail'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
