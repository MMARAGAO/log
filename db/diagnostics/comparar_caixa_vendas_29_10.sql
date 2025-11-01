-- =====================================================
-- Comparação Detalhada: Caixa vs Vendas (29/10/2025)
-- =====================================================

-- 1. VENDAS QUE APARECEM NO CAIXA (data_pagamento = 29/10)
-- Mas NÃO foram criadas em 29/10
SELECT 
  '=== VENDAS PAGAS EM 29/10 MAS CRIADAS EM OUTRA DATA ===' as info;

SELECT 
  v.id,
  v.cliente_nome,
  v.data_venda::date as data_criacao,
  v.data_pagamento::date as data_pagamento,
  v.total_liquido,
  v.forma_pagamento,
  v.status_pagamento,
  CASE 
    WHEN d.id IS NOT NULL AND d.credito_aplicado THEN 'Devolvida COM crédito'
    WHEN d.id IS NOT NULL AND NOT d.credito_aplicado THEN 'Devolvida SEM crédito'
    ELSE 'Venda normal'
  END as tipo
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.data_pagamento::date = '2025-10-29'
  AND v.data_venda::date != '2025-10-29'
ORDER BY v.id;

-- Total deste grupo
SELECT 
  COUNT(*) as quantidade_vendas,
  SUM(v.total_liquido) as valor_total
FROM vendas v
WHERE v.data_pagamento::date = '2025-10-29'
  AND v.data_venda::date != '2025-10-29'
  AND (
    v.status_pagamento = 'pago' 
    OR (
      v.status_pagamento = 'devolvido' 
      AND EXISTS (
        SELECT 1 FROM devolucoes d 
        WHERE d.id_venda = v.id 
        AND d.credito_aplicado = true
      )
    )
  );

-- 2. VENDAS QUE APARECEM EM VENDAS (data_venda = 29/10)
-- Mas NÃO aparecem no Caixa (pagas em outra data)
SELECT 
  '=== VENDAS CRIADAS EM 29/10 MAS PAGAS EM OUTRA DATA ===' as info;

SELECT 
  v.id,
  v.cliente_nome,
  v.data_venda::date as data_criacao,
  v.data_pagamento::date as data_pagamento,
  v.total_liquido,
  v.forma_pagamento,
  v.status_pagamento
FROM vendas v
WHERE v.data_venda::date = '2025-10-29'
  AND v.status_pagamento = 'pago'
  AND (
    v.data_pagamento IS NULL 
    OR v.data_pagamento::date != '2025-10-29'
  )
ORDER BY v.id;

-- Total deste grupo
SELECT 
  COUNT(*) as quantidade_vendas,
  SUM(total_liquido) as valor_total
FROM vendas v
WHERE v.data_venda::date = '2025-10-29'
  AND v.status_pagamento = 'pago'
  AND (
    v.data_pagamento IS NULL 
    OR v.data_pagamento::date != '2025-10-29'
  );

-- 3. RESUMO COMPARATIVO
SELECT 
  '=== RESUMO COMPARATIVO (29/10) ===' as info;

SELECT 
  'Caixa (data_pagamento)' as origem,
  COUNT(*) as total_vendas,
  SUM(v.total_liquido) as valor_total
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.data_pagamento::date = '2025-10-29'
  AND (
    v.status_pagamento = 'pago'
    OR (v.status_pagamento = 'devolvido' AND d.credito_aplicado = true)
  )

UNION ALL

SELECT 
  'Vendas (data_venda)' as origem,
  COUNT(*) as total_vendas,
  SUM(total_liquido) as valor_total
FROM vendas v
WHERE v.data_venda::date = '2025-10-29'
  AND v.status_pagamento = 'pago';

-- 4. CÁLCULO DA DIFERENÇA
SELECT 
  '=== EXPLICAÇÃO DA DIFERENÇA ===' as info;

WITH caixa AS (
  SELECT 
    COUNT(*) as qtd,
    SUM(v.total_liquido) as valor
  FROM vendas v
  LEFT JOIN devolucoes d ON d.id_venda = v.id
  WHERE v.data_pagamento::date = '2025-10-29'
    AND (
      v.status_pagamento = 'pago'
      OR (v.status_pagamento = 'devolvido' AND d.credito_aplicado = true)
    )
),
vendas_tela AS (
  SELECT 
    COUNT(*) as qtd,
    SUM(total_liquido) as valor
  FROM vendas v
  WHERE v.data_venda::date = '2025-10-29'
    AND v.status_pagamento = 'pago'
),
pagas_outro_dia AS (
  SELECT 
    COUNT(*) as qtd,
    SUM(total_liquido) as valor
  FROM vendas v
  WHERE v.data_venda::date = '2025-10-29'
    AND v.status_pagamento = 'pago'
    AND (
      v.data_pagamento IS NULL 
      OR v.data_pagamento::date != '2025-10-29'
    )
),
criadas_outro_dia AS (
  SELECT 
    COUNT(*) as qtd,
    SUM(v.total_liquido) as valor
  FROM vendas v
  LEFT JOIN devolucoes d ON d.id_venda = v.id
  WHERE v.data_pagamento::date = '2025-10-29'
    AND v.data_venda::date != '2025-10-29'
    AND (
      v.status_pagamento = 'pago'
      OR (v.status_pagamento = 'devolvido' AND d.credito_aplicado = true)
    )
)
SELECT 
  'Caixa (data_pagamento = 29/10)' as item,
  c.qtd as quantidade,
  c.valor as valor
FROM caixa c

UNION ALL

SELECT 
  'Vendas (data_venda = 29/10)' as item,
  vt.qtd as quantidade,
  vt.valor as valor
FROM vendas_tela vt

UNION ALL

SELECT 
  '---' as item,
  NULL as quantidade,
  NULL as valor

UNION ALL

SELECT 
  '(-) Vendas criadas em 29/10 mas pagas em outra data' as item,
  -po.qtd as quantidade,
  -po.valor as valor
FROM pagas_outro_dia po

UNION ALL

SELECT 
  '(+) Vendas criadas em outra data mas pagas em 29/10' as item,
  co.qtd as quantidade,
  co.valor as valor
FROM criadas_outro_dia co

UNION ALL

SELECT 
  '---' as item,
  NULL as quantidade,
  NULL as valor

UNION ALL

SELECT 
  '= DIFERENÇA' as item,
  (vt.qtd - c.qtd) as quantidade,
  (vt.valor - c.valor) as valor
FROM caixa c, vendas_tela vt;

-- 5. VERIFICAÇÃO FINAL
SELECT 
  '=== VERIFICAÇÃO: Use filtro de data_pagamento em Vendas ===' as info;

SELECT 
  'Se usar data_pagamento em Vendas, valores devem bater!' as observacao,
  c.qtd as vendas_no_caixa,
  c.valor as valor_caixa,
  'deve ser igual a' as comparacao,
  c.qtd as vendas_com_filtro_pagamento,
  c.valor as valor_com_filtro_pagamento
FROM (
  SELECT 
    COUNT(*) as qtd,
    SUM(v.total_liquido) as valor
  FROM vendas v
  LEFT JOIN devolucoes d ON d.id_venda = v.id
  WHERE v.data_pagamento::date = '2025-10-29'
    AND (
      v.status_pagamento = 'pago'
      OR (v.status_pagamento = 'devolvido' AND d.credito_aplicado = true)
    )
) c;
