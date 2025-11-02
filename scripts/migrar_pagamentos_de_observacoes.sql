-- Script para migrar dados de pagamentos múltiplos da coluna observacoes para pagamento_detalhes
-- Data: 2025-11-02
-- Descrição: Extrai informações de pagamento da coluna observacoes e popula pagamento_detalhes

-- ========================================
-- 1. ANÁLISE: Ver exemplos de observações com pagamentos múltiplos
-- ========================================
SELECT 
    id,
    cliente_nome,
    total_liquido,
    forma_pagamento,
    observacoes,
    pagamento_detalhes
FROM vendas
WHERE observacoes LIKE '%Dinheiro:%' 
   OR observacoes LIKE '%PIX:%'
   OR observacoes LIKE '%Crédito:%'
   OR observacoes LIKE '%Débito:%'
ORDER BY id DESC
LIMIT 20;

-- ========================================
-- 2. FUNÇÃO AUXILIAR: Extrair valor de uma forma de pagamento
-- ========================================
CREATE OR REPLACE FUNCTION extrair_valor_pagamento(texto TEXT, forma TEXT)
RETURNS NUMERIC AS $$
DECLARE
    padrao TEXT;
    match TEXT;
    valor_texto TEXT;
    valor NUMERIC;
BEGIN
    -- Criar padrão de busca: "Forma: R$ 123,45"
    padrao := forma || ':\s*R\$\s*([\d.,]+)';
    
    -- Buscar o padrão no texto
    match := substring(texto FROM padrao);
    
    IF match IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Extrair apenas o número
    valor_texto := regexp_replace(match, forma || ':\s*R\$\s*', '');
    
    -- Remover pontos de milhar e substituir vírgula por ponto
    valor_texto := replace(valor_texto, '.', '');
    valor_texto := replace(valor_texto, ',', '.');
    
    -- Converter para numeric
    BEGIN
        valor := valor_texto::NUMERIC;
        RETURN valor;
    EXCEPTION WHEN OTHERS THEN
        RETURN 0;
    END;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. MIGRAÇÃO: Popular pagamento_detalhes com dados das observações
-- ========================================
WITH vendas_com_multiplos AS (
    SELECT 
        id,
        observacoes,
        -- Extrair valores de cada forma de pagamento
        extrair_valor_pagamento(observacoes, 'Dinheiro') as dinheiro,
        extrair_valor_pagamento(observacoes, 'PIX') as pix,
        extrair_valor_pagamento(observacoes, 'Crédito') as credito,
        extrair_valor_pagamento(observacoes, 'Débito') as debito,
        extrair_valor_pagamento(observacoes, 'Cartão de Crédito') as cartao_credito,
        extrair_valor_pagamento(observacoes, 'Cartão de Débito') as cartao_debito
    FROM vendas
    WHERE observacoes IS NOT NULL
        AND (observacoes LIKE '%Dinheiro:%' 
             OR observacoes LIKE '%PIX:%'
             OR observacoes LIKE '%Crédito:%'
             OR observacoes LIKE '%Débito:%')
        AND pagamento_detalhes IS NULL
),
pagamentos_json AS (
    SELECT 
        id,
        observacoes,
        jsonb_strip_nulls(
            jsonb_build_object(
                'dinheiro', NULLIF(dinheiro, 0),
                'pix', NULLIF(pix, 0),
                'credito', NULLIF(GREATEST(credito, cartao_credito), 0),
                'debito', NULLIF(GREATEST(debito, cartao_debito), 0)
            )
        ) as detalhes
    FROM vendas_com_multiplos
    WHERE dinheiro > 0 OR pix > 0 OR credito > 0 OR debito > 0 
       OR cartao_credito > 0 OR cartao_debito > 0
)
UPDATE vendas v
SET 
    pagamento_detalhes = pj.detalhes,
    forma_pagamento = CASE 
        WHEN pj.detalhes IS NOT NULL AND pj.detalhes != '{}'::jsonb THEN 'misto'
        ELSE v.forma_pagamento 
    END
FROM pagamentos_json pj
WHERE v.id = pj.id;

-- ========================================
-- 4. VERIFICAÇÃO: Conferir os resultados
-- ========================================
SELECT 
    id,
    cliente_nome,
    total_liquido,
    forma_pagamento,
    pagamento_detalhes,
    -- Calcular soma dos valores em pagamento_detalhes
    (SELECT SUM(value::numeric) 
     FROM jsonb_each_text(pagamento_detalhes)) as soma_detalhes,
    -- Diferença entre total e soma
    total_liquido - (SELECT SUM(value::numeric) 
                     FROM jsonb_each_text(pagamento_detalhes)) as diferenca,
    observacoes
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
ORDER BY id DESC
LIMIT 20;

-- ========================================
-- 5. VERIFICAR VENDAS COM DIFERENÇA
-- (Casos onde a soma não bate com o total)
-- ========================================
SELECT 
    id,
    total_liquido,
    pagamento_detalhes,
    (SELECT SUM(value::numeric) 
     FROM jsonb_each_text(pagamento_detalhes)) as soma_detalhes,
    ABS(total_liquido - (SELECT SUM(value::numeric) 
                         FROM jsonb_each_text(pagamento_detalhes))) as diferenca,
    observacoes
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
    AND ABS(total_liquido - (SELECT SUM(value::numeric) 
                             FROM jsonb_each_text(pagamento_detalhes))) > 0.10
ORDER BY diferenca DESC;

-- ========================================
-- 6. ESTATÍSTICAS: Quantas vendas foram migradas?
-- ========================================
SELECT 
    'Total de vendas' as tipo,
    COUNT(*) as quantidade
FROM vendas
WHERE data_venda >= CURRENT_DATE - INTERVAL '90 days'

UNION ALL

SELECT 
    'Vendas com pagamento_detalhes' as tipo,
    COUNT(*) as quantidade
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
    AND data_venda >= CURRENT_DATE - INTERVAL '90 days'

UNION ALL

SELECT 
    'Vendas com observações de pagamento' as tipo,
    COUNT(*) as quantidade
FROM vendas
WHERE observacoes LIKE '%Dinheiro:%' 
   OR observacoes LIKE '%PIX:%'
   OR observacoes LIKE '%Crédito:%'
   OR observacoes LIKE '%Débito:%';

-- ========================================
-- 7. LIMPEZA (OPCIONAL): Remover função auxiliar após uso
-- ========================================
-- DROP FUNCTION IF EXISTS extrair_valor_pagamento(TEXT, TEXT);

COMMIT;
