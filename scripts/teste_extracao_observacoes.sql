-- Script de TESTE - Verificar extração de dados antes de aplicar
-- Execute este primeiro para ver se está capturando corretamente

-- ========================================
-- 1. Ver exemplos reais de observações
-- ========================================
SELECT 
    id,
    total_liquido,
    forma_pagamento,
    observacoes
FROM vendas
WHERE observacoes IS NOT NULL
    AND (observacoes LIKE '%Dinheiro:%' 
         OR observacoes LIKE '%PIX:%'
         OR observacoes LIKE '%Crédito:%'
         OR observacoes LIKE '%Débito:%')
ORDER BY data_venda DESC
LIMIT 10;

-- ========================================
-- 2. Teste de extração manual para uma venda específica
-- ========================================
-- Exemplo: "02/11/2025 - Ramona Kawana da Silva Barreto de Miranda : Pagamento R$ 10,00 (Dinheiro: R$ 5,00; PIX: R$ 5,00)"

WITH teste AS (
    SELECT 
        id,
        observacoes,
        -- Extrair Dinheiro
        (regexp_match(observacoes, 'Dinheiro:\s*R\$\s*([\d.,]+)'))[1] as dinheiro_texto,
        -- Extrair PIX
        (regexp_match(observacoes, 'PIX:\s*R\$\s*([\d.,]+)'))[1] as pix_texto,
        -- Extrair Crédito
        (regexp_match(observacoes, 'Crédito:\s*R\$\s*([\d.,]+)'))[1] as credito_texto,
        -- Extrair Débito
        (regexp_match(observacoes, 'Débito:\s*R\$\s*([\d.,]+)'))[1] as debito_texto
    FROM vendas
    WHERE observacoes LIKE '%Dinheiro:%' 
       OR observacoes LIKE '%PIX:%'
    LIMIT 5
)
SELECT 
    id,
    observacoes,
    dinheiro_texto,
    pix_texto,
    credito_texto,
    debito_texto,
    -- Converter para números
    CASE 
        WHEN dinheiro_texto IS NOT NULL 
        THEN replace(replace(dinheiro_texto, '.', ''), ',', '.')::numeric 
        ELSE 0 
    END as dinheiro_valor,
    CASE 
        WHEN pix_texto IS NOT NULL 
        THEN replace(replace(pix_texto, '.', ''), ',', '.')::numeric 
        ELSE 0 
    END as pix_valor,
    CASE 
        WHEN credito_texto IS NOT NULL 
        THEN replace(replace(credito_texto, '.', ''), ',', '.')::numeric 
        ELSE 0 
    END as credito_valor,
    CASE 
        WHEN debito_texto IS NOT NULL 
        THEN replace(replace(debito_texto, '.', ''), ',', '.')::numeric 
        ELSE 0 
    END as debito_valor
FROM teste;

-- ========================================
-- 3. Teste de construção do JSON
-- ========================================
WITH teste AS (
    SELECT 
        id,
        total_liquido,
        observacoes,
        COALESCE(
            (regexp_match(observacoes, 'Dinheiro:\s*R\$\s*([\d.,]+)'))[1],
            '0'
        ) as dinheiro_texto,
        COALESCE(
            (regexp_match(observacoes, 'PIX:\s*R\$\s*([\d.,]+)'))[1],
            '0'
        ) as pix_texto,
        COALESCE(
            (regexp_match(observacoes, 'Crédito:\s*R\$\s*([\d.,]+)'))[1],
            '0'
        ) as credito_texto
    FROM vendas
    WHERE observacoes LIKE '%Dinheiro:%' 
       OR observacoes LIKE '%PIX:%'
    LIMIT 5
),
valores AS (
    SELECT 
        id,
        total_liquido,
        observacoes,
        replace(replace(dinheiro_texto, '.', ''), ',', '.')::numeric as dinheiro,
        replace(replace(pix_texto, '.', ''), ',', '.')::numeric as pix,
        replace(replace(credito_texto, '.', ''), ',', '.')::numeric as credito
    FROM teste
)
SELECT 
    id,
    total_liquido,
    dinheiro,
    pix,
    credito,
    -- Construir o JSON
    jsonb_strip_nulls(
        jsonb_build_object(
            'dinheiro', NULLIF(dinheiro, 0),
            'pix', NULLIF(pix, 0),
            'credito', NULLIF(credito, 0)
        )
    ) as pagamento_detalhes_proposto,
    -- Verificar soma
    dinheiro + pix + credito as soma_calculada,
    total_liquido - (dinheiro + pix + credito) as diferenca,
    observacoes
FROM valores;
