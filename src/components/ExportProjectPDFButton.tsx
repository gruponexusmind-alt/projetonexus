import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateProjectPDF, ProjectExportData } from '@/utils/pdfExport';

interface ExportProjectPDFButtonProps {
  projectId: string;
  companyId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportProjectPDFButton({
  projectId,
  companyId,
  variant = 'outline',
  size = 'default',
}: ExportProjectPDFButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all project data
      const [projectRes, tasksRes, stagesRes, expectationsRes, statsRes, meetingsRes, documentsRes] = await Promise.all([
        // Project details with client
        supabase
          .from('gp_projects')
          .select(`
            *,
            client:gp_clients(name, email, phone)
          `)
          .eq('id', projectId)
          .single(),

        // Tasks with assignee and stage
        supabase
          .from('gp_tasks')
          .select(`
            title,
            status,
            priority,
            progress,
            due_date,
            assigned_to,
            assignee:profiles(nome),
            stage:gp_project_stages(name)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),

        // Stages
        supabase
          .from('gp_project_stages')
          .select('*')
          .eq('project_id', projectId)
          .order('order_index'),

        // Expectations
        supabase
          .from('gp_project_expectations')
          .select('*')
          .eq('project_id', projectId)
          .order('position'),

        // Task statistics
        supabase
          .from('v_project_task_stats')
          .select('*')
          .eq('project_id', projectId)
          .single(),

        // Meetings
        supabase
          .from('gp_meetings')
          .select('title, meeting_date, notes')
          .eq('project_id', projectId)
          .order('meeting_date', { ascending: false })
          .limit(20),

        // Documents
        supabase
          .from('gp_documents')
          .select('title, file_type, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (projectRes.error) throw projectRes.error;
      if (!projectRes.data) throw new Error('Projeto não encontrado');

      // Calculate task stats manually if view fails
      let taskStats = statsRes.data;
      if (statsRes.error || !statsRes.data) {
        console.warn('Task stats view failed, calculating manually:', statsRes.error);
        const tasks = tasksRes.data || [];
        taskStats = {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          review: tasks.filter(t => t.status === 'review').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          progress_score: tasks.length > 0
            ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
            : 0,
        };
      }

      // Calculate project progress based on completed tasks
      const totalTasks = taskStats?.total || 0;
      const completedTasks = taskStats?.completed || 0;
      const projectProgress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      // Prepare data for PDF
      const exportData: ProjectExportData = {
        project: {
          ...projectRes.data,
          progress: projectProgress,
          client: projectRes.data.client || {
            name: 'Cliente não informado',
            email: 'Não informado',
            phone: undefined,
          },
        },
        tasks: tasksRes.data || [],
        stages: stagesRes.data || [],
        expectations: expectationsRes.data || [],
        taskStats: taskStats || {
          total: 0,
          pending: 0,
          in_progress: 0,
          review: 0,
          completed: 0,
        },
        meetings: meetingsRes.data || [],
        documents: documentsRes.data || [],
      };

      // Generate PDF
      await generateProjectPDF(exportData);

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O relatório do projeto foi baixado.',
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório do projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}
