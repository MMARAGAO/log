-- Migration: Adicionar coluna pagamento_detalhes na tabela vendas
-- Data: 2025-11-02
-- Descrição: Adiciona coluna JSONB para armazenar detalhes de pagamentos múltiplos
--            Estrutura: { "pix": 150.00, "dinheiro": 100.00, "credito": 50.00 }

-- ========================================
-- 1. Adicionar a coluna pagamento_detalhes
-- ========================================
ALTER TABLE public.vendas
ADD COLUMN IF NOT EXISTS pagamento_detalhes JSONB DEFAULT NULL;

-- ========================================
-- 2. Adicionar comentário descritivo
-- ========================================
COMMENT ON COLUMN public.vendas.pagamento_detalhes IS 
'Detalhes de pagamentos múltiplos em formato JSON. 
Estrutura: {"pix": 150.00, "dinheiro": 100.00, "credito": 50.00}
Usado quando forma_pagamento = "misto" ou múltiplas formas de pagamento';

-- ========================================
-- 3. Criar índice GIN para consultas no JSONB (opcional, mas recomendado)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_vendas_pagamento_detalhes 
ON public.vendas USING GIN (pagamento_detalhes);

-- ========================================
-- 4. Script de migração de dados (OPCIONAL)
-- Caso você queira migrar dados de vendas_pagamentos para pagamento_detalhes
-- DESCOMENTE ABAIXO SE QUISER EXECUTAR A MIGRAÇÃO
-- ========================================

/*
-- Preencher pagamento_detalhes com dados de vendas_pagamentos
WITH pagamentos_agrupados AS (
  SELECT 
    venda_id,
    jsonb_object_agg(
      LOWER(forma),  -- Normaliza chave para minúscula
      valor
    ) as detalhes
  FROM vendas_pagamentos
  GROUP BY venda_id
)
UPDATE vendas v
SET pagamento_detalhes = pa.detalhes
FROM pagamentos_agrupados pa
WHERE v.id = pa.venda_id
  AND v.pagamento_detalhes IS NULL;  -- Só atualiza se ainda não tiver

-- Verificar resultados
SELECT 
  v.id,
  v.forma_pagamento,
  v.pagamento_detalhes,
  COUNT(vp.id) as qtd_pagamentos_vp
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.pagamento_detalhes IS NOT NULL
GROUP BY v.id, v.forma_pagamento, v.pagamento_detalhes
LIMIT 10;
*/

-- ========================================
-- 5. Exemplo de uso
-- ========================================

-- Inserir venda com pagamento múltiplo:
-- INSERT INTO vendas (
--   cliente_nome, 
--   total_liquido, 
--   forma_pagamento, 
--   pagamento_detalhes
-- ) VALUES (
--   'Cliente Teste',
--   300.00,
--   'misto',
--   '{"pix": 150.00, "dinheiro": 150.00}'::jsonb
-- );

-- Consultar vendas com múltiplos pagamentos:
-- SELECT 
--   id, 
--   cliente_nome, 
--   forma_pagamento,
--   pagamento_detalhes,
--   pagamento_detalhes->>'pix' as valor_pix,
--   pagamento_detalhes->>'dinheiro' as valor_dinheiro
-- FROM vendas
-- WHERE pagamento_detalhes IS NOT NULL;

-- Verificar total de cada forma de pagamento:
-- SELECT 
--   key as forma_pagamento,
--   SUM(value::numeric) as total
-- FROM vendas v,
--   jsonb_each_text(v.pagamento_detalhes)
-- WHERE v.data_venda >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY key
-- ORDER BY total DESC;

COMMIT;
