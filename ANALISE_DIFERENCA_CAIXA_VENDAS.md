# Análise da Diferença: Caixa vs Vendas

## 📊 Situação Reportada

**Período analisado:** 28/10/2025 a 31/10/2025

| Fonte | Valor |
|-------|-------|
| **Caixa** (soma dos valores) | R$ 19.398,25 |
| **Vendas** (Faturamento) | R$ 18.310,75 |
| **Diferença** | R$ 1.087,50 |

---

## 🔍 Causas Identificadas

### 1. **Vendas com Status "Devolvido"** ⚠️ (Causa Mais Provável)

**Comportamento atual:**
- ✅ **Caixa**: INCLUI vendas com status `devolvido` (se tiverem `data_pagamento` no período)
- ❌ **Vendas**: NÃO inclui no faturamento (conta apenas status `pago`)

**Código do Caixa:**
```typescript
// app/sistema/caixa/page.tsx linha 298
if (v.status_pagamento === "cancelado") return false;
// ^ Exclui APENAS canceladas, inclui TODAS as outras (inclusive devolvido)
```

**Código de Vendas:**
```typescript
// app/sistema/vendas/page.tsx linha 977
const faturamento = filtered
  .filter((v) => computeStatus(v) === "pago")
  .reduce((acc, v) => acc + (Number(v.total_liquido) || 0), 0);
// ^ Conta APENAS status 'pago', exclui devolvido
```

**Impacto:**
Se você tiver vendas devolvidas no período (com `data_pagamento` entre 28-31/10), elas estarão inflando o valor do Caixa mas não aparecendo no Faturamento de Vendas.

---

### 2. **Vendas Antigas Pagas no Período**

**Comportamento:**
- Vendas criadas ANTES de 28/10 mas pagas DURANTE 28-31/10
- Aparecem no Caixa (filtro por `data_pagamento`)
- NÃO aparecem em Vendas (filtro por `data_venda`)

**Exemplo:**
```
Venda #123
├─ Criada em: 20/10/2025
├─ Paga em: 29/10/2025 ✅
├─ Valor: R$ 500,00
├─ Aparece no Caixa? SIM (paga em 29/10)
└─ Aparece em Vendas filtradas 28-31/10? NÃO (criada em 20/10)
```

---

## 🧪 Como Diagnosticar

Execute o script SQL de diagnóstico que criei:

```bash
# Arquivo: db/diagnostics/comparacao_caixa_vendas.sql
# Execute no Supabase SQL Editor ou via psql
```

Esse script vai mostrar:
1. ✅ Total de vendas em cada categoria
2. ✅ Vendas antigas pagas no período
3. ✅ Vendas devolvidas
4. ✅ Cálculo detalhado da diferença
5. ✅ Lista das 20 vendas que causam a discrepância

---

## 🎯 Soluções

### Opção 1: Alinhar Comportamento (Recomendada)

**Fazer Caixa e Vendas tratarem "devolvido" da mesma forma.**

#### 1A. Excluir "devolvido" do Caixa (mais conservador)

```typescript
// Em app/sistema/caixa/page.tsx
const vendasHoje =
  (vendasData || []).filter((v: Venda) => {
    if (!v.data_pagamento) return false;
    if (v.status_pagamento === "cancelado") return false;
    if (v.status_pagamento === "devolvido") return false; // 👈 ADICIONAR
    const dataPagamento = getDateStringInBrazil(v.data_pagamento);
    return dataPagamento === hoje;
  }) || [];
```

**Vantagens:**
- ✅ Números do Caixa e Vendas vão bater
- ✅ Vendas devolvidas não inflam o faturamento

**Desvantagens:**
- ⚠️ Caixa não mostrará devoluções (pode ser o correto financeiramente)

---

#### 1B. Incluir "devolvido" no Faturamento de Vendas

```typescript
// Em app/sistema/vendas/page.tsx
const faturamento = filtered
  .filter((v) => {
    const status = computeStatus(v);
    return status === "pago" || status === "devolvido"; // 👈 ADICIONAR
  })
  .reduce((acc, v) => acc + (Number(v.total_liquido) || 0), 0);
```

**Vantagens:**
- ✅ Números vão bater
- ✅ Mostra valor total processado (incluindo devoluções)

**Desvantagens:**
- ⚠️ Pode inflar artificialmente o faturamento se devoluções forem frequentes

---

### Opção 2: Criar Seção Separada no Faturamento

Mostrar separadamente:
- **Faturamento (pago)**: R$ 18.310,75
- **Devoluções**: R$ 1.087,50
- **Total Movimentado**: R$ 19.398,25

**Implementação:**
```typescript
const stats = useMemo(() => {
  const count = filtered.length;
  const faturamento = filtered
    .filter((v) => computeStatus(v) === "pago")
    .reduce((acc, v) => acc + (Number(v.total_liquido) || 0), 0);
  
  const devolucoes = filtered
    .filter((v) => computeStatus(v) === "devolvido")
    .reduce((acc, v) => acc + (Number(v.total_liquido) || 0), 0);
  
  const totalMovimentado = faturamento + devolucoes;
  
  // ... resto do código
  
  return { 
    count, 
    faturamento, 
    devolucoes, 
    totalMovimentado, 
    pagas, 
    vencidas, 
    receber, 
    ticket 
  };
}, [filtered]);
```

**Vantagens:**
- ✅ Transparência total
- ✅ Usuário entende de onde vem cada valor
- ✅ Caixa e Vendas podem ter valores diferentes mas justificados

---

## 💡 Recomendação Final

**Para seu caso específico:**

1. **Execute o script de diagnóstico** para confirmar:
   ```sql
   -- db/diagnostics/comparacao_caixa_vendas.sql
   ```

2. **Se a diferença for de vendas devolvidas:**
   - Recomendo **Opção 1A** (excluir devolvidas do Caixa)
   - Ou **Opção 2** (mostrar separadamente)

3. **Se a diferença for de vendas antigas:**
   - Isso é esperado e normal
   - Use a documentação já criada (`DIFERENCA_CAIXA_VENDAS.md`)

---

## 📝 Próximos Passos

1. [ ] Executar script de diagnóstico
2. [ ] Identificar se são devoluções ou vendas antigas
3. [ ] Escolher uma das opções de solução
4. [ ] Implementar a mudança escolhida
5. [ ] Testar com o mesmo período (28-31/10)
6. [ ] Validar que os números agora batem

---

**Data:** 01/11/2025  
**Diferença atual:** R$ 1.087,50  
**Status:** Aguardando diagnóstico detalhado
