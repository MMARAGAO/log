# 🔄 Guia de Migração - Pagamentos Múltiplos

## 📋 Situação Atual

- ❌ Coluna `pagamento_detalhes` existe mas está vazia
- ❌ Tabela `vendas_pagamentos` está vazia
- ✅ Dados de pagamentos múltiplos estão na coluna `observacoes`
- ✅ Formato: `"02/11/2025 - Cliente : Pagamento R$ 10,00 (Dinheiro: R$ 5,00; PIX: R$ 5,00)"`

## 🎯 Objetivo

Extrair os valores de pagamento da coluna `observacoes` e popular `pagamento_detalhes` em formato JSON.

## 📝 Passo a Passo

### PASSO 1: Verificar os Dados (TESTE - NÃO MODIFICA NADA)

Execute o arquivo: `scripts/teste_extracao_observacoes.sql`

Este script vai:

- ✅ Mostrar exemplos reais das observações
- ✅ Testar a extração dos valores
- ✅ Validar se a soma bate com o total
- ✅ Mostrar como ficaria o JSON final

**Execute no Supabase SQL Editor e revise os resultados!**

### PASSO 2: Criar a Coluna (Se ainda não criou)

Execute o arquivo: `db/migrations/20251102_add_pagamento_detalhes_to_vendas.sql`

### PASSO 3: Migrar os Dados

Execute o arquivo: `scripts/migrar_pagamentos_de_observacoes.sql`

Este script vai:

1. Criar uma função auxiliar `extrair_valor_pagamento()`
2. Buscar todas as vendas com pagamentos múltiplos nas observações
3. Extrair os valores de cada forma de pagamento
4. Popular `pagamento_detalhes` com JSON correto
5. Atualizar `forma_pagamento` para "misto"
6. Validar os resultados
7. Mostrar estatísticas

### PASSO 4: Verificar Resultados

Execute estas queries:

```sql
-- Ver vendas migradas
SELECT
    id,
    cliente_nome,
    total_liquido,
    forma_pagamento,
    pagamento_detalhes
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
ORDER BY id DESC
LIMIT 20;

-- Verificar se há erros (soma diferente do total)
SELECT
    id,
    total_liquido,
    pagamento_detalhes,
    (SELECT SUM(value::numeric)
     FROM jsonb_each_text(pagamento_detalhes)) as soma,
    ABS(total_liquido - (SELECT SUM(value::numeric)
                         FROM jsonb_each_text(pagamento_detalhes))) as diferenca
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
    AND ABS(total_liquido - (SELECT SUM(value::numeric)
                             FROM jsonb_each_text(pagamento_detalhes))) > 0.10;
```

## ⚠️ Cuidados

1. **Backup**: Faça backup antes de executar a migração
2. **Teste**: Execute o PASSO 1 primeiro para validar
3. **Revise**: Confira se os valores extraídos estão corretos
4. **Diferenças**: Se houver diferenças entre soma e total, investigue

## 🔍 Formatos Reconhecidos

O script reconhece estes formatos na coluna `observacoes`:

- ✅ `Dinheiro: R$ 5,00`
- ✅ `PIX: R$ 5,00`
- ✅ `Crédito: R$ 10,00`
- ✅ `Débito: R$ 8,00`
- ✅ `Cartão de Crédito: R$ 10,00`
- ✅ `Cartão de Débito: R$ 8,00`

## 📊 Resultado Esperado

**Antes:**

```
observacoes: "02/11/2025 - Cliente : Pagamento R$ 10,00 (Dinheiro: R$ 5,00; PIX: R$ 5,00)"
pagamento_detalhes: null
forma_pagamento: null ou "dinheiro"
```

**Depois:**

```
observacoes: "02/11/2025 - Cliente : Pagamento R$ 10,00 (Dinheiro: R$ 5,00; PIX: R$ 5,00)"
pagamento_detalhes: {"dinheiro": 5.00, "pix": 5.00}
forma_pagamento: "misto"
```

## ✅ Validação Final

Execute após a migração:

```sql
-- Total de vendas com múltiplos pagamentos
SELECT COUNT(*)
FROM vendas
WHERE pagamento_detalhes IS NOT NULL;

-- Verificar se há problemas
SELECT
    'OK' as status,
    COUNT(*) as quantidade
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
    AND ABS(total_liquido - (SELECT SUM(value::numeric)
                             FROM jsonb_each_text(pagamento_detalhes))) <= 0.10

UNION ALL

SELECT
    'ERRO - Diferença' as status,
    COUNT(*) as quantidade
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
    AND ABS(total_liquido - (SELECT SUM(value::numeric)
                             FROM jsonb_each_text(pagamento_detalhes))) > 0.10;
```

## 🆘 Troubleshooting

### Problema: Valores não foram extraídos

**Causa**: Formato das observações diferente do esperado

**Solução**:

1. Execute o PASSO 1 (teste)
2. Veja exemplos reais
3. Ajuste o padrão regex no script de migração se necessário

### Problema: Soma não bate com total

**Causa**:

- Desconto não está sendo considerado
- Valores com formatação diferente
- Troco não está na observação

**Solução**:

1. Revise as vendas com diferença
2. Ajuste manualmente se necessário
3. Considere adicionar lógica para descontos

### Problema: Muitas vendas para migrar

**Solução**: Execute em lotes:

```sql
-- Migrar apenas últimos 30 dias
WHERE data_venda >= CURRENT_DATE - INTERVAL '30 days'
```

## 📞 Suporte

Se encontrar problemas:

1. Execute o script de teste
2. Envie exemplos das observações
3. Verifique se o padrão regex está correto
