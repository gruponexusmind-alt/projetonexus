-- =========================================
-- ADICIONAR CLIENT_ID AO PROFILES
-- =========================================
-- Esta migration adiciona o campo client_id na tabela profiles
-- para vincular usuários com role='cliente' aos registros de gp_clients

-- 1. Adicionar coluna client_id na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.gp_clients(id) ON DELETE SET NULL;

-- 2. Criar índice para melhorar performance de queries por client_id
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);

-- 3. Comentário explicativo
COMMENT ON COLUMN public.profiles.client_id IS 'Vincula o usuário (profile) a um cliente (gp_clients). Usado quando role=cliente para identificar qual cliente este usuário representa.';
