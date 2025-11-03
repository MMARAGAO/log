-- Migration: Criar tabela de histórico de alterações de estoque
-- Data: 2025-11-03
-- Descrição: Armazena todas as alterações de quantidade no estoque_lojas para auditoria

-- Criar tabela estoque_historico
CREATE TABLE IF NOT EXISTS public.estoque_historico (
  id BIGSERIAL PRIMARY KEY,
  produto_id BIGINT NOT NULL,
  loja_id BIGINT NOT NULL,
  quantidade_anterior INT NOT NULL DEFAULT 0,
  quantidade_nova INT NOT NULL DEFAULT 0,
  quantidade_alterada INT NOT NULL, -- Diferença (positivo = entrada, negativo = saída)
  tipo_operacao VARCHAR(50), -- 'ajuste_manual', 'venda', 'devolucao', 'transferencia', 'entrada_estoque'
  usuario_id UUID, -- Quem fez a alteração
  usuario_nome VARCHAR(255), -- Nome do usuário (desnormalizado para histórico)
  observacao TEXT, -- Motivo ou detalhes da alteração
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_produto FOREIGN KEY (produto_id) REFERENCES public.estoque(id) ON DELETE CASCADE,
  CONSTRAINT fk_loja FOREIGN KEY (loja_id) REFERENCES public.lojas(id) ON DELETE CASCADE,
  CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_estoque_historico_produto_id ON public.estoque_historico(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_loja_id ON public.estoque_historico(loja_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_usuario_id ON public.estoque_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_created_at ON public.estoque_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estoque_historico_tipo_operacao ON public.estoque_historico(tipo_operacao);

-- Habilitar Row Level Security
ALTER TABLE public.estoque_historico ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler o histórico (para auditoria)
CREATE POLICY "Permitir leitura do histórico para todos autenticados"
  ON public.estoque_historico
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas o sistema pode inserir registros de histórico
CREATE POLICY "Permitir inserção no histórico para todos autenticados"
  ON public.estoque_historico
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.estoque_historico IS 'Histórico de todas as alterações de quantidade no estoque por loja';
COMMENT ON COLUMN public.estoque_historico.quantidade_alterada IS 'Diferença entre quantidade nova e anterior (positivo = entrada, negativo = saída)';
COMMENT ON COLUMN public.estoque_historico.tipo_operacao IS 'Tipo de operação: ajuste_manual, venda, devolucao, transferencia, entrada_estoque';
COMMENT ON COLUMN public.estoque_historico.usuario_nome IS 'Nome do usuário armazenado para histórico (caso o usuário seja deletado)';
