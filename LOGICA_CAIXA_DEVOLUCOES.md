# 💰 Lógica de Cálculo do Caixa com Devoluções

**Data:** 01/11/2025  
**Versão:** 2.0 - Alinhamento com Vendas

---

## 🎯 Objetivo

Garantir que **Caixa** e **Vendas** mostrem os **mesmos valores** quando filtrados pela mesma data, considerando corretamente as devoluções.

---

## 📊 Regra de Negócio

### O que entra no Caixa?

O Caixa mostra **apenas o dinheiro que realmente ficou na loja**:

| Situação | Status | Aparece no Caixa? | Motivo |
|----------|--------|-------------------|---------|
| ✅ Venda Paga | `pago` | **SIM** (valor total) | Dinheiro entrou |
| ❌ Venda Pendente | `pendente` | **NÃO** | Dinheiro não entrou |
| ✅ Devolução COM crédito | `devolvido` + `credito_aplicado=true` | **SIM** (valor total) | Dinheiro entrou e ficou (cliente pegou crédito) |
| ❌ Devolução SEM crédito | `devolvido` + `credito_aplicado=false` | **NÃO** (subtrai valor devolvido) | Dinheiro entrou mas foi devolvido ao cliente |

---

## 🧮 Fórmula de Cálculo

```
Valor Total do Caixa = Σ(Vendas Pagas) + Σ(Devoluções COM Crédito) - Σ(Devoluções SEM Crédito)
```

### Detalhamento:

1. **Vendas Pagas**: 
   - Status: `status_pagamento = 'pago'`
   - Soma: `total_liquido` de todas vendas pagas

2. **Devoluções COM Crédito**:
   - Status: `status_pagamento = 'devolvido'`
   - Filtro: `devolucoes.credito_aplicado = true`
   - **Soma**: `total_liquido` (valor completo da venda)
   - Motivo: Dinheiro ficou na loja, cliente pegou crédito

3. **Devoluções SEM Crédito**:
   - Status: `status_pagamento = 'devolvido'`
   - Filtro: `devolucoes.credito_aplicado = false`
   - **Subtração**: `valor_total_devolvido`
   - Motivo: Dinheiro foi devolvido ao cliente

---

## 💳 Formas de Pagamento

As formas de pagamento também são ajustadas:

```typescript
// 1. Somar valores das vendas pagas por forma
valorDinheiro = Σ(vendas pagas em dinheiro)
valorPix = Σ(vendas pagas em pix)
// ... outras formas

// 2. Subtrair devoluções SEM crédito
// Usa a forma de pagamento da venda original
devolucoes.forEach(dev => {
  if (!dev.credito_aplicado) {
    vendaOriginal = buscar venda
    subtrair dev.valor_total_devolvido da forma correspondente
  }
})
```

---

## 📋 Exemplos Práticos

### Exemplo 1: Devolução Total COM Crédito

**Venda #149: BUZZ TECH**
- Valor: R$ 90,00
- Forma: PIX
- Status: `devolvido` ✓
- Devolução: R$ 90,00 (total) com crédito
- Data Pagamento: 29/10
- Data Devolução: 30/10

**No Caixa (29/10):**
```
Vendas em PIX: +R$ 90,00 (conta normalmente)
Devoluções a Subtrair: R$ 0,00 (tem crédito)
Total em PIX: +R$ 90,00 ✓
```

**Cliente:**
- Recebeu: R$ 90,00 em crédito
- Pode usar em próximas compras
- **Dinheiro ficou na loja**

---

### Exemplo 2: Devolução Parcial COM Crédito

**Venda #135:**
- Valor: R$ 1.540,00
- Forma: Dinheiro
- Status: `pago` ✓
- Devolução: R$ 80,00 (parcial) com crédito

**No Caixa:**
```
Vendas em Dinheiro: R$ 1.540,00
Devoluções a Subtrair: R$ 0,00 (tem crédito)
Total em Dinheiro: R$ 1.540,00 ✓
```

**Cliente:**
- Recebeu: R$ 80,00 em crédito
- Pode usar em próximas compras

---

### Exemplo 3: Devolução SEM Crédito

**Venda #237:**
- Valor: R$ 570,00
- Forma: PIX
- Status: Pago ✓
- Devolução: R$ 200,00 sem crédito

**No Caixa:**
```
Vendas em PIX: R$ 570,00
Devoluções a Subtrair: R$ 200,00 (sem crédito)
Total em PIX: R$ 370,00 ✓
```

**Cliente:**
- Recebeu: R$ 200,00 de volta (estorno PIX)
- Dinheiro saiu do caixa



---

## 🔄 Comparação Caixa vs Vendas

### Página de Vendas

Quando ativar **"Filtrar por Data de Pagamento"**:
- Filtra por: `data_pagamento`
- Mostra: Vendas pagas no período
- Faturamento: Σ(vendas pagas)
- Devolvido: Σ(devoluções sem crédito)

### Página de Caixa

Automaticamente filtra por `data_pagamento`:
- Mostra: Vendas pagas no período
- Total: Σ(vendas pagas) - Σ(devoluções sem crédito)
- Por forma: Ajustado com devoluções

### ✅ Resultado

**Os valores batem!** Ambas páginas mostram o mesmo valor quando comparadas pelo mesmo filtro de data.

---

## 🗃️ Tabelas Envolvidas

### vendas
- `id`: ID da venda
- `status_pagamento`: 'pendente' | 'pago' | 'devolvido'
- `total_liquido`: Valor da venda
- `forma_pagamento`: Forma de pagamento
- `data_pagamento`: Quando foi paga

### devolucoes
- `id_venda`: Referência à venda
- `valor_total_devolvido`: Quanto foi devolvido
- `credito_aplicado`: true/false
- `tipo_devolucao`: 'total' | 'parcial'

### vendas_pagamentos
- `venda_id`: Referência à venda
- `forma`: Forma de pagamento
- `valor`: Valor pago

---

## 🔧 Implementação

### Arquivo: `app/sistema/caixa/page.tsx`

**Função:** `computeResumoFromList(vendas: Venda[])`

**Linha ~484:** Lógica principal

```typescript
// 1. Filtrar vendas por status
const vendasPagas = vendas.filter((v) => v.status_pagamento === "pago");
const vendasDevolvidas = vendas.filter((v) => v.status_pagamento === "devolvido");

// 2. Separar devoluções COM e SEM crédito
let vendasDevolvidasComCredito = [];
let vendasDevolvidasSemCredito = [];
let valorDevolvidoSemCredito = 0;

vendasDevolvidas.forEach((venda) => {
  const devolucao = buscarDevolucao(venda.id);
  if (devolucao.credito_aplicado) {
    vendasDevolvidasComCredito.push(venda); // Conta no caixa
  } else {
    vendasDevolvidasSemCredito.push(venda); // Subtrai do caixa
    valorDevolvidoSemCredito += devolucao.valor_total_devolvido;
  }
});

// 3. Calcular valor bruto (pagas + devolvidas com crédito)
let valorBrutoVendas = 
  soma(vendasPagas.total_liquido) + 
  soma(vendasDevolvidasComCredito.total_liquido);

// 4. Valor real do caixa
const valorTotalVendas = valorBrutoVendas - valorDevolvidoSemCredito;
const totalVendas = vendasPagas.length + vendasDevolvidasComCredito.length;
```

---

## ✅ Validação

### Teste 1: Conferir Valores
1. Abrir página **Vendas**
2. Ativar "Filtrar por Data de Pagamento"
3. Selecionar data: 31/10/2025
4. Anotar: **Faturamento** = R$ X

5. Abrir página **Caixa**
6. Selecionar mesma data: 31/10/2025
7. Conferir: **Total Vendas** = R$ X ✓

### Teste 2: Devolução COM Crédito
1. Fazer venda de R$ 100 em dinheiro
2. Receber pagamento
3. Devolver R$ 30 COM crédito ao cliente
4. **Caixa deve mostrar**: R$ 100 em dinheiro ✓

### Teste 3: Devolução SEM Crédito
1. Fazer venda de R$ 200 em PIX
2. Receber pagamento
3. Devolver R$ 50 SEM crédito (estorno)
4. **Caixa deve mostrar**: R$ 150 em PIX ✓

---

## 🚨 Importante

1. **Vendas Devolvidas (status = 'devolvido')**:
   - São vendas antigas antes da correção
   - Não aparecem no caixa (correto)

2. **Devoluções Parciais**:
   - Venda mantém status "pago"
   - Apenas subtrai se for sem crédito

3. **Histórico**:
   - Vendas #135 e #237 precisam correção SQL
   - Status deve mudar de "devolvido" para "pago"

---

## 📝 Histórico de Mudanças

### Versão 2.0 - 01/11/2025
- ✅ Alinhamento com página de Vendas
- ✅ Cálculo baseado em vendas pagas
- ✅ Subtração correta de devoluções sem crédito
- ✅ Ajuste das formas de pagamento

### Versão 1.0 - 01/11/2025
- ❌ Excluía vendas devolvidas completamente (incorreto)
- ❌ Não considerava devoluções parciais corretamente

---

## 📞 Contato

Para dúvidas sobre esta lógica, consulte:
- `app/sistema/caixa/page.tsx` (linha ~484)
- `app/sistema/vendas/page.tsx` (filtro de data)
- Este arquivo: `LOGICA_CAIXA_DEVOLUCOES.md`
