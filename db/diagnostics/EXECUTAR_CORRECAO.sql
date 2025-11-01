-- =====================================================
-- CORREÇÃO RÁPIDA - Execute este comando diretamente
-- =====================================================

-- Corrige as vendas #135 e #237
UPDATE vendas 
SET 
  status_pagamento = 'pago',
  updated_at = NOW()
WHERE id IN (135, 237)
  AND status_pagamento = 'devolvido';

-- Verificar resultado
SELECT 
  v.id,
  v.total_liquido,
  v.status_pagamento as novo_status,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  CASE 
    WHEN v.status_pagamento = 'pago' THEN '✓ Corrigido!'
    ELSE '✗ Erro'
  END as resultado
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.id IN (135, 237);
