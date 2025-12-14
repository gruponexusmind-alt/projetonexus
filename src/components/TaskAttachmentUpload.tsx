import { useCallback, useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createImagePreview, formatFileSize } from '@/utils/fileValidation';

interface TaskAttachmentUploadProps {
  onFilesSelected: (files: File[]) => Promise<void>;
  uploading?: boolean;
  disabled?: boolean;
  maxFiles?: number;
}

interface PreviewFile {
  file: File;
  preview: string;
  id: string;
}

export function TaskAttachmentUpload({
  onFilesSelected,
  uploading = false,
  disabled = false,
  maxFiles = 10,
}: TaskAttachmentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processar arquivos selecionados
  const processFiles = useCallback(
    async (files: File[]) => {
      if (disabled || uploading) return;

      // Limitar número de arquivos
      const filesToProcess = files.slice(0, maxFiles - previews.length);

      // Criar previews
      const newPreviews: PreviewFile[] = [];
      for (const file of filesToProcess) {
        try {
          const preview = await createImagePreview(file);
          newPreviews.push({
            file,
            preview,
            id: `${file.name}-${Date.now()}-${Math.random()}`,
          });
        } catch (error) {
          console.error('Erro ao criar preview:', error);
        }
      }

      setPreviews((prev) => [...prev, ...newPreviews]);

      // Chamar callback com os arquivos
      if (newPreviews.length > 0) {
        await onFilesSelected(newPreviews.map((p) => p.file));
        // Limpar previews após upload bem-sucedido
        setPreviews([]);
      }
    },
    [disabled, uploading, maxFiles, previews.length, onFilesSelected]
  );

  // Handler para drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  // Handler para input de arquivo
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      processFiles(files);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  // Remover preview
  const removePreview = useCallback((id: string) => {
    setPreviews((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Abrir seletor de arquivos
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Área de drag & drop */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-all duration-200',
          'flex flex-col items-center justify-center gap-3',
          'hover:border-primary/50 hover:bg-muted/50 cursor-pointer',
          isDragging && 'border-primary bg-primary/5 scale-[1.02]',
          disabled && 'opacity-50 cursor-not-allowed',
          uploading && 'pointer-events-none'
        )}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium">Enviando arquivos...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Arraste imagens aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF ou WebP • Máx. 10 MB por arquivo
              </p>
            </div>
          </>
        )}
      </div>

      {/* Previews dos arquivos selecionados */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos selecionados:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="relative group rounded-lg overflow-hidden border bg-card"
              >
                <div className="aspect-square relative">
                  <img
                    src={preview.preview}
                    alt={preview.file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePreview(preview.id);
                      }}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted/50">
                  <p className="text-xs truncate" title={preview.file.name}>
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(preview.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
