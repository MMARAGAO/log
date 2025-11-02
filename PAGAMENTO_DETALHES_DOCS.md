# Coluna pagamento_detalhes - Documentação

## 📋 Visão Geral

A coluna `pagamento_detalhes` do tipo JSONB foi adicionada à tabela `vendas` para armazenar informações detalhadas sobre vendas com múltiplas formas de pagamento.

## 🗄️ Estrutura

### Tipo de Dados

- **Tipo**: JSONB
- **Nullable**: Sim (NULL para vendas com pagamento único)
- **Default**: NULL

### Formato do JSON

```json
{
  "pix": 150.0,
  "dinheiro": 100.0,
  "credito": 50.0
}
```

## 📝 Quando Usar

### Venda com Pagamento Único

- **forma_pagamento**: "pix"
- **pagamento_detalhes**: NULL (ou não precisa preencher)

### Venda com Múltiplos Pagamentos

- **forma_pagamento**: "misto"
- **pagamento_detalhes**: `{"pix": 150, "dinheiro": 100}`

## 🔑 Chaves Padronizadas

Use sempre as chaves em **minúsculas** para consistência:

| Chave              | Descrição                                       |
| ------------------ | ----------------------------------------------- |
| `dinheiro`         | Pagamento em dinheiro                           |
| `pix`              | Pagamento via PIX                               |
| `debito`           | Cartão de débito                                |
| `credito`          | Cartão de crédito                               |
| `carteira_digital` | Carteiras digitais (Apple Pay, Google Pay, etc) |
| `transferencia`    | Transferência bancária                          |
| `boleto`           | Boleto bancário                                 |
| `crediario`        | Crediário da loja                               |
| `fiado`            | Venda fiada                                     |

## 💻 Exemplos de Uso

### 1. Inserir Venda com Múltiplos Pagamentos

```typescript
// No frontend (React/Next.js)
const venda = {
  cliente_nome: "João Silva",
  total_liquido: 300,
  forma_pagamento: "misto",
  pagamento_detalhes: {
    pix: 150,
    dinheiro: 150,
  },
  status_pagamento: "pago",
  data_pagamento: new Date().toISOString(),
};

await insertTable("vendas", venda);
```

### 2. Consultar Vendas com Pagamentos Múltiplos

```sql
-- Ver todas as vendas com múltiplos pagamentos
SELECT
  id,
  cliente_nome,
  total_liquido,
  forma_pagamento,
  pagamento_detalhes
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
ORDER BY data_venda DESC;
```

### 3. Extrair Valor de uma Forma Específica

```sql
-- Ver quanto foi pago via PIX
SELECT
  id,
  cliente_nome,
  pagamento_detalhes->>'pix' as valor_pix
FROM vendas
WHERE pagamento_detalhes ? 'pix';
```

### 4. Somar Total por Forma de Pagamento

```sql
-- Total de cada forma no período
SELECT
  key as forma_pagamento,
  SUM(value::numeric) as total,
  COUNT(*) as quantidade_vendas
FROM vendas v,
  jsonb_each_text(v.pagamento_detalhes)
WHERE v.data_venda >= CURRENT_DATE - INTERVAL '30 days'
  AND v.status_pagamento = 'pago'
GROUP BY key
ORDER BY total DESC;
```

## 🔄 Migração de Dados

Se você já tem dados em `vendas_pagamentos`, execute o script de migração:

```sql
-- Migrar dados de vendas_pagamentos para pagamento_detalhes
WITH pagamentos_agrupados AS (
  SELECT
    venda_id,
    jsonb_object_agg(
      LOWER(forma),
      valor
    ) as detalhes
  FROM vendas_pagamentos
  GROUP BY venda_id
)
UPDATE vendas v
SET pagamento_detalhes = pa.detalhes
FROM pagamentos_agrupados pa
WHERE v.id = pa.venda_id
  AND v.pagamento_detalhes IS NULL;
```

## ✅ Validação

### Verificar Consistência

```sql
-- Verificar se a soma dos pagamentos bate com o total
SELECT
  id,
  total_liquido,
  (SELECT SUM(value::numeric)
   FROM jsonb_each_text(pagamento_detalhes)) as soma_pagamentos,
  total_liquido - (SELECT SUM(value::numeric)
                   FROM jsonb_each_text(pagamento_detalhes)) as diferenca
FROM vendas
WHERE pagamento_detalhes IS NOT NULL
  AND ABS(total_liquido - (SELECT SUM(value::numeric)
                           FROM jsonb_each_text(pagamento_detalhes))) > 0.01;
```

## 🎯 Integração com Sistema

### Caixa (app/sistema/caixa/page.tsx)

O sistema de caixa agora processa automaticamente `pagamento_detalhes`:

- Vendas com múltiplas formas são distribuídas corretamente
- Cada forma aparece em sua categoria no relatório
- PDF exibe corretamente a partição dos pagamentos

### PDF Generator (components/caixa/CaixaPDFGenerator.tsx)

- Processa `pagamento_detalhes` automaticamente
- Agrupa vendas por forma de pagamento
- Mostra detalhes de pagamentos mistos

### Vendas (app/sistema/vendas/page.tsx)

- Ao criar venda com múltiplas formas, preencher `pagamento_detalhes`
- `forma_pagamento` deve ser "misto"
- Garantir que a soma dos valores em `pagamento_detalhes` = `total_liquido`

## 🚨 Importantes

1. **Sempre em minúsculas**: Use chaves em minúsculas para consistência
2. **Validação**: Soma de `pagamento_detalhes` deve ser = `total_liquido`
3. **forma_pagamento**: Quando houver múltiplos, usar "misto"
4. **Valores decimais**: Use `numeric` no Postgres para precisão
5. **NULL vs vazio**: NULL para pagamento único, objeto para múltiplos

## 📊 Benefícios

✅ **Simplicidade**: Uma coluna ao invés de tabela relacionada  
✅ **Performance**: Menos JOINs, dados já na venda  
✅ **Flexibilidade**: JSONB permite qualquer combinação  
✅ **Consultas**: Índice GIN permite buscas rápidas  
✅ **Manutenção**: Código mais limpo e direto

## 🔧 Troubleshooting

### Problema: Categoria "Múltiplo" ainda aparece

**Solução**: Verificar se `pagamento_detalhes` está preenchido corretamente

### Problema: Valores não batem

**Solução**: Verificar se a soma dos valores em `pagamento_detalhes` = `total_liquido`

### Problema: Chaves não reconhecidas

**Solução**: Usar chaves padronizadas em minúsculas (ver tabela acima)
