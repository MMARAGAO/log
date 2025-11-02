-- Script para verificar se vendas_pagamentos está populada corretamente
-- Para as vendas #283 e #239 mencionadas pelo usuário

SELECT 
    v.id as venda_id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido as valor_total_venda,
    v.forma_pagamento as forma_venda_campo,
    v.status_pagamento,
    '---' as separador,
    vp.id as pagamento_id,
    vp.forma as forma_pagamento,
    vp.valor as valor_pagamento,
    vp.created_at as data_registro_pagamento
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.id IN (283, 239)
ORDER BY v.id, vp.id;

-- Verificar se a soma dos pagamentos bate com o total da venda
SELECT 
    v.id,
    v.total_liquido as total_venda,
    COALESCE(SUM(vp.valor), 0) as soma_pagamentos,
    v.total_liquido - COALESCE(SUM(vp.valor), 0) as diferenca
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE v.id IN (283, 239)
GROUP BY v.id, v.total_liquido;

-- Ver todas as vendas do dia 01/11/2025
SELECT 
    v.id,
    v.data_venda,
    v.cliente_nome,
    v.total_liquido,
    v.forma_pagamento,
    COUNT(vp.id) as qtd_pagamentos,
    STRING_AGG(vp.forma || ': R$ ' || vp.valor::text, ' + ') as detalhes_pagamento
FROM vendas v
LEFT JOIN vendas_pagamentos vp ON vp.venda_id = v.id
WHERE DATE(v.data_venda AT TIME ZONE 'America/Sao_Paulo') = '2025-11-01'
    AND v.status_pagamento = 'pago'
GROUP BY v.id, v.data_venda, v.cliente_nome, v.total_liquido, v.forma_pagamento
ORDER BY v.id;
