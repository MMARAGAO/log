-- Script para investigar vendas com múltiplos pagamentos
-- Autor: GitHub Copilot
-- Data: 2025-11-02

-- ========================================
-- 1. Verificar estrutura da tabela vendas
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'vendas'
    AND column_name IN ('forma_pagamento', 'pagamento_detalhes', 'total_liquido', 'id')
ORDER BY ordinal_position;

-- ========================================
-- 2. Verificar vendas com múltiplos pagamentos
-- ========================================
SELECT 
    v.id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido,
    v.forma_pagamento,
    v.status_pagamento,
    -- Contar quantas formas de pagamento diferentes
    COUNT(vp.id) as qtd_pagamentos,
    -- Listar as formas
    STRING_AGG(vp.forma || ': ' || vp.valor::text, ' | ') as detalhes_pagamento
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.data_venda >= CURRENT_DATE - INTERVAL '7 days'
    AND v.status_pagamento = 'pago'
GROUP BY v.id, v.data_venda, v.cliente_nome, v.total_liquido, v.forma_pagamento, v.status_pagamento
HAVING COUNT(vp.id) > 1
ORDER BY v.data_venda DESC
LIMIT 20;

-- ========================================
-- 3. Exemplo de venda com pagamento único
-- ========================================
SELECT 
    v.id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido,
    v.forma_pagamento,
    COUNT(vp.id) as qtd_pagamentos,
    STRING_AGG(vp.forma || ': R$ ' || vp.valor::text, ' + ') as detalhes
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.data_venda >= CURRENT_DATE - INTERVAL '7 days'
    AND v.status_pagamento = 'pago'
GROUP BY v.id, v.data_venda, v.cliente_nome, v.total_liquido, v.forma_pagamento
HAVING COUNT(vp.id) = 1
ORDER BY v.data_venda DESC
LIMIT 5;

-- ========================================
-- 4. Verificar vendas SEM registros em vendas_pagamentos
-- ========================================
SELECT 
    v.id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido,
    v.forma_pagamento,
    v.status_pagamento
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.data_venda >= CURRENT_DATE - INTERVAL '7 days'
    AND v.status_pagamento = 'pago'
    AND vp.id IS NULL
ORDER BY v.data_venda DESC
LIMIT 10;

-- ========================================
-- 5. Análise completa de uma venda específica
-- (Substitua 283 pelo ID da venda que você mencionou)
-- ========================================
SELECT 
    'Venda Principal' as tipo,
    v.id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido as valor,
    v.forma_pagamento,
    v.status_pagamento,
    NULL as forma_especifica,
    NULL as valor_especifico
FROM vendas v
WHERE v.id = 283

UNION ALL

SELECT 
    'Pagamento' as tipo,
    v.id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido as valor,
    v.forma_pagamento,
    v.status_pagamento,
    vp.forma as forma_especifica,
    vp.valor as valor_especifico
FROM vendas v
INNER JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.id = 283;

-- ========================================
-- 6. Resumo: Quantas vendas têm múltiplos pagamentos?
-- ========================================
WITH contagem_pagamentos AS (
    SELECT 
        v.id,
        v.forma_pagamento,
        COUNT(vp.id) as qtd_formas
    FROM vendas v
    LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
    WHERE v.data_venda >= CURRENT_DATE - INTERVAL '30 days'
        AND v.status_pagamento = 'pago'
    GROUP BY v.id, v.forma_pagamento
)
SELECT 
    CASE 
        WHEN qtd_formas = 0 THEN 'Sem vendas_pagamentos'
        WHEN qtd_formas = 1 THEN 'Pagamento único'
        ELSE 'Múltiplos pagamentos'
    END as tipo,
    COUNT(*) as quantidade,
    ROUND(AVG(qtd_formas), 2) as media_formas
FROM contagem_pagamentos
GROUP BY 
    CASE 
        WHEN qtd_formas = 0 THEN 'Sem vendas_pagamentos'
        WHEN qtd_formas = 1 THEN 'Pagamento único'
        ELSE 'Múltiplos pagamentos'
    END
ORDER BY quantidade DESC;

-- ========================================
-- 7. Verificar se forma_pagamento = 'misto' indica múltiplos
-- ========================================
SELECT 
    v.id,
    v.forma_pagamento,
    COUNT(vp.id) as qtd_pagamentos_registrados,
    STRING_AGG(vp.forma, ', ') as formas_registradas
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.data_venda >= CURRENT_DATE - INTERVAL '30 days'
    AND v.status_pagamento = 'pago'
    AND LOWER(v.forma_pagamento) IN ('misto', 'múltiplo', 'multiplo')
GROUP BY v.id, v.forma_pagamento
ORDER BY v.id DESC
LIMIT 20;
