-- =====================================================
-- Investigação das Vendas do Dia 29/10/2025
-- =====================================================

-- TODAS AS VENDAS COM data_pagamento = 29/10
SELECT 
  '=== VENDAS COM DATA_PAGAMENTO = 29/10 ===' as info;

SELECT 
  v.id,
  v.cliente_nome,
  v.data_venda::date as data_venda,
  v.data_pagamento::date as data_pagamento,
  v.total_liquido,
  v.forma_pagamento,
  v.status_pagamento,
  d.id as devolucao_id,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  d.credito_aplicado,
  CASE 
    WHEN v.status_pagamento = 'pago' THEN 'Conta'
    WHEN v.status_pagamento = 'devolvido' AND d.credito_aplicado THEN 'Conta (com crédito)'
    WHEN v.status_pagamento = 'devolvido' AND NOT d.credito_aplicado THEN 'NÃO Conta (sem crédito)'
    ELSE 'Verificar'
  END as deve_contar_no_caixa
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.data_pagamento::date = '2025-10-29'
ORDER BY v.id;

-- RESUMO POR STATUS
SELECT 
  '=== RESUMO POR STATUS (data_pagamento = 29/10) ===' as info;

SELECT 
  v.status_pagamento,
  d.credito_aplicado,
  COUNT(*) as quantidade,
  SUM(v.total_liquido) as valor_total
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.data_pagamento::date = '2025-10-29'
GROUP BY v.status_pagamento, d.credito_aplicado
ORDER BY v.status_pagamento;

-- CÁLCULO CORRETO DO CAIXA
SELECT 
  '=== CÁLCULO CORRETO DO CAIXA (29/10) ===' as info;

-- Vendas PAGAS
SELECT 
  'Vendas Pagas' as tipo,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor
FROM vendas
WHERE data_pagamento::date = '2025-10-29'
  AND status_pagamento = 'pago'

UNION ALL

-- Devoluções COM crédito (mantém no caixa)
SELECT 
  'Devoluções COM crédito (mantém)' as tipo,
  COUNT(DISTINCT v.id) as quantidade,
  SUM(v.total_liquido) as valor
FROM vendas v
INNER JOIN devolucoes d ON d.id_venda = v.id
WHERE v.data_pagamento::date = '2025-10-29'
  AND v.status_pagamento = 'devolvido'
  AND d.credito_aplicado = true

UNION ALL

-- Devoluções SEM crédito (subtrai do caixa)
SELECT 
  'Devoluções SEM crédito (subtrai)' as tipo,
  COUNT(DISTINCT v.id) as quantidade,
  -SUM(d.valor_total_devolvido) as valor
FROM vendas v
INNER JOIN devolucoes d ON d.id_venda = v.id
WHERE v.data_pagamento::date = '2025-10-29'
  AND v.status_pagamento = 'devolvido'
  AND d.credito_aplicado = false;

-- TOTAL FINAL
SELECT 
  '=== TOTAL FINAL DO CAIXA (29/10) ===' as info;

WITH vendas_pagas AS (
  SELECT 
    COUNT(*) as qtd,
    SUM(total_liquido) as valor
  FROM vendas
  WHERE data_pagamento::date = '2025-10-29'
    AND status_pagamento = 'pago'
),
devolucoes_sem_credito AS (
  SELECT 
    COUNT(DISTINCT v.id) as qtd,
    SUM(d.valor_total_devolvido) as valor
  FROM vendas v
  INNER JOIN devolucoes d ON d.id_venda = v.id
  WHERE v.data_pagamento::date = '2025-10-29'
    AND v.status_pagamento = 'devolvido'
    AND d.credito_aplicado = false
)
SELECT 
  vp.qtd as vendas_pagas,
  vp.valor as valor_vendas_pagas,
  COALESCE(ds.qtd, 0) as devolucoes_sem_credito,
  COALESCE(ds.valor, 0) as valor_devolvido_sem_credito,
  vp.qtd as total_vendas_no_caixa,
  (vp.valor - COALESCE(ds.valor, 0)) as valor_total_caixa
FROM vendas_pagas vp
CROSS JOIN devolucoes_sem_credito ds;

-- COMPARAR COM VENDAS POR data_venda
SELECT 
  '=== COMPARAÇÃO: data_venda vs data_pagamento (29/10) ===' as info;

SELECT 
  'Por data_venda' as filtro,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total
FROM vendas
WHERE data_venda::date = '2025-10-29'
  AND status_pagamento = 'pago'

UNION ALL

SELECT 
  'Por data_pagamento' as filtro,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total
FROM vendas
WHERE data_pagamento::date = '2025-10-29'
  AND status_pagamento = 'pago';

-- DETALHES DA VENDA #149 (devolvida)
SELECT 
  '=== DETALHES DA VENDA #149 (BUZZ TECH) ===' as info;

SELECT 
  v.id,
  v.cliente_nome,
  v.data_venda::timestamp as data_venda,
  v.data_pagamento::timestamp as data_pagamento,
  v.total_liquido,
  v.forma_pagamento,
  v.status_pagamento,
  d.id as devolucao_id,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  d.credito_aplicado,
  d.data_devolucao::timestamp as data_devolucao,
  d.motivo_devolucao
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.id = 149;
