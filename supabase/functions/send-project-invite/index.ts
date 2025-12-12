import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProjectInviteData {
  projectId: string
  projectTitle: string
  clientName: string
  clientEmail: string
  inviteLink: string
  expiresAt: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const inviteData: ProjectInviteData = await req.json()

    // Validar dados recebidos
    if (!inviteData.clientEmail || !inviteData.clientEmail.includes('@')) {
      throw new Error('E-mail de destino inválido')
    }

    if (!inviteData.projectId || !inviteData.inviteLink) {
      throw new Error('Dados do projeto incompletos')
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar detalhes do projeto
    const { data: project, error: projectError } = await supabase
      .from('gp_projects')
      .select(`
        *,
        gp_clients (
          name,
          email
        )
      `)
      .eq('id', inviteData.projectId)
      .single()

    if (projectError || !project) {
      throw new Error('Projeto não encontrado')
    }

    // Buscar configuração SMTP
    const { data: emailConfig, error: configError } = await supabase
      .from('configuracoes_integracoes')
      .select('configuracoes')
      .eq('nome', 'email')
      .eq('ativo', true)
      .single()

    if (configError || !emailConfig) {
      throw new Error('Configuração de e-mail não encontrada')
    }

    const smtpConfig = emailConfig.configuracoes

    // Calcular dias até expiração
    const expiresDate = new Date(inviteData.expiresAt)
    const now = new Date()
    const daysUntilExpiration = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Mapear status para português com emojis
    const statusMap: Record<string, string> = {
      'onboarding': '🎯 Onboarding',
      'strategy': '📋 Estratégia',
      'development': '⚙️ Desenvolvimento',
      'testing': '🧪 Testes',
      'delivery': '📦 Entrega',
      'monitoring': '📊 Monitoramento'
    }

    // Cores por status
    const statusColors: Record<string, string> = {
      'onboarding': '#667eea',
      'strategy': '#f59e0b',
      'development': '#10b981',
      'testing': '#f59e0b',
      'delivery': '#8b5cf6',
      'monitoring': '#06b6d4'
    }

    const projectStatus = project.status || 'onboarding'
    const statusText = statusMap[projectStatus] || '🎯 Em Andamento'
    const statusColor = statusColors[projectStatus] || '#667eea'

    // Garantir progresso válido (0-100)
    const progress = Math.max(0, Math.min(100, project.progress ?? 0))

    // Gerar e-mail HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
          }
          .header-title {
            color: white;
            font-size: 24px;
            margin: 20px 0 10px 0;
          }
          .header-subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .project-card {
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-left: 5px solid #667eea;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .project-title {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 15px;
          }
          .project-info {
            display: table;
            width: 100%;
          }
          .info-row {
            display: table-row;
          }
          .info-label {
            display: table-cell;
            padding: 8px 0;
            font-weight: 700;
            color: #374151;
            width: 120px;
          }
          .info-value {
            display: table-cell;
            padding: 8px 0;
            color: #1f2937;
            font-weight: 500;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            color: white;
            font-size: 14px;
            font-weight: 700;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          .progress-bar {
            width: 100%;
            height: 10px;
            background-color: #e5e7eb;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            transition: width 0.3s ease;
          }
          .instructions {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .instructions-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
          }
          .instructions ol {
            margin: 0;
            padding-left: 20px;
            color: #555;
          }
          .instructions li {
            margin: 10px 0;
            line-height: 1.5;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          .cta-button:hover {
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }
          .warning-box {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .warning-box p {
            margin: 5px 0;
            color: #78350f;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.5;
          }
          .features {
            background-color: #e7f3ff;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .features-title {
            font-size: 16px;
            font-weight: 600;
            color: #0066cc;
            margin-bottom: 15px;
          }
          .features ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .features li {
            padding: 8px 0;
            color: #333;
          }
          .features li:before {
            content: "✓ ";
            color: #0066cc;
            font-weight: bold;
            margin-right: 10px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .footer-text {
            color: #495057;
            font-size: 14px;
            font-weight: 500;
            margin: 5px 0;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">💼 NEXUS</div>
            <h1 class="header-title">🎉 Você foi convidado!</h1>
            <p class="header-subtitle">Acompanhe o progresso do seu projeto em tempo real</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p class="greeting">Olá, <strong>${inviteData.clientName}</strong>!</p>

            <p class="message">
              Você foi convidado pelo <strong>Grupo Nexus Mind</strong> para acompanhar o progresso do projeto:
            </p>

            <!-- Project Card -->
            <div class="project-card">
              <div class="project-title">📋 ${inviteData.projectTitle}</div>

              <div class="project-info">
                <div class="info-row">
                  <div class="info-label">Status:</div>
                  <div class="info-value">
                    <span class="status-badge" style="background-color: ${statusColor};">${statusText}</span>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">Progresso:</div>
                  <div class="info-value">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="progress-bar" style="flex: 1;">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                      </div>
                      <span style="font-weight: 700; color: #1f2937;">${progress}%</span>
                    </div>
                  </div>
                </div>
                ${project.deadline ? `
                <div class="info-row">
                  <div class="info-label">Prazo:</div>
                  <div class="info-value">${new Date(project.deadline).toLocaleDateString('pt-BR')}</div>
                </div>
                ` : ''}
                ${project.gp_clients ? `
                <div class="info-row">
                  <div class="info-label">Cliente:</div>
                  <div class="info-value">${project.gp_clients.name}</div>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Instructions -->
            <div class="instructions">
              <div class="instructions-title">🔐 Como acessar:</div>
              <ol>
                <li>Clique no botão "Acessar Projeto" abaixo</li>
                <li>Quando solicitado, informe seu e-mail: <strong>${inviteData.clientEmail}</strong></li>
                <li>Pronto! Você terá acesso completo para acompanhar o projeto</li>
              </ol>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${inviteData.inviteLink}" class="cta-button">
                📊 Acessar Projeto
              </a>
            </div>

            <!-- Warning -->
            <div class="warning-box">
              <p><strong>⏱️ Este convite expira em ${daysUntilExpiration} dias</strong></p>
              <p>Após esse período, você precisará solicitar um novo convite para acessar o projeto.</p>
            </div>

            <!-- Features -->
            <div class="features">
              <div class="features-title">ℹ️ O que você pode fazer:</div>
              <ul>
                <li>Ver progresso do projeto em tempo real</li>
                <li>Acompanhar tarefas e entregas</li>
                <li>Visualizar documentos compartilhados</li>
                <li>Adicionar comentários e feedback</li>
                <li>Receber atualizações importantes</li>
              </ul>
            </div>

            <p class="message" style="margin-top: 30px; font-size: 14px; color: #6c757d;">
              Se você tiver qualquer dúvida, não hesite em entrar em contato conosco!
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">💼 NEXUS</div>
            <p class="footer-text">Sistema de Gestão de Projetos</p>
            <p class="footer-text">
              <a href="https://gruponexusmind.com.br" class="footer-link">gruponexusmind.com.br</a>
            </p>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
              Este é um e-mail automático. Por favor, não responda diretamente.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log('Enviando convite de projeto para:', inviteData.clientEmail)

    // Enviar e-mail via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smtpConfig.password}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${smtpConfig.from_name || 'Nexus'} <${smtpConfig.from_email}>`,
        to: inviteData.clientEmail,
        subject: `🎉 Convite: Acompanhe o projeto "${inviteData.projectTitle}"`,
        html: emailHTML
      })
    })

    const resendResult = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Erro do Resend:', resendResult)
      throw new Error(resendResult.message || 'Erro ao enviar e-mail via Resend')
    }

    console.log('Convite enviado com sucesso! ID:', resendResult.id)

    return new Response(JSON.stringify({
      success: true,
      message: 'Convite enviado com sucesso!',
      emailId: resendResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Erro ao enviar convite:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido ao enviar convite'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
