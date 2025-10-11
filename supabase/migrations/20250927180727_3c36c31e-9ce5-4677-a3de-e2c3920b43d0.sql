-- Expandir tabela gp_project_documents com campos para detalhes do documento
ALTER TABLE public.gp_project_documents 
ADD COLUMN description text,
ADD COLUMN stage_related text,
ADD COLUMN document_type text DEFAULT 'general';

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.gp_project_documents.description IS 'Descrição detalhada do documento';
COMMENT ON COLUMN public.gp_project_documents.stage_related IS 'Etapa do projeto relacionada ao documento';
COMMENT ON COLUMN public.gp_project_documents.document_type IS 'Tipo do documento (contract, report, design, etc.)';

-- Criar índice para melhor performance nas consultas por tipo
CREATE INDEX idx_project_documents_type ON public.gp_project_documents(document_type);
CREATE INDEX idx_project_documents_stage ON public.gp_project_documents(stage_related);