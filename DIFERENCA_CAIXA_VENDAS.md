# Diferença entre Caixa e Vendas - Documentação

## 🔍 Por que os números do Caixa e da página Vendas são diferentes?

### Conceitos Fundamentais

O sistema usa dois campos de data diferentes para cada venda:

1. **`data_venda`**: Data em que a venda foi **criada/registrada** no sistema
2. **`data_pagamento`**: Data em que o pagamento foi **efetivamente recebido**

---

## 📊 Como cada tela filtra e calcula

### Página **CAIXA** (dia 31/10/2025)

**Filtro usado:** `data_pagamento === '2025-10-31'`

**O que aparece:**

- ✅ Vendas que **receberam pagamento** no dia 31/10/2025
- ✅ Inclui vendas criadas em dias anteriores mas pagas no dia 31/10
- ✅ Inclui devoluções com crédito aplicado no dia 31/10 (quando `data_pagamento` foi atualizada)
- ❌ Exclui vendas criadas no dia 31/10 mas ainda não pagas
- ❌ Exclui vendas criadas no dia 31/10 e pagas em dias posteriores

**Objetivo:** Mostrar **quanto dinheiro efetivamente entrou no caixa naquele dia**

**Exemplo do seu caso:**

```
Dinheiro: R$ 90,00
PIX: R$ 6.565,00
─────────────────
TOTAL: R$ 6.655,00 ✅ (dinheiro que entrou no caixa no dia 31/10)
```

---

### Página **VENDAS** (filtro: 31/10 a 31/10)

**Filtro usado:** `data_venda >= '2025-10-31' AND data_venda <= '2025-10-31T23:59:59'`

**O que aparece:**

- ✅ Todas as vendas **criadas** no dia 31/10/2025
- ✅ Inclui vendas ainda não pagas (status: pendente)
- ✅ Inclui vendas que serão pagas em dias futuros
- ❌ Exclui vendas criadas em outros dias (mesmo que tenham sido pagas no dia 31/10)

**Cálculos:**

- **Faturamento**: Soma apenas vendas com `status_pagamento === 'pago'`
- **A Receber**: Soma `valor_restante` de todas as vendas do período (incluindo pendentes)

**Exemplo do seu caso:**

```
Vendas criadas no dia 31/10:
├─ Faturamento (pagas): R$ 2.945,00 ✅
├─ A Receber (pendentes): R$ 7.540,00 ⏳
└─ Total geral: R$ 10.485,00
```

---

## 🧮 Por que há diferença?

### Cenário Real do seu caso (31/10/2025):

| Origem                   | Valor       | Explicação                                                                 |
| ------------------------ | ----------- | -------------------------------------------------------------------------- |
| **Caixa**                | R$ 6.655,00 | Pagamentos recebidos no dia 31/10 (pode incluir vendas de dias anteriores) |
| **Vendas (Faturamento)** | R$ 2.945,00 | Vendas criadas E pagas no dia 31/10                                        |
| **Vendas (A Receber)**   | R$ 7.540,00 | Vendas criadas no dia 31/10 mas ainda não pagas                            |

### Possíveis explicações para a diferença:

1. **Vendas antigas pagas hoje:**

   - Vendas criadas antes do dia 31/10 que foram pagas no dia 31/10
   - Aparecem no Caixa (✅) mas não nas Vendas filtradas por data de criação (❌)
   - Valor estimado: R$ 3.710,00 (diferença entre 6.655 e 2.945)

2. **Vendas criadas hoje mas ainda não pagas:**

   - Vendas criadas no dia 31/10 que ainda não receberam pagamento
   - Aparecem nas Vendas como "A Receber" (R$ 7.540,00)
   - Não aparecem no Caixa até serem pagas

3. **Vendas criadas hoje e que serão pagas futuramente:**
   - Quando essas vendas forem pagas, aparecerão no Caixa do dia do pagamento
   - Exemplo: venda criada em 31/10 paga em 05/11 → aparece no Caixa do dia 05/11

---

## ✅ Qual relatório usar?

### Use o **CAIXA** quando quiser saber:

- 💰 Quanto dinheiro entrou no caixa em um dia específico
- 📊 Fluxo de caixa real (entradas efetivas)
- 💵 Conciliação bancária
- 🧾 Fechamento diário de caixa

### Use **VENDAS** quando quiser saber:

- 📈 Quantas vendas foram criadas/geradas em um período
- 🎯 Performance de vendas (criação de novos negócios)
- ⏳ Quanto ainda está pendente de recebimento
- 📅 Vendas vencidas que precisam cobrança

---

## 🔧 Como fazer os números baterem?

Se você quer que os números sejam iguais, você precisa garantir que:

1. **Todas as vendas do período foram pagas no mesmo período**

   - Filtro Vendas: 31/10 a 31/10
   - Todas essas vendas devem ter `data_pagamento` também em 31/10

2. **Nenhuma venda de outros períodos foi paga no dia filtrado**
   - Se vendas antigas foram pagas no dia 31/10, elas aparecerão no Caixa mas não nas Vendas

---

## 💡 Recomendação

Para análise financeira correta:

```
FATURAMENTO REAL = Caixa (data_pagamento)
VENDAS GERADAS = Vendas (data_venda)
RECEBIMENTOS FUTUROS = A Receber (valor_restante > 0)
```

**Relatório completo do dia 31/10:**

- Vendas criadas: R$ 10.485,00 (2.945 pagas + 7.540 a receber)
- Dinheiro recebido: R$ 6.655,00 (pode incluir vendas de dias anteriores)
- Diferença provável: R$ 3.710,00 em vendas antigas pagas hoje

---

## 📝 Próximos Passos

Se você precisar de um relatório que mostre exatamente o que compõe cada número:

1. **Relatório "Vendas Pagas no Período":**

   - Filtrar vendas por `data_pagamento` (igual ao Caixa)
   - Listar todas as vendas com suas datas de criação e pagamento

2. **Relatório "Conciliação":**
   - Mostrar vendas criadas vs vendas pagas
   - Identificar vendas antigas pagas no período
   - Identificar vendas novas ainda pendentes

---

**Data da documentação:** 01/11/2025  
**Versão do sistema:** 1.0  
**Autor:** Sistema Log - Gestão de Vendas
