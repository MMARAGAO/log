-- =====================================================
-- Script de Diagnóstico: Diferença Caixa vs Vendas
-- Data: 01/11/2025
-- Objetivo: Identificar a causa da diferença entre os
--           valores do Caixa e da página de Vendas
-- =====================================================

-- PARÂMETROS (ajuste conforme seu teste)
-- Período: 28/10/2025 a 31/10/2025

-- =====================================================
-- 1. RESUMO GERAL DO PERÍODO
-- =====================================================

SELECT 
  '=== RESUMO GERAL (28/10 a 31/10) ===' as secao;

-- Total de vendas no período (por data_venda)
SELECT 
  'Total de vendas criadas no período' as metrica,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total
FROM vendas
WHERE data_venda >= '2025-10-28'
  AND data_venda <= '2025-10-31T23:59:59';

-- Total de vendas pagas no período (usado no Faturamento da página Vendas)
SELECT 
  'Vendas CRIADAS no período e PAGAS' as metrica,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total
FROM vendas
WHERE data_venda >= '2025-10-28'
  AND data_venda <= '2025-10-31T23:59:59'
  AND status_pagamento = 'pago';

-- Total de pagamentos RECEBIDOS no período (usado no Caixa)
SELECT 
  'Pagamentos RECEBIDOS no período (Caixa)' as metrica,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total
FROM vendas
WHERE data_pagamento >= '2025-10-28'
  AND data_pagamento <= '2025-10-31T23:59:59'
  AND status_pagamento != 'cancelado';

-- =====================================================
-- 2. ANÁLISE DA DIFERENÇA
-- =====================================================

SELECT 
  '=== ANÁLISE DA DIFERENÇA ===' as secao;

-- Vendas que estão no Caixa mas NÃO na página Vendas
-- (criadas antes do período, pagas durante o período)
SELECT 
  'Vendas ANTIGAS pagas no período' as tipo,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total,
  'Aparecem no Caixa, não aparecem em Vendas' as observacao
FROM vendas
WHERE data_pagamento >= '2025-10-28'
  AND data_pagamento <= '2025-10-31T23:59:59'
  AND data_venda < '2025-10-28'
  AND status_pagamento != 'cancelado';

-- Vendas que estão na página Vendas mas NÃO no Caixa
-- (criadas durante o período, pagas depois ou não pagas)
SELECT 
  'Vendas NOVAS ainda não pagas ou pagas depois' as tipo,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total,
  'Aparecem em Vendas, não aparecem no Caixa' as observacao
FROM vendas
WHERE data_venda >= '2025-10-28'
  AND data_venda <= '2025-10-31T23:59:59'
  AND (
    data_pagamento IS NULL 
    OR data_pagamento < '2025-10-28' 
    OR data_pagamento > '2025-10-31T23:59:59'
  );

-- =====================================================
-- 3. DETALHAMENTO POR STATUS
-- =====================================================

SELECT 
  '=== VENDAS POR STATUS (período 28-31/10) ===' as secao;

SELECT 
  status_pagamento,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total,
  CASE 
    WHEN status_pagamento = 'pago' THEN 'Conta no Faturamento e no Caixa'
    WHEN status_pagamento = 'devolvido' THEN 'Pode aparecer no Caixa se data_pagamento estiver no período'
    WHEN status_pagamento = 'cancelado' THEN 'Não conta em nenhum lugar'
    ELSE 'Não conta no Faturamento nem no Caixa'
  END as onde_aparece
FROM vendas
WHERE data_venda >= '2025-10-28'
  AND data_venda <= '2025-10-31T23:59:59'
GROUP BY status_pagamento
ORDER BY status_pagamento;

-- =====================================================
-- 4. VENDAS DEVOLVIDAS (possível causa da diferença)
-- =====================================================

SELECT 
  '=== VENDAS DEVOLVIDAS ===' as secao;

-- Vendas com status 'devolvido' que têm data_pagamento no período
SELECT 
  'Vendas DEVOLVIDAS com data_pagamento no período' as tipo,
  COUNT(*) as quantidade,
  SUM(total_liquido) as valor_total,
  'Podem estar no Caixa mas não no Faturamento de Vendas' as observacao
FROM vendas
WHERE status_pagamento = 'devolvido'
  AND data_pagamento >= '2025-10-28'
  AND data_pagamento <= '2025-10-31T23:59:59';

-- =====================================================
-- 5. LISTA DETALHADA DAS DISCREPÂNCIAS
-- =====================================================

SELECT 
  '=== VENDAS QUE CAUSAM DIFERENÇA (TOP 20) ===' as secao;

-- Vendas antigas pagas no período (aparecem no Caixa, não em Vendas)
SELECT 
  'ANTIGAS_PAGAS' as grupo,
  id,
  data_venda::date as data_venda,
  data_pagamento::date as data_pagamento,
  status_pagamento,
  total_liquido,
  cliente_nome,
  forma_pagamento
FROM vendas
WHERE data_pagamento >= '2025-10-28'
  AND data_pagamento <= '2025-10-31T23:59:59'
  AND data_venda < '2025-10-28'
  AND status_pagamento != 'cancelado'
ORDER BY total_liquido DESC
LIMIT 20;

-- Vendas com status devolvido no período
SELECT 
  'DEVOLVIDAS' as grupo,
  id,
  data_venda::date as data_venda,
  data_pagamento::date as data_pagamento,
  status_pagamento,
  total_liquido,
  cliente_nome,
  forma_pagamento
FROM vendas
WHERE status_pagamento = 'devolvido'
  AND data_pagamento >= '2025-10-28'
  AND data_pagamento <= '2025-10-31T23:59:59'
ORDER BY total_liquido DESC
LIMIT 20;

-- =====================================================
-- 6. CÁLCULO DA DIFERENÇA ESPERADA
-- =====================================================

SELECT 
  '=== CÁLCULO DA DIFERENÇA ===' as secao;

WITH 
caixa_total AS (
  SELECT SUM(total_liquido) as total
  FROM vendas
  WHERE data_pagamento >= '2025-10-28'
    AND data_pagamento <= '2025-10-31T23:59:59'
    AND status_pagamento != 'cancelado'
),
vendas_faturamento AS (
  SELECT SUM(total_liquido) as total
  FROM vendas
  WHERE data_venda >= '2025-10-28'
    AND data_venda <= '2025-10-31T23:59:59'
    AND status_pagamento = 'pago'
),
antigas_pagas AS (
  SELECT SUM(total_liquido) as total
  FROM vendas
  WHERE data_pagamento >= '2025-10-28'
    AND data_pagamento <= '2025-10-31T23:59:59'
    AND data_venda < '2025-10-28'
    AND status_pagamento != 'cancelado'
),
devolvidas AS (
  SELECT SUM(total_liquido) as total
  FROM vendas
  WHERE status_pagamento = 'devolvido'
    AND data_pagamento >= '2025-10-28'
    AND data_pagamento <= '2025-10-31T23:59:59'
)
SELECT 
  'Caixa (pagamentos recebidos)' as metrica,
  COALESCE(caixa_total.total, 0) as valor
FROM caixa_total
UNION ALL
SELECT 
  'Vendas (faturamento - vendas pagas)' as metrica,
  COALESCE(vendas_faturamento.total, 0) as valor
FROM vendas_faturamento
UNION ALL
SELECT 
  'Diferença' as metrica,
  COALESCE(caixa_total.total, 0) - COALESCE(vendas_faturamento.total, 0) as valor
FROM caixa_total, vendas_faturamento
UNION ALL
SELECT 
  '  └─ Vendas antigas pagas no período' as metrica,
  COALESCE(antigas_pagas.total, 0) as valor
FROM antigas_pagas
UNION ALL
SELECT 
  '  └─ Vendas devolvidas com data_pagamento no período' as metrica,
  COALESCE(devolvidas.total, 0) as valor
FROM devolvidas;

-- =====================================================
-- 7. RECOMENDAÇÃO
-- =====================================================

SELECT 
  '=== RECOMENDAÇÃO ===' as secao;

WITH diferenca AS (
  SELECT 
    (SELECT SUM(total_liquido) FROM vendas
     WHERE data_pagamento >= '2025-10-28' AND data_pagamento <= '2025-10-31T23:59:59'
       AND status_pagamento != 'cancelado') 
    - 
    (SELECT SUM(total_liquido) FROM vendas
     WHERE data_venda >= '2025-10-28' AND data_venda <= '2025-10-31T23:59:59'
       AND status_pagamento = 'pago') as diff
)
SELECT 
  CASE 
    WHEN ABS(diff) < 1 THEN 
      'Os valores estão praticamente iguais! Diferença insignificante.'
    WHEN diff > 0 THEN 
      'O Caixa está maior que Vendas. Isso é esperado se houver vendas antigas pagas no período.'
    ELSE 
      'As Vendas estão maiores que o Caixa. Pode haver vendas contabilizadas mas não pagas.'
  END as analise,
  ABS(diff) as diferenca_absoluta
FROM diferenca;

-- =====================================================
-- FIM DO DIAGNÓSTICO
-- =====================================================
