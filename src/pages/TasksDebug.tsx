import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function TasksDebug() {
  const { profile, loading: authLoading, user } = useAuth();
  const [tests, setTests] = useState({
    profileLoaded: false,
    hasCompanyId: false,
    tasksWithoutFilter: null as any,
    tasksWithCompanyId: null as any,
    projectsCount: null as any,
    rlsTest: null as any,
  });
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    console.log('🔬 [DEBUG] Iniciando diagnóstico completo...');
    setLoading(true);

    const results = {
      profileLoaded: !!profile,
      hasCompanyId: !!profile?.company_id,
      tasksWithoutFilter: null as any,
      tasksWithCompanyId: null as any,
      projectsCount: null as any,
      rlsTest: null as any,
    };

    // Teste 1: Buscar TODAS as tasks (sem filtro)
    console.log('📊 [DEBUG] Teste 1: Buscando todas as tasks sem filtro...');
    try {
      const { data, error, count } = await supabase
        .from('gp_tasks')
        .select('*', { count: 'exact' });

      results.tasksWithoutFilter = {
        success: !error,
        count: count || data?.length || 0,
        data: data?.slice(0, 3), // primeiras 3 tasks
        error: error?.message,
      };
      console.log('✅ [DEBUG] Resultado:', results.tasksWithoutFilter);
    } catch (err: any) {
      results.tasksWithoutFilter = {
        success: false,
        error: err.message,
      };
      console.error('❌ [DEBUG] Erro:', err);
    }

    // Teste 2: Buscar tasks com company_id
    if (profile?.company_id) {
      console.log('📊 [DEBUG] Teste 2: Buscando tasks com company_id =', profile.company_id);
      try {
        const { data, error, count } = await supabase
          .from('gp_tasks')
          .select('*, project:gp_projects(id, title)', { count: 'exact' })
          .eq('company_id', profile.company_id);

        results.tasksWithCompanyId = {
          success: !error,
          count: count || data?.length || 0,
          data: data?.slice(0, 3),
          error: error?.message,
        };
        console.log('✅ [DEBUG] Resultado:', results.tasksWithCompanyId);
      } catch (err: any) {
        results.tasksWithCompanyId = {
          success: false,
          error: err.message,
        };
        console.error('❌ [DEBUG] Erro:', err);
      }
    }

    // Teste 3: Contar projetos
    if (profile?.company_id) {
      console.log('📊 [DEBUG] Teste 3: Contando projetos...');
      try {
        const { count, error } = await supabase
          .from('gp_projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        results.projectsCount = {
          success: !error,
          count: count || 0,
          error: error?.message,
        };
        console.log('✅ [DEBUG] Resultado:', results.projectsCount);
      } catch (err: any) {
        results.projectsCount = {
          success: false,
          error: err.message,
        };
        console.error('❌ [DEBUG] Erro:', err);
      }
    }

    // Teste 4: Verificar RLS
    console.log('📊 [DEBUG] Teste 4: Verificando RLS...');
    try {
      const { data, error } = await supabase
        .from('gp_tasks')
        .select('id')
        .limit(1);

      results.rlsTest = {
        success: !error,
        hasAccess: !error && data !== null,
        error: error?.message,
      };
      console.log('✅ [DEBUG] Resultado RLS:', results.rlsTest);
    } catch (err: any) {
      results.rlsTest = {
        success: false,
        error: err.message,
      };
      console.error('❌ [DEBUG] Erro RLS:', err);
    }

    setTests(results);
    setLoading(false);
    console.log('🔬 [DEBUG] Diagnóstico completo:', results);
  };

  useEffect(() => {
    if (!authLoading && profile) {
      runDiagnostics();
    }
  }, [authLoading, profile]);

  const StatusIcon = ({ success }: { success: boolean | null }) => {
    if (success === null) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando autenticação...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="🔬 Diagnóstico de Tasks"
        description="Análise completa do sistema de tarefas"
      >
        <Button onClick={runDiagnostics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Executar Diagnóstico
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={tests.profileLoaded} />
              1. Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify({ user, profile }, null, 2)}
            </pre>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <StatusIcon success={tests.hasCompanyId} />
                <span>Company ID: {profile?.company_id || 'NULL ⚠️'}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={!!profile?.role} />
                <span>Role: {profile?.role || 'NULL'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RLS Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={tests.rlsTest?.success} />
              2. Acesso ao Banco (RLS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tests.rlsTest && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusIcon success={tests.rlsTest.hasAccess} />
                  <span>Acesso permitido: {tests.rlsTest.hasAccess ? 'SIM' : 'NÃO'}</span>
                </div>
                {tests.rlsTest.error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                    <strong>Erro:</strong> {tests.rlsTest.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks sem filtro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={tests.tasksWithoutFilter?.success} />
              3. Tasks (SEM filtro de company_id)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tests.tasksWithoutFilter && (
              <div className="space-y-4">
                <div className="text-2xl font-bold">
                  Total: {tests.tasksWithoutFilter.count} tasks
                </div>
                {tests.tasksWithoutFilter.error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                    <strong>Erro:</strong> {tests.tasksWithoutFilter.error}
                  </div>
                )}
                {tests.tasksWithoutFilter.data && (
                  <div>
                    <p className="font-semibold mb-2">Primeiras 3 tasks:</p>
                    <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(tests.tasksWithoutFilter.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks com company_id */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={tests.tasksWithCompanyId?.success} />
              4. Tasks (COM filtro company_id)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tests.tasksWithCompanyId ? (
              <div className="space-y-4">
                <div className="text-2xl font-bold">
                  Total: {tests.tasksWithCompanyId.count} tasks
                </div>
                {tests.tasksWithCompanyId.error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                    <strong>Erro:</strong> {tests.tasksWithCompanyId.error}
                  </div>
                )}
                {tests.tasksWithCompanyId.data && (
                  <div>
                    <p className="font-semibold mb-2">Primeiras 3 tasks:</p>
                    <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(tests.tasksWithCompanyId.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">
                Não executado (sem company_id no profile)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon success={tests.projectsCount?.success} />
              5. Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tests.projectsCount ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  Total: {tests.projectsCount.count} projetos
                </div>
                {tests.projectsCount.error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                    <strong>Erro:</strong> {tests.projectsCount.error}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">
                Não executado (sem company_id no profile)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnóstico Final */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>📋 Diagnóstico Final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile?.company_id && (
              <div className="bg-destructive/10 text-destructive p-4 rounded">
                <strong>❌ PROBLEMA CRÍTICO:</strong> Usuário não tem company_id!
                <p className="mt-2 text-sm">
                  Verifique a tabela <code>profiles</code> no Supabase e certifique-se que o usuário tem um <code>company_id</code> válido.
                </p>
              </div>
            )}

            {tests.tasksWithoutFilter?.count === 0 && (
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded">
                <strong>⚠️ AVISO:</strong> Não há tarefas no banco de dados!
                <p className="mt-2 text-sm">
                  Crie pelo menos uma tarefa em um projeto para testar a funcionalidade.
                </p>
              </div>
            )}

            {tests.tasksWithoutFilter?.count > 0 && tests.tasksWithCompanyId?.count === 0 && (
              <div className="bg-destructive/10 text-destructive p-4 rounded">
                <strong>❌ PROBLEMA:</strong> Existem {tests.tasksWithoutFilter.count} tasks no banco, mas nenhuma com seu company_id!
                <p className="mt-2 text-sm">
                  Execute este SQL no Supabase Dashboard:
                </p>
                <pre className="bg-black text-white p-2 rounded mt-2 text-xs overflow-auto">
{`UPDATE public.gp_tasks
SET company_id = (
  SELECT p.company_id
  FROM public.gp_projects p
  WHERE p.id = gp_tasks.project_id
)
WHERE company_id IS NULL;`}
                </pre>
              </div>
            )}

            {tests.tasksWithCompanyId?.count > 0 && (
              <div className="bg-green-50 text-green-800 p-4 rounded">
                <strong>✅ SUCESSO:</strong> Encontradas {tests.tasksWithCompanyId.count} tasks com seu company_id!
                <p className="mt-2 text-sm">
                  A página /tasks deve funcionar normalmente. Se ainda estiver em branco, verifique o console do navegador (F12).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
