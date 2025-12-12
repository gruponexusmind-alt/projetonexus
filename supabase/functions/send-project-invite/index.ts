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

    console.log('=== BUSCANDO DADOS DO PROJETO ===')
    console.log('Project ID:', inviteData.projectId)
    console.log('Project Title:', inviteData.projectTitle)

    // Buscar etapa atual do projeto (mesma lógica do dashboard)
    let { data: currentStage, error: stageError } = await supabase
      .from('gp_project_stages')
      .select('*')
      .eq('project_id', inviteData.projectId)
      .eq('is_current', true)
      .single()

    console.log('Current Stage (is_current=true):', JSON.stringify(currentStage, null, 2))
    console.log('Stage Error:', stageError)

    // Fallback: Se não encontrar stage com is_current, buscar a última stage ativa
    if (!currentStage) {
      console.log('⚠️ Nenhuma stage com is_current=true. Buscando fallback...')

      const { data: allStages } = await supabase
        .from('gp_project_stages')
        .select('*')
        .eq('project_id', inviteData.projectId)
        .order('order_index', { ascending: true })

      console.log('All Stages:', JSON.stringify(allStages, null, 2))

      // Encontrar última stage concluída ou primeira ativa
      currentStage = allStages?.find((s: any) => s.status === 'active' || s.status === 'current') ||
                     allStages?.filter((s: any) => s.status === 'completed').pop() ||
                     allStages?.[allStages.length - 1]

      console.log('Fallback Stage Selected:', JSON.stringify(currentStage, null, 2))
    }

    // Buscar estatísticas de tarefas (progresso real calculado)
    let { data: taskStats, error: taskStatsError } = await supabase
      .from('v_project_task_stats')
      .select('*')
      .eq('project_id', inviteData.projectId)
      .single()

    console.log('Task Stats (from view):', JSON.stringify(taskStats, null, 2))
    console.log('Task Stats Error:', taskStatsError)

    // Fallback: Se view não retornar dados, calcular manualmente
    if (!taskStats) {
      console.log('⚠️ v_project_task_stats retornou null. Calculando manualmente...')

      const { data: tasks } = await supabase
        .from('gp_tasks')
        .select('status, progress')
        .eq('project_id', inviteData.projectId)
        .eq('blocked', false)

      const total = tasks?.length ?? 0
      const avgProgress = total > 0
        ? Math.round(tasks.reduce((sum: number, t: any) => sum + (t.progress ?? 0), 0) / total)
        : 0

      taskStats = {
        project_id: inviteData.projectId,
        total: total,
        pending: tasks?.filter((t: any) => t.status === 'pending').length ?? 0,
        in_progress: tasks?.filter((t: any) => t.status === 'in_progress').length ?? 0,
        review: tasks?.filter((t: any) => t.status === 'review').length ?? 0,
        completed: tasks?.filter((t: any) => t.status === 'completed').length ?? 0,
        progress_score: avgProgress
      }

      console.log('Fallback Task Stats Calculated:', JSON.stringify(taskStats, null, 2))
    }

    // Buscar estatísticas de tempo (horas trabalhadas)
    const { data: timeStats, error: timeStatsError } = await supabase
      .from('v_project_time_stats')
      .select('*')
      .eq('project_id', inviteData.projectId)
      .single()

    console.log('Time Stats (from view):', JSON.stringify(timeStats, null, 2))
    console.log('Time Stats Error:', timeStatsError)

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

    // Usar etapa atual ao invés de status fixo
    const stageText = currentStage?.name || project.status || 'Em Andamento'
    const stageColor = currentStage?.color || '#3b82f6' // Azul padrão

    // Mapear prioridade para português
    const priorityMap: Record<string, string> = {
      'high': '🔴 Alta',
      'medium': '🟡 Média',
      'low': '🟢 Baixa'
    }

    // Cores por prioridade
    const priorityColors: Record<string, string> = {
      'high': '#ef4444',   // Vermelho
      'medium': '#f59e0b', // Laranja
      'low': '#10b981'     // Verde
    }

    const priorityText = priorityMap[project.priority] || ''
    const priorityColor = priorityColors[project.priority] || '#f59e0b'

    // Usar progresso real calculado pela view (mesma lógica do dashboard)
    const progress = taskStats?.progress_score ?? 0

    // Total de tarefas e horas trabalhadas
    const totalTasks = taskStats?.total ?? 0
    const horasTrabalhadas = timeStats?.hours_worked ?? 0

    // Complexidade em estrelas
    const complexityStars = project.complexity
      ? '★'.repeat(project.complexity) + '☆'.repeat(5 - project.complexity)
      : ''

    console.log('=== DADOS FINAIS PARA O E-MAIL ===')
    console.log('Stage Text:', stageText)
    console.log('Stage Color:', stageColor)
    console.log('Priority Text:', priorityText)
    console.log('Priority Color:', priorityColor)
    console.log('Progress:', progress)
    console.log('Total Tasks:', totalTasks)
    console.log('Horas Trabalhadas:', horasTrabalhadas)
    console.log('Complexity Stars:', complexityStars)
    console.log('Deadline:', project.deadline)
    console.log('Client Name:', project.gp_clients?.name)

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
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div class="project-title">📋 ${inviteData.projectTitle}</div>
                ${priorityText ? `
                  <span class="status-badge" style="background-color: ${priorityColor}; font-size: 13px;">
                    ${priorityText}
                  </span>
                ` : ''}
              </div>

              <div class="project-info">
                <div class="info-row">
                  <div class="info-label">Etapa Atual:</div>
                  <div class="info-value">
                    <span class="status-badge" style="background-color: ${stageColor};">
                      📍 ${stageText}
                    </span>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">Progresso:</div>
                  <div class="info-value">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="progress-bar" style="flex: 1;">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                      </div>
                      <span style="font-weight: 700; color: #1f2937; font-size: 16px;">${progress}%</span>
                    </div>
                  </div>
                </div>
                ${project.deadline ? `
                <div class="info-row">
                  <div class="info-label">Prazo:</div>
                  <div class="info-value" style="font-weight: 600;">${new Date(project.deadline).toLocaleDateString('pt-BR')}</div>
                </div>
                ` : ''}
                ${project.gp_clients ? `
                <div class="info-row">
                  <div class="info-label">Cliente:</div>
                  <div class="info-value" style="font-weight: 600;">${project.gp_clients.name}</div>
                </div>
                ` : ''}
                ${complexityStars ? `
                <div class="info-row">
                  <div class="info-label">Complexidade:</div>
                  <div class="info-value" style="color: #f59e0b; font-size: 18px; letter-spacing: 2px;">
                    ${complexityStars}
                  </div>
                </div>
                ` : ''}
                ${totalTasks > 0 ? `
                <div class="info-row">
                  <div class="info-label">Total de Tarefas:</div>
                  <div class="info-value" style="font-weight: 700; color: #1f2937;">
                    ${totalTasks}
                  </div>
                </div>
                ` : ''}
                ${horasTrabalhadas > 0 ? `
                <div class="info-row">
                  <div class="info-label">Horas Trabalhadas:</div>
                  <div class="info-value" style="font-weight: 700; color: #6366f1;">
                    ${horasTrabalhadas.toFixed(1)}h
                  </div>
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

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao enviar convite'

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
