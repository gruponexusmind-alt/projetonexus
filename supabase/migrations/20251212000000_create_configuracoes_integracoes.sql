-- Criar tabela de configurações de integrações
-- Esta tabela armazena configurações de integrações externas como SMTP, WhatsApp, etc.

-- Verificar pré-requisitos antes de criar a tabela
DO $$
BEGIN
  -- Verificar se a tabela companies existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'companies'
  ) THEN
    RAISE EXCEPTION 'Migration dependency error: table "companies" does not exist. Please run migration 20250926225849 first.';
  END IF;

  -- Verificar se a tabela profiles existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Migration dependency error: table "profiles" does not exist. Please create profiles table first.';
  END IF;

  -- Verificar se a coluna company_id existe na tabela profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'company_id'
  ) THEN
    RAISE EXCEPTION 'Migration dependency error: column "profiles.company_id" does not exist. Please run migration 20250926225849 first.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.configuracoes_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- Identificador da integração (email, whatsapp, calendar, etc)
  ativo BOOLEAN NOT NULL DEFAULT false,
  configuracoes JSONB NOT NULL DEFAULT '{}'::jsonb, -- Configurações flexíveis em JSON
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Garantir que cada empresa tenha apenas uma configuração por tipo de integração
  UNIQUE(company_id, nome)
);

-- Comentários para documentação
COMMENT ON TABLE public.configuracoes_integracoes IS 'Armazena configurações de integrações externas (SMTP, WhatsApp, etc)';
COMMENT ON COLUMN public.configuracoes_integracoes.nome IS 'Identificador único da integração (email, whatsapp, calendar, storage)';
COMMENT ON COLUMN public.configuracoes_integracoes.configuracoes IS 'Configurações da integração em formato JSON flexível';

-- Habilitar Row Level Security
ALTER TABLE public.configuracoes_integracoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários só podem ver/editar configurações da própria empresa
CREATE POLICY "Users can view their company integrations"
  ON public.configuracoes_integracoes
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert company integrations"
  ON public.configuracoes_integracoes
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update company integrations"
  ON public.configuracoes_integracoes
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete company integrations"
  ON public.configuracoes_integracoes
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_configuracoes_integracoes_updated_at
  BEFORE UPDATE ON public.configuracoes_integracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar índice para melhorar performance de queries por company_id
CREATE INDEX idx_configuracoes_integracoes_company_id
  ON public.configuracoes_integracoes(company_id);

-- Criar índice para queries por nome da integração
CREATE INDEX idx_configuracoes_integracoes_nome
  ON public.configuracoes_integracoes(nome);

-- Criar índice composto para queries mais comuns
CREATE INDEX idx_configuracoes_integracoes_company_nome
  ON public.configuracoes_integracoes(company_id, nome);
