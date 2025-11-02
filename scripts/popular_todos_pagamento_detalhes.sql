    -- Script para popular pagamento_detalhes para TODAS as vendas
    -- Data: 2025-11-02
    -- Descrição: Garante que todas as vendas tenham pagamento_detalhes populado,
    --            seja de pagamentos múltiplos (observacoes) ou únicos (forma_pagamento)

    -- ========================================
    -- 1. ANÁLISE: Ver vendas sem pagamento_detalhes
    -- ========================================
    SELECT 
        forma_pagamento,
        COUNT(*) as quantidade
    FROM vendas
    WHERE pagamento_detalhes IS NULL
    GROUP BY forma_pagamento
    ORDER BY quantidade DESC;

    -- ========================================
    -- 2. POPULAR pagamento_detalhes para vendas com pagamento ÚNICO
    -- ========================================
    UPDATE vendas
    SET pagamento_detalhes = jsonb_build_object(
        LOWER(
            CASE 
                WHEN forma_pagamento = 'dinheiro' THEN 'dinheiro'
                WHEN forma_pagamento = 'pix' THEN 'pix'
                WHEN forma_pagamento IN ('credito', 'crédito', 'cartao_credito', 'Cartão de Crédito') THEN 'credito'
                WHEN forma_pagamento IN ('debito', 'débito', 'cartao_debito', 'Cartão de Débito') THEN 'debito'
                WHEN forma_pagamento = 'carteira_digital' THEN 'carteira_digital'
                WHEN forma_pagamento IN ('transferencia', 'transferência') THEN 'transferencia'
                WHEN forma_pagamento = 'boleto' THEN 'boleto'
                WHEN forma_pagamento = 'crediario' THEN 'crediario'
                WHEN forma_pagamento = 'fiado' THEN 'fiado'
                ELSE LOWER(forma_pagamento)
            END
        ),
        total_liquido
    )
    WHERE pagamento_detalhes IS NULL
        AND forma_pagamento IS NOT NULL
        AND forma_pagamento NOT IN ('', 'misto', 'multiplo', 'múltiplo');

    -- ========================================
    -- 3. VERIFICAÇÃO: Conferir resultados
    -- ========================================
    SELECT 
        id,
        cliente_nome,
        total_liquido,
        forma_pagamento,
        pagamento_detalhes,
        -- Soma dos valores
        (SELECT SUM(value::numeric) 
        FROM jsonb_each_text(pagamento_detalhes)) as soma_detalhes,
        -- Diferença
        total_liquido - (SELECT SUM(value::numeric) 
                        FROM jsonb_each_text(pagamento_detalhes)) as diferenca
    FROM vendas
    WHERE pagamento_detalhes IS NOT NULL
    ORDER BY id DESC
    LIMIT 30;

    -- ========================================
    -- 4. ESTATÍSTICAS COMPLETAS
    -- ========================================
    SELECT 
        'Total de vendas' as tipo,
        COUNT(*) as quantidade
    FROM vendas

    UNION ALL

    SELECT 
        'Vendas COM pagamento_detalhes' as tipo,
        COUNT(*) as quantidade
    FROM vendas
    WHERE pagamento_detalhes IS NOT NULL

    UNION ALL

    SELECT 
        'Vendas SEM pagamento_detalhes' as tipo,
        COUNT(*) as quantidade
    FROM vendas
    WHERE pagamento_detalhes IS NULL

    UNION ALL

    SELECT 
        'Vendas com pagamento único' as tipo,
        COUNT(*) as quantidade
    FROM (
        SELECT 
            id,
            (SELECT COUNT(*) FROM jsonb_object_keys(pagamento_detalhes)) as num_formas
        FROM vendas
        WHERE pagamento_detalhes IS NOT NULL
    ) sub
    WHERE num_formas = 1

    UNION ALL

    SELECT 
        'Vendas com pagamento múltiplo' as tipo,
        COUNT(*) as quantidade
    FROM (
        SELECT 
            id,
            (SELECT COUNT(*) FROM jsonb_object_keys(pagamento_detalhes)) as num_formas
        FROM vendas
        WHERE pagamento_detalhes IS NOT NULL
    ) sub
    WHERE num_formas > 1;

    -- ========================================
    -- 5. VERIFICAR VENDAS COM DIFERENÇA (> R$ 0,10)
    -- ========================================
    SELECT 
        id,
        cliente_nome,
        total_liquido,
        forma_pagamento,
        pagamento_detalhes,
        (SELECT SUM(value::numeric) 
        FROM jsonb_each_text(pagamento_detalhes)) as soma_detalhes,
        ABS(total_liquido - (SELECT SUM(value::numeric) 
                            FROM jsonb_each_text(pagamento_detalhes))) as diferenca
    FROM vendas
    WHERE pagamento_detalhes IS NOT NULL
        AND ABS(total_liquido - (SELECT SUM(value::numeric) 
                                FROM jsonb_each_text(pagamento_detalhes))) > 0.10
    ORDER BY diferenca DESC;

    -- ========================================
    -- 6. DISTRIBUIÇÃO POR FORMA DE PAGAMENTO
    -- ========================================
    SELECT 
        key as forma_pagamento,
        COUNT(*) as quantidade_vendas,
        SUM(value::numeric) as total_valor
    FROM vendas,
        jsonb_each_text(pagamento_detalhes)
    WHERE pagamento_detalhes IS NOT NULL
    GROUP BY key
    ORDER BY total_valor DESC;

    COMMIT;
