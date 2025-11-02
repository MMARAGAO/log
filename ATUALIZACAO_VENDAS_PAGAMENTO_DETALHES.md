# Atualização: pagamento_detalhes em Vendas

## 📋 Resumo das Alterações

A tela de vendas agora popula automaticamente a coluna `pagamento_detalhes` tanto na **criação** quanto na **edição** de vendas, garantindo consistência com o sistema de Caixa.

---

## 🎯 O que foi implementado

### 1. **Interface `Venda`** atualizada

```typescript
interface Venda {
  // ... campos existentes
  pagamento_detalhes?: Record<string, number> | null; // NOVO
}
```

### 2. **Função de normalização** criada

```typescript
function normalizePaymentKey(forma: string): string;
```

- Converte formas de pagamento para chaves padronizadas
- Exemplos:
  - "Crédito", "crédito", "Cartão de Crédito" → `"credito"`
  - "PIX", "pix" → `"pix"`
  - "Dinheiro", "DINHEIRO" → `"dinheiro"`

### 3. **Criação de venda** (função `handleSubmitVenda`)

- Popula `pagamento_detalhes` com a forma de pagamento selecionada
- Exemplo: Se `forma_pagamento = "PIX"` e `total_liquido = 150`:
  ```json
  {
    "pix": 150.0
  }
  ```

### 4. **Edição de pagamento** (função `confirmarPagamento`)

- Popula `pagamento_detalhes` baseado nas linhas de pagamento múltiplo
- Exemplo: Pagamento misto (R$ 100 Dinheiro + R$ 50 PIX):
  ```json
  {
    "dinheiro": 100.0,
    "pix": 50.0
  }
  ```
- Atualiza `forma_pagamento` para `"misto"` quando houver múltiplas formas

---

## 📝 Comportamento

### Venda com Pagamento ÚNICO

```typescript
// Na criação/edição
forma_pagamento: "PIX"
pagamento_detalhes: {
  "pix": 150.00
}
```

### Venda com Pagamento MÚLTIPLO

```typescript
// Após registrar pagamento com 2+ formas
forma_pagamento: "misto"
pagamento_detalhes: {
  "dinheiro": 75.00,
  "pix": 75.00
}
```

---

## 🔄 Fluxo de Dados

### Criação de Venda

1. Usuário seleciona `forma_pagamento` (ex: "Dinheiro")
2. Sistema normaliza para chave: `normalizePaymentKey("Dinheiro")` → `"dinheiro"`
3. Popula: `pagamento_detalhes = { "dinheiro": total_liquido }`
4. Salva no banco de dados

### Edição - Pagamento Múltiplo

1. Usuário adiciona linhas de pagamento (ex: 2 formas)
2. Sistema itera sobre `pagamentoRows`
3. Para cada linha:
   - Normaliza forma: `normalizePaymentKey(row.forma)`
   - Extrai valor: `currencyToNumber(row.valorInput)`
   - Adiciona ao objeto: `pagamentoDetalhes[formaKey] = valor`
4. Atualiza `forma_pagamento = "misto"` se `pagamentoRows.length > 1`
5. Salva no banco de dados

---

## ✅ Vantagens

1. **Consistência**: Todas as vendas agora têm `pagamento_detalhes` populado
2. **Relatórios precisos**: Caixa pode calcular totais corretos por forma de pagamento
3. **Compatibilidade**: Funciona tanto para pagamentos únicos quanto múltiplos
4. **Normalização**: Formas de pagamento padronizadas (lowercase, sem acentos)

---

## 🧪 Testes Recomendados

### Teste 1: Venda com pagamento único

1. Criar nova venda
2. Selecionar forma: "PIX"
3. Salvar
4. ✅ Verificar: `pagamento_detalhes = {"pix": <valor>}`

### Teste 2: Venda com pagamento múltiplo

1. Criar nova venda com status "Pendente"
2. Abrir modal de pagamento
3. Adicionar 2 linhas: R$ 50 Dinheiro + R$ 50 PIX
4. Confirmar pagamento
5. ✅ Verificar:
   - `forma_pagamento = "misto"`
   - `pagamento_detalhes = {"dinheiro": 50, "pix": 50}`

### Teste 3: Edição de venda existente

1. Editar venda antiga (sem `pagamento_detalhes`)
2. Salvar
3. ✅ Verificar: `pagamento_detalhes` agora está populado

---

## 🔍 Validação SQL

```sql
-- Ver vendas recentes com pagamento_detalhes
SELECT
    id,
    cliente_nome,
    total_liquido,
    forma_pagamento,
    pagamento_detalhes,
    (SELECT SUM(value::numeric)
     FROM jsonb_each_text(pagamento_detalhes)) as soma
FROM vendas
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY id DESC
LIMIT 10;
```

---

## 📌 Próximos Passos

1. ✅ Executar script `popular_todos_pagamento_detalhes.sql` para migrar vendas antigas
2. ✅ Testar criação de novas vendas
3. ✅ Testar pagamentos múltiplos
4. ✅ Verificar relatório de Caixa (PDF)
