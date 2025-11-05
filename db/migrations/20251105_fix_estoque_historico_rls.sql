-- Migration: Corrigir políticas RLS da tabela estoque_historico
-- Data: 2025-11-05
-- Descrição: Ajustar as políticas de segurança para permitir inserção correta no histórico

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura do histórico para todos autenticados" ON public.estoque_historico;
DROP POLICY IF EXISTS "Permitir inserção no histórico para todos autenticados" ON public.estoque_historico;

-- Habilitar Row Level Security (se ainda não estiver habilitado)
ALTER TABLE public.estoque_historico ENABLE ROW LEVEL SECURITY;

-- Política: Todos usuários autenticados podem ler o histórico
CREATE POLICY "estoque_historico_select_policy"
  ON public.estoque_historico
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Todos usuários autenticados podem inserir no histórico
CREATE POLICY "estoque_historico_insert_policy"
  ON public.estoque_historico
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'estoque_historico';

-- Comentários
COMMENT ON POLICY "estoque_historico_select_policy" ON public.estoque_historico IS 'Permite que todos usuários autenticados leiam o histórico de estoque';
COMMENT ON POLICY "estoque_historico_insert_policy" ON public.estoque_historico IS 'Permite que todos usuários autenticados insiram registros no histórico de estoque';
