import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  file: z.instanceof(File).optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  document_type: z.enum(['contract', 'report', 'design', 'requirement', 'general']),
  stage_related: z.string().optional(),
});

interface DocumentDetailsModalProps {
  projectId: string;
  companyId: string;
  onDocumentUploaded?: () => void;
  children: React.ReactNode;
}

const documentTypeLabels = {
  contract: 'Contrato',
  report: 'Relatório',
  design: 'Design',
  requirement: 'Requisito',
  general: 'Geral'
};

export function DocumentDetailsModal({ projectId, companyId, onDocumentUploaded, children }: DocumentDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      document_type: 'general',
      stage_related: '',
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('file', file);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedFile) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${companyId}/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save document record with details
      const { error: dbError } = await supabase
        .from('gp_project_documents')
        .insert({
          project_id: projectId,
          company_id: companyId,
          name: selectedFile.name,
          storage_path: filePath,
          size_bytes: selectedFile.size,
          mime_type: selectedFile.type,
          description: values.description,
          document_type: values.document_type,
          stage_related: values.stage_related || null,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (dbError) throw dbError;

      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso.',
      });

      form.reset();
      setSelectedFile(null);
      setOpen(false);
      onDocumentUploaded?.();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload do documento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Documento</DialogTitle>
          <DialogDescription>
            Faça upload de um documento com detalhes do contexto do projeto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo</label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar um arquivo
                    </p>
                  </div>
                )}
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-2" 
                  asChild
                >
                  <label htmlFor="file-input" className="cursor-pointer">
                    Selecionar Arquivo
                  </label>
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Documento</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o conteúdo e propósito deste documento..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(documentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage_related"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa Relacionada (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Desenvolvimento, Testes..." 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !selectedFile}>
                {loading ? 'Enviando...' : 'Fazer Upload'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}