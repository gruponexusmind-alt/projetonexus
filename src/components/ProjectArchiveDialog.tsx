import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectArchiveDialogProps {
  projectId: string;
  projectTitle: string;
  isArchived: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProjectArchiveDialog({ 
  projectId, 
  projectTitle, 
  isArchived,
  open, 
  onOpenChange, 
  onSuccess 
}: ProjectArchiveDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleArchiveToggle = async () => {
    setLoading(true);
    try {
      const newStatus = isArchived ? 'onboarding' : 'archived';
      
      const { error } = await supabase
        .from('gp_projects')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Projeto ${isArchived ? 'desarquivado' : 'arquivado'} com sucesso.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao arquivar/desarquivar projeto:', error);
      toast({
        title: 'Erro',
        description: `Não foi possível ${isArchived ? 'desarquivar' : 'arquivar'} o projeto.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived ? 'Desarquivar' : 'Arquivar'} Projeto
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived 
              ? `Tem certeza que deseja desarquivar o projeto "${projectTitle}"? Ele voltará a aparecer na listagem principal.`
              : `Tem certeza que deseja arquivar o projeto "${projectTitle}"? Ele será removido da listagem principal mas pode ser recuperado.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchiveToggle} disabled={loading}>
            {loading 
              ? (isArchived ? 'Desarquivando...' : 'Arquivando...') 
              : (isArchived ? 'Desarquivar' : 'Arquivar')
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}