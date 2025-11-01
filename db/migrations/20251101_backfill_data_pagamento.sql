-- =====================================================
-- Migration: Backfill data_pagamento em vendas antigas
-- Data: 01/11/2025
-- Descrição: Preenche o campo data_pagamento para vendas
--           que já foram pagas mas não têm esse campo
--           preenchido (foram pagas antes do campo existir)
-- =====================================================

-- 1. Para vendas com status 'pago' e data_pagamento NULL:
--    Usar updated_at como aproximação da data de pagamento
--    (assumindo que o pagamento foi registrado na última atualização)
UPDATE public.vendas
SET data_pagamento = updated_at
WHERE status_pagamento = 'pago'
  AND data_pagamento IS NULL
  AND updated_at IS NOT NULL;

-- 2. Para vendas pagas que não têm updated_at (caso raro):
--    Usar created_at como fallback
UPDATE public.vendas
SET data_pagamento = created_at
WHERE status_pagamento = 'pago'
  AND data_pagamento IS NULL
  AND created_at IS NOT NULL;

-- 3. Para vendas com status 'pago' mas ainda sem data_pagamento:
--    Usar data_venda como último recurso (melhor que NULL)
UPDATE public.vendas
SET data_pagamento = data_venda
WHERE status_pagamento = 'pago'
  AND data_pagamento IS NULL;

-- 4. Verificar quantas vendas foram atualizadas
DO $$
DECLARE
  vendas_atualizadas INTEGER;
  vendas_pagas_total INTEGER;
  vendas_sem_data INTEGER;
BEGIN
  -- Contar vendas pagas com data_pagamento preenchida
  SELECT COUNT(*) INTO vendas_atualizadas
  FROM public.vendas
  WHERE status_pagamento = 'pago'
    AND data_pagamento IS NOT NULL;
  
  -- Contar total de vendas pagas
  SELECT COUNT(*) INTO vendas_pagas_total
  FROM public.vendas
  WHERE status_pagamento = 'pago';
  
  -- Contar vendas pagas sem data_pagamento (deveria ser 0 agora)
  SELECT COUNT(*) INTO vendas_sem_data
  FROM public.vendas
  WHERE status_pagamento = 'pago'
    AND data_pagamento IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL data_pagamento - RESULTADO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de vendas pagas: %', vendas_pagas_total;
  RAISE NOTICE 'Vendas com data_pagamento: %', vendas_atualizadas;
  RAISE NOTICE 'Vendas ainda sem data_pagamento: %', vendas_sem_data;
  RAISE NOTICE '========================================';
  
  IF vendas_sem_data > 0 THEN
    RAISE WARNING 'Ainda existem % vendas pagas sem data_pagamento!', vendas_sem_data;
  ELSE
    RAISE NOTICE '✓ Todas as vendas pagas agora têm data_pagamento!';
  END IF;
END $$;

-- 5. (OPCIONAL) Criar índice para melhorar performance de queries por data_pagamento
CREATE INDEX IF NOT EXISTS idx_vendas_data_pagamento 
ON public.vendas(data_pagamento) 
WHERE data_pagamento IS NOT NULL;

-- 6. (OPCIONAL) Criar índice composto para queries do Caixa
CREATE INDEX IF NOT EXISTS idx_vendas_loja_data_pagamento 
ON public.vendas(loja_id, data_pagamento) 
WHERE data_pagamento IS NOT NULL 
  AND status_pagamento != 'cancelado';

COMMENT ON INDEX idx_vendas_data_pagamento IS 
'Índice para otimizar queries que filtram vendas por data de pagamento (usado pelo Caixa)';

COMMENT ON INDEX idx_vendas_loja_data_pagamento IS 
'Índice composto para otimizar queries do Caixa que filtram por loja e data de pagamento';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
