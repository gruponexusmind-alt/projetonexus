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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectDeleteDialogProps {
  projectId: string;
  projectTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProjectDeleteDialog({ 
  projectId, 
  projectTitle, 
  open, 
  onOpenChange, 
  onSuccess 
}: ProjectDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'deletar') {
      toast({
        title: 'Erro',
        description: 'Digite "deletar" para confirmar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Soft delete - just change status
      const { error } = await supabase
        .from('gp_projects')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Projeto excluído com sucesso.',
      });

      onOpenChange(false);
      setConfirmText('');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o projeto.',
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
          <AlertDialogTitle className="text-destructive">
            Excluir Projeto
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta ação irá excluir permanentemente o projeto "{projectTitle}" 
              e todos os dados relacionados (tarefas, documentos, etc.).
            </p>
            <p className="font-semibold text-destructive">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-text">
            Digite <span className="font-mono font-bold">deletar</span> para confirmar:
          </Label>
          <Input
            id="confirm-text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="deletar"
            className="font-mono"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={loading}
            onClick={() => setConfirmText('')}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={loading || confirmText.toLowerCase() !== 'deletar'}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Excluindo...' : 'Excluir Projeto'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}