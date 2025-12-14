import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateUniqueFileName, validateFiles } from '@/utils/fileValidation';

export interface TaskAttachment {
  id: string;
  task_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  url?: string; // URL pública temporária para exibição
}

interface UseTaskAttachmentsProps {
  taskId?: string;
  companyId: string;
}

export function useTaskAttachments({ taskId, companyId }: UseTaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Carregar anexos existentes
  const loadAttachments = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gp_task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar URLs públicas para cada anexo
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (attachment) => {
          const { data: urlData } = await supabase.storage
            .from('task-attachments')
            .createSignedUrl(attachment.file_path, 3600); // URL válida por 1 hora

          return {
            ...attachment,
            url: urlData?.signedUrl,
          };
        })
      );

      setAttachments(attachmentsWithUrls);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os anexos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  // Carregar anexos quando o taskId mudar
  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  // Upload de arquivos
  const uploadFiles = useCallback(
    async (files: File[]): Promise<TaskAttachment[]> => {
      if (!taskId) {
        throw new Error('Task ID é obrigatório para upload');
      }

      // Validar arquivos
      const validation = validateFiles(files);

      // Notificar sobre arquivos inválidos
      validation.invalid.forEach(({ file, reason }) => {
        toast({
          title: 'Arquivo rejeitado',
          description: `${file.name}: ${reason}`,
          variant: 'destructive',
        });
      });

      if (validation.valid.length === 0) {
        return [];
      }

      setUploading(true);
      const uploadedAttachments: TaskAttachment[] = [];

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');

        for (const file of validation.valid) {
          const uniqueFileName = generateUniqueFileName(file.name);
          const filePath = `${companyId}/${taskId}/${uniqueFileName}`;

          // Upload para o storage
          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Criar registro no banco de dados
          const { data: attachmentData, error: dbError } = await supabase
            .from('gp_task_attachments')
            .insert({
              task_id: taskId,
              company_id: companyId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: userData.user.id,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          // Obter URL pública
          const { data: urlData } = await supabase.storage
            .from('task-attachments')
            .createSignedUrl(filePath, 3600);

          uploadedAttachments.push({
            ...attachmentData,
            url: urlData?.signedUrl,
          });
        }

        // Atualizar lista de anexos
        setAttachments((prev) => [...prev, ...uploadedAttachments]);

        toast({
          title: 'Sucesso',
          description: `${uploadedAttachments.length} arquivo(s) anexado(s)!`,
        });

        return uploadedAttachments;
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast({
          title: 'Erro no upload',
          description: 'Não foi possível anexar os arquivos.',
          variant: 'destructive',
        });
        return [];
      } finally {
        setUploading(false);
      }
    },
    [taskId, companyId, toast]
  );

  // Deletar anexo
  const deleteAttachment = useCallback(
    async (attachmentId: string, filePath: string) => {
      try {
        // Deletar do storage
        const { error: storageError } = await supabase.storage
          .from('task-attachments')
          .remove([filePath]);

        if (storageError) throw storageError;

        // Deletar do banco de dados
        const { error: dbError } = await supabase
          .from('gp_task_attachments')
          .delete()
          .eq('id', attachmentId);

        if (dbError) throw dbError;

        // Atualizar lista de anexos
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));

        toast({
          title: 'Sucesso',
          description: 'Anexo removido com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao deletar anexo:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível remover o anexo.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Download de anexo
  const downloadAttachment = useCallback(
    async (filePath: string, fileName: string) => {
      try {
        const { data, error } = await supabase.storage
          .from('task-attachments')
          .download(filePath);

        if (error) throw error;

        // Criar link de download
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erro ao baixar anexo:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível baixar o anexo.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return {
    attachments,
    loading,
    uploading,
    uploadFiles,
    deleteAttachment,
    downloadAttachment,
    reloadAttachments: loadAttachments,
  };
}
