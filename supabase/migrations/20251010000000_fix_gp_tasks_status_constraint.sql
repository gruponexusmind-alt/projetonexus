-- Corrigir constraint de status na tabela gp_tasks para incluir 'review'
-- Data: 2025-10-10

-- Primeiro, atualizar qualquer tarefa com status 'blocked' para 'pending'
UPDATE public.gp_tasks
SET status = 'pending'
WHERE status = 'blocked';

-- Remover o constraint antigo de status
ALTER TABLE public.gp_tasks
DROP CONSTRAINT IF EXISTS gp_tasks_status_check;

-- Adicionar novo constraint com os valores corretos
ALTER TABLE public.gp_tasks
ADD CONSTRAINT gp_tasks_status_check
CHECK (status IN ('pending', 'in_progress', 'review', 'completed'));

-- Comentário explicativo
COMMENT ON COLUMN public.gp_tasks.status IS 'Status da tarefa: pending (Pendente), in_progress (Em Progresso), review (Em Revisão), completed (Concluída)';
