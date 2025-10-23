import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientFileUploadProps {
  token: string;
  email: string;
}

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
];

export function ClientFileUpload({ token, email }: ClientFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Tamanho máximo: 10MB';
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadedFiles(prev => [
        ...prev,
        { name: file.name, size: file.size, status: 'error', progress: 0, error },
      ]);
      return;
    }

    // Add file to list with uploading status
    const fileIndex = uploadedFiles.length;
    setUploadedFiles(prev => [
      ...prev,
      { name: file.name, size: file.size, status: 'uploading', progress: 0 },
    ]);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('email', email);
      formData.append('file', file);

      // Simulate progress (real progress would require chunked upload or server-sent events)
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => {
          const newFiles = [...prev];
          if (newFiles[fileIndex] && newFiles[fileIndex].progress < 90) {
            newFiles[fileIndex].progress += 10;
          }
          return newFiles;
        });
      }, 200);

      const { data, error: invokeError } = await supabase.functions.invoke('upload-client-document', {
        body: formData,
      });

      clearInterval(progressInterval);

      if (invokeError) {
        throw new Error(invokeError.message || 'Erro ao enviar arquivo');
      }

      // Update status to success
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        newFiles[fileIndex] = { ...newFiles[fileIndex], status: 'success', progress: 100 };
        return newFiles;
      });

      toast({
        title: 'Arquivo enviado com sucesso!',
        description: `${file.name} foi recebido pela equipe do projeto.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        newFiles[fileIndex] = {
          ...newFiles[fileIndex],
          status: 'error',
          progress: 0,
          error: error.message || 'Erro ao enviar arquivo',
        };
        return newFiles;
      });

      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar o arquivo',
        variant: 'destructive',
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Enviar Documentos
          </CardTitle>
          <CardDescription>
            Envie documentos, imagens ou arquivos relacionados ao projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${
              isDragging ? 'text-primary' : 'text-gray-400'
            }`} />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-600 mb-4">
              PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF (máx. 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant={isDragging ? "default" : "outline"}
              className="mt-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivos
            </Button>
          </div>

          {/* Info Alert */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre os uploads</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Os arquivos serão recebidos pela equipe do projeto</li>
                <li>Você receberá confirmação após cada envio bem-sucedido</li>
                <li>Tamanho máximo por arquivo: 10MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Arquivos Enviados</CardTitle>
            <CardDescription>
              {uploadedFiles.filter(f => f.status === 'success').length} de {uploadedFiles.length} arquivo(s) enviado(s) com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    file.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : file.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {file.status === 'uploading' && (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        )}
                        {file.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        )}
                        {file.status === 'error' && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatFileSize(file.size)}
                        </p>
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="h-1 mt-2" />
                        )}
                        {file.error && (
                          <p className="text-xs text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {file.status === 'success' && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                          Enviado
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                          Falhou
                        </span>
                      )}
                      {file.status === 'uploading' && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                          {file.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
