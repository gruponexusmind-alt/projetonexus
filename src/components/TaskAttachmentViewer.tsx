import { useState } from 'react';
import { Paperclip, Download, Trash2, X, Loader2, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/utils/fileValidation';
import { TaskAttachment } from '@/hooks/useTaskAttachments';

interface TaskAttachmentViewerProps {
  attachments: TaskAttachment[];
  loading?: boolean;
  onDelete?: (attachmentId: string, filePath: string) => Promise<void>;
  onDownload?: (filePath: string, fileName: string) => Promise<void>;
  showActions?: boolean;
}

export function TaskAttachmentViewer({
  attachments,
  loading = false,
  onDelete,
  onDownload,
  showActions = true,
}: TaskAttachmentViewerProps) {
  const [selectedImage, setSelectedImage] = useState<TaskAttachment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TaskAttachment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Handler para deletar
  const handleDelete = async () => {
    if (!deleteConfirm || !onDelete) return;

    setDeleting(true);
    try {
      await onDelete(deleteConfirm.id, deleteConfirm.file_path);
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  // Handler para download
  const handleDownload = async (attachment: TaskAttachment) => {
    if (!onDownload) return;
    await onDownload(attachment.file_path, attachment.file_name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum anexo ainda</p>
        <p className="text-xs mt-1">Anexe imagens para documentar esta tarefa</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Contador de anexos */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          <span>
            {attachments.length} {attachments.length === 1 ? 'anexo' : 'anexos'}
          </span>
        </div>

        {/* Grid de miniaturas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative rounded-lg overflow-hidden border bg-card hover:shadow-md transition-all"
            >
              {/* Imagem */}
              <div className="aspect-square relative bg-muted">
                {attachment.url ? (
                  <img
                    src={attachment.url}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(attachment)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Overlay com ações */}
                {showActions && attachment.url && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setSelectedImage(attachment)}
                      title="Visualizar"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    {onDownload && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => handleDownload(attachment)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteConfirm(attachment)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Info do arquivo */}
              <div className="p-2 bg-muted/50">
                <p className="text-xs truncate" title={attachment.file_name}>
                  {attachment.file_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de visualização em tela cheia */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedImage?.file_name}</span>
              <div className="flex items-center gap-2">
                {onDownload && selectedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedImage?.url && (
            <div className="relative w-full max-h-[70vh] overflow-auto rounded-lg bg-muted">
              <img
                src={selectedImage.url}
                alt={selectedImage.file_name}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Tamanho: {selectedImage && formatFileSize(selectedImage.file_size)} •
            Tipo: {selectedImage?.mime_type}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o arquivo "{deleteConfirm?.file_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
