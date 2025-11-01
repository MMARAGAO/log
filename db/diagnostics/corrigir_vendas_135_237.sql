-- =====================================================
-- Correção Específica das Devoluções Parciais
-- Data: 01/11/2025
-- Vendas a corrigir:
--   - Venda #135: R$ 1.540,00 (devolvido R$ 80)
--   - Venda #237: R$ 570,00 (devolvido R$ 200)
-- =====================================================

-- PASSO 1: VERIFICAR ESTADO ATUAL
-- =================================

SELECT 
  '=== ESTADO ATUAL DAS VENDAS ===' as info;

SELECT 
  v.id as venda_id,
  v.data_venda::date as data_venda,
  v.cliente_nome,
  v.total_liquido,
  v.status_pagamento as status_atual,
  v.data_pagamento::timestamp as data_pagamento,
  d.id as devolucao_id,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  d.credito_aplicado,
  d.status as status_devolucao
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.id IN (135, 237)
ORDER BY v.id;

-- =====================================================
-- PASSO 2: VERIFICAR DETALHES DAS DEVOLUÇÕES
-- =====================================================

SELECT 
  '=== DETALHES DAS DEVOLUÇÕES ===' as info;

SELECT 
  id as devolucao_id,
  id_venda,
  tipo_devolucao,
  valor_total_devolvido,
  valor_credito_gerado,
  credito_aplicado,
  status,
  motivo_devolucao,
  data_devolucao::timestamp
FROM devolucoes
WHERE id_venda IN (135, 237)
ORDER BY id_venda;

-- =====================================================
-- PASSO 3: APLICAR CORREÇÃO
-- =====================================================

SELECT 
  '=== APLICANDO CORREÇÕES ===' as info;

-- Correção da Venda #135 (R$ 1.540 - devolução de R$ 80)
UPDATE vendas 
SET 
  status_pagamento = 'pago',
  updated_at = NOW()
WHERE id = 135
  AND status_pagamento = 'devolvido';

-- Verificar se foi atualizada
SELECT 
  CASE 
    WHEN status_pagamento = 'pago' THEN '✓ Venda #135 corrigida com sucesso!'
    ELSE '✗ ERRO ao corrigir venda #135'
  END as resultado
FROM vendas WHERE id = 135;

-- Correção da Venda #237 (R$ 570 - devolução de R$ 200)
UPDATE vendas 
SET 
  status_pagamento = 'pago',
  updated_at = NOW()
WHERE id = 237
  AND status_pagamento = 'devolvido';

-- Verificar se foi atualizada
SELECT 
  CASE 
    WHEN status_pagamento = 'pago' THEN '✓ Venda #237 corrigida com sucesso!'
    ELSE '✗ ERRO ao corrigir venda #237'
  END as resultado
FROM vendas WHERE id = 237;

-- =====================================================
-- PASSO 4: VALIDAR CORREÇÃO
-- =====================================================

SELECT 
  '=== VALIDAÇÃO APÓS CORREÇÃO ===' as info;

-- Verificar estado final
SELECT 
  v.id as venda_id,
  v.cliente_nome,
  v.total_liquido as valor_venda,
  v.status_pagamento as status_novo,
  v.data_pagamento::timestamp as data_pagamento,
  d.tipo_devolucao,
  d.valor_total_devolvido as valor_devolvido,
  d.credito_aplicado,
  (v.total_liquido - d.valor_total_devolvido) as valor_liquido_real,
  CASE 
    WHEN v.status_pagamento = 'pago' THEN '✓ CORRETO'
    ELSE '✗ AINDA COM PROBLEMA'
  END as situacao
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.id IN (135, 237)
ORDER BY v.id;

-- =====================================================
-- PASSO 5: RESUMO FINAL
-- =====================================================

SELECT 
  '=== RESUMO FINAL ===' as info;

SELECT 
  COUNT(*) as total_corrigidas,
  SUM(v.total_liquido) as valor_total_vendas,
  SUM(d.valor_total_devolvido) as valor_total_devolvido,
  SUM(v.total_liquido - d.valor_total_devolvido) as valor_liquido_final
FROM vendas v
INNER JOIN devolucoes d ON d.id_venda = v.id
WHERE v.id IN (135, 237)
  AND v.status_pagamento = 'pago'
  AND d.tipo_devolucao = 'parcial';

-- Verificar se ainda há problemas pendentes
SELECT 
  COUNT(*) as vendas_ainda_com_problema,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ Todas as devoluções parciais foram corrigidas!'
    ELSE '⚠ Ainda há devoluções parciais marcadas como devolvidas'
  END as status
FROM vendas v
INNER JOIN devolucoes d ON d.id_venda = v.id
WHERE v.status_pagamento = 'devolvido'
  AND d.tipo_devolucao = 'parcial';

-- =====================================================
-- INFORMAÇÕES IMPORTANTES
-- =====================================================

SELECT 
  '=== INFORMAÇÕES PÓS-CORREÇÃO ===' as info;

/*

RESULTADO ESPERADO:

Venda #135:
  - Valor: R$ 1.540,00
  - Status: PAGO ✓
  - Devolvido: R$ 80,00 (parcial com crédito)
  - Aparece no Faturamento: SIM
  - Aparece no Caixa: SIM (valor original)
  - Cliente: +R$ 80,00 de crédito

Venda #237:
  - Valor: R$ 570,00
  - Status: PAGO ✓
  - Devolvido: R$ 200,00 (parcial)
  - Aparece no Faturamento: SIM
  - Aparece no Caixa: SIM (valor original)
  - Nota: Valor líquido real = R$ 370,00

IMPORTANTE:
- Ambas as vendas agora aparecem como "pagas"
- Os valores originais são mantidos no Caixa
- As devoluções estão registradas na tabela devolucoes
- Os créditos dos clientes foram/serão aplicados conforme configurado

*/

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================
