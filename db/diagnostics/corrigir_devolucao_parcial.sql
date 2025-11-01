-- =====================================================
-- Script para Corrigir Devoluções Parciais
-- Data: 01/11/2025
-- Objetivo: Identificar e corrigir vendas que foram
--           marcadas como "devolvido" devido a devoluções
--           parciais, quando deveriam permanecer "pago"
-- =====================================================

-- PASSO 1: IDENTIFICAR VENDAS COM PROBLEMA
-- =========================================

SELECT 
  '=== VENDAS MARCADAS COMO DEVOLVIDAS (para análise) ===' as secao;

-- Lista todas as vendas com status "devolvido"
SELECT 
  v.id as venda_id,
  v.data_venda,
  v.data_pagamento,
  v.cliente_nome,
  v.total_liquido as valor_venda,
  v.status_pagamento,
  v.observacoes,
  d.id as devolucao_id,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  d.valor_credito_gerado,
  d.credito_aplicado,
  d.status as status_devolucao,
  CASE 
    WHEN d.tipo_devolucao = 'parcial' THEN 'PRECISA CORREÇÃO!'
    WHEN d.tipo_devolucao = 'total' THEN 'Correto'
    ELSE 'Sem devolução associada'
  END as situacao
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.status_pagamento = 'devolvido'
ORDER BY v.id DESC;

-- =====================================================
-- PASSO 2: IDENTIFICAR A VENDA ESPECÍFICA (R$ 1.540)
-- =====================================================

SELECT 
  '=== VENDA DE R$ 1.540,00 ===' as secao;

SELECT 
  v.id as venda_id,
  v.data_venda,
  v.cliente_nome,
  v.total_liquido,
  v.status_pagamento,
  d.id as devolucao_id,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  d.credito_aplicado
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.total_liquido = 1540.00
  AND v.status_pagamento = 'devolvido'
ORDER BY v.id DESC
LIMIT 5;

-- =====================================================
-- PASSO 3: SCRIPT DE CORREÇÃO MANUAL
-- =====================================================
-- IMPORTANTE: Revise os dados acima e ajuste o ID da venda
-- antes de executar o UPDATE abaixo!

SELECT 
  '=== COMANDOS DE CORREÇÃO (REVISAR ANTES DE EXECUTAR) ===' as secao;

-- Substitua 'VENDA_ID_AQUI' pelo ID real da venda
-- Exemplo de correção:

/*

-- 1. Verificar a devolução associada
SELECT * FROM devolucoes WHERE id_venda = VENDA_ID_AQUI;

-- 2. Se for devolução PARCIAL com crédito aplicado:
--    Restaurar status "pago" e manter valor original
UPDATE vendas 
SET 
  status_pagamento = 'pago',
  updated_at = NOW()
WHERE id = VENDA_ID_AQUI
  AND status_pagamento = 'devolvido';

-- 3. Se for devolução PARCIAL sem crédito:
--    Restaurar status "pago" e ajustar valor
UPDATE vendas 
SET 
  status_pagamento = 'pago',
  total_liquido = total_liquido, -- Manter valor atual (já foi ajustado?)
  updated_at = NOW()
WHERE id = VENDA_ID_AQUI
  AND status_pagamento = 'devolvido';

-- 4. Verificar o resultado
SELECT 
  v.id,
  v.total_liquido,
  v.status_pagamento,
  v.data_pagamento,
  d.tipo_devolucao,
  d.valor_total_devolvido
FROM vendas v
LEFT JOIN devolucoes d ON d.id_venda = v.id
WHERE v.id = VENDA_ID_AQUI;

*/

-- =====================================================
-- PASSO 4: CORREÇÃO EM LOTE (OPCIONAL)
-- =====================================================
-- Use este comando para corrigir TODAS as devoluções
-- parciais que foram marcadas incorretamente como devolvidas

SELECT 
  '=== CORREÇÃO EM LOTE (CUIDADO!) ===' as secao;

/*

-- ATENÇÃO: Este comando corrige todas as devoluções parciais
-- Revise a lista antes de executar!

-- Para devoluções parciais COM CRÉDITO:
-- (mantém status "pago" e valor original)
UPDATE vendas v
SET 
  status_pagamento = 'pago',
  updated_at = NOW()
FROM devolucoes d
WHERE d.id_venda = v.id
  AND v.status_pagamento = 'devolvido'
  AND d.tipo_devolucao = 'parcial'
  AND d.credito_aplicado = true
  AND d.status = 'concluida_com_credito';

-- Verificar quantas foram atualizadas
SELECT COUNT(*) as corrigidas
FROM vendas v
INNER JOIN devolucoes d ON d.id_venda = v.id
WHERE v.status_pagamento = 'pago'
  AND d.tipo_devolucao = 'parcial'
  AND d.credito_aplicado = true;

*/

-- =====================================================
-- PASSO 5: VALIDAÇÃO FINAL
-- =====================================================

SELECT 
  '=== VALIDAÇÃO: Devoluções Parciais vs Status ===' as secao;

-- Deve retornar 0 linhas (nenhuma devolução parcial com status devolvido)
SELECT 
  v.id as venda_id,
  v.total_liquido,
  v.status_pagamento as status_atual,
  d.tipo_devolucao,
  d.valor_total_devolvido,
  'ERRO: Devolução parcial não deve marcar venda como devolvida!' as problema
FROM vendas v
INNER JOIN devolucoes d ON d.id_venda = v.id
WHERE v.status_pagamento = 'devolvido'
  AND d.tipo_devolucao = 'parcial';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
