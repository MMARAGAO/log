# 🔴 PROBLEMA: Histórico de Estoque Incompleto

## Situação Reportada

O usuário criou registros de estoque e o histórico mostra:

- `+1` na loja "ESTOQUE" (05/11/2025)
- `+5` na "Loja Feira" (03/11/2025)

Mas agora o estoque está **ZERADO** e não consegue fazer transferências.

## 🔍 Causa Raiz Identificada

O sistema tem **múltiplos módulos** que alteram a tabela `estoque_lojas`, mas apenas **UM deles** registra no histórico:

### Módulos que Alteram Estoque

1. ✅ **Estoque** (`app/sistema/estoque/page.tsx`)

   - Registra no `estoque_historico` ✅
   - Tipos: `ajuste_manual`, `entrada_estoque`

2. ❌ **Vendas** (`app/sistema/vendas/page.tsx`)

   - Atualiza `estoque_lojas` diretamente
   - **NÃO registra** no histórico ❌
   - Tipos que faltam: `venda`

3. ❌ **Devoluções** (`app/sistema/devolucoes/page.tsx`)

   - Atualiza `estoque_lojas` diretamente
   - **NÃO registra** no histórico ❌
   - Tipos que faltam: `devolucao`

4. ❌ **RMA** (`app/sistema/rma/page.tsx`)

   - Atualiza `estoque_lojas` diretamente
   - **NÃO registra** no histórico ❌
   - Tipos que faltam: `rma`

5. ❌ **Transferências** (`app/sistema/transferencia/page.tsx`)
   - Atualiza `estoque_lojas` diretamente
   - **NÃO registra** no histórico ❌
   - Tipos que faltam: `transferencia`

## 💥 O que Aconteceu

1. **03/11/2025**: Importação adicionou 5 unidades na "Loja Feira" → ✅ Registrou no histórico
2. **05/11/2025**: Ajuste manual adicionou 1 unidade em "ESTOQUE" → ✅ Registrou no histórico
3. **Depois**: Vendas consumiram 6 unidades → ❌ **NÃO registrou** no histórico
4. **Resultado**: Estoque = 0, mas histórico só mostra +6

## ✅ Solução Implementada

### 1. Criado Utilitário Compartilhado

**Arquivo**: `utils/estoqueHistorico.ts`

Função reutilizável que TODOS os módulos devem usar:

```typescript
export async function registrarHistoricoEstoque(params: {
  produtoId: number;
  lojaId: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  tipoOperacao: string;
  usuarioId?: string;
  usuarioNome?: string;
  observacao?: string;
}): Promise<void>;
```

### 2. Atualizar Módulo de Vendas

No arquivo `app/sistema/vendas/page.tsx`, adicionar chamada ao registrar histórico após atualizar estoque.

**Locais a modificar:**

- Linha ~1890: Após `supabase.from("estoque_lojas").update()`
- Linha ~1930: Após atualizar estoque em edição de venda
- Linha ~2010: Após cancelar venda e devolver estoque
- Linha ~2630: Após salvar nova venda

**Exemplo de implementação:**

```typescript
import { registrarHistoricoEstoque } from "@/utils/estoqueHistorico";

// Após atualizar estoque
const { error: updErr } = await supabase
  .from("estoque_lojas")
  .update({
    quantidade: novoEstoque,
    updatedat: new Date().toISOString(),
  })
  .eq("produto_id", produtoId)
  .eq("loja_id", lojaId);

if (!updErr) {
  // ✅ ADICIONAR: Registrar no histórico
  await registrarHistoricoEstoque({
    produtoId: produtoId,
    lojaId: lojaId,
    quantidadeAnterior: estoqueAtual,
    quantidadeNova: novoEstoque,
    tipoOperacao: "venda",
    usuarioId: user?.id,
    usuarioNome: user?.nome || user?.email,
    observacao: `Venda #${vendaId}`,
  });
}
```

### 3. Atualizar Módulo de Devoluções

Similar ao de vendas, adicionar registro de histórico.

**Tipo de operação**: `"devolucao"`

### 4. Atualizar Módulo de RMA

Similar aos anteriores.

**Tipo de operação**: `"rma"`

### 5. Atualizar Módulo de Transferências

Similar aos anteriores.

**Tipo de operação**: `"transferencia"`

## 📊 Melhorias no Modal de Histórico

Adicionado card mostrando **estoque atual** vs **histórico**:

```
📊 Estoque Atual
├─ Loja ESTOQUE: 0 un
├─ Loja Feira: 0 un
└─ Total: 0 unidades
```

Isso ajuda a identificar rapidamente se há inconsistências.

## 🎯 Próximos Passos

### Passo 1: Implementar nos Outros Módulos ⚠️

Os módulos de **Vendas**, **Devoluções**, **RMA** e **Transferências** precisam ser atualizados para usar `registrarHistoricoEstoque()`.

### Passo 2: Corrigir Histórico Existente (Opcional)

Para vendas já realizadas que não têm histórico, você pode criar uma migration SQL para popular o histórico com base nas vendas:

```sql
-- ATENÇÃO: Isso é apenas um exemplo!
-- Adapte conforme sua necessidade

INSERT INTO estoque_historico (
  produto_id,
  loja_id,
  quantidade_anterior,
  quantidade_nova,
  quantidade_alterada,
  tipo_operacao,
  usuario_id,
  usuario_nome,
  observacao,
  created_at
)
SELECT
  vi.id_estoque AS produto_id,
  v.loja_id,
  0 AS quantidade_anterior, -- Não sabemos o valor anterior
  0 AS quantidade_nova, -- Não sabemos o valor resultante
  -vi.quantidade AS quantidade_alterada, -- Negativo porque saiu
  'venda' AS tipo_operacao,
  v.id_usuario AS usuario_id,
  'Sistema' AS usuario_nome,
  'Importação retroativa - Venda #' || v.id AS observacao,
  v.data_venda AS created_at
FROM vendas v
CROSS JOIN LATERAL jsonb_to_recordset(v.itens) AS vi(
  id_estoque INTEGER,
  quantidade INTEGER
)
WHERE v.status_pagamento != 'cancelado'
  AND NOT EXISTS (
    SELECT 1 FROM estoque_historico eh
    WHERE eh.produto_id = vi.id_estoque
      AND eh.tipo_operacao = 'venda'
      AND eh.observacao LIKE '%Venda #' || v.id || '%'
  );
```

⚠️ **ATENÇÃO**: Teste primeiro em ambiente de desenvolvimento!

### Passo 3: Adicionar Logs de Debug

Já foi adicionado no módulo de estoque. Ao abrir o histórico, veja no console:

```
🔍 Carregando histórico para produto: DISPLAY IPHONE...
📊 Estoque atual do produto: {...}
📜 Histórico carregado: X registros
📋 Detalhes do histórico: [...]
```

Isso ajuda a identificar discrepâncias.

## 🔍 Como Verificar o Problema Agora

1. Abra o **Modal de Histórico** de um produto
2. Veja o **card "Estoque Atual"** no topo
3. Compare com os registros de histórico
4. Abra o **Console do navegador** (F12)
5. Veja os logs de debug

## 🐛 Para Resolver o Problema Atual

Como o seu estoque está zerado mas o histórico mostra entradas:

1. **Verifique se houve vendas** desse produto
2. **Consulte no Supabase**:

```sql
SELECT
  v.id,
  v.data_venda,
  v.cliente_nome,
  v.itens
FROM vendas v
WHERE v.itens::text LIKE '%"id_estoque":<PRODUTO_ID>%'
ORDER BY v.data_venda DESC;
```

3. Se encontrar vendas, o estoque foi consumido **sem registrar no histórico**
4. Você pode:
   - **Opção A**: Aceitar que o histórico está incompleto (vendas antigas)
   - **Opção B**: Rodar a migration SQL acima para popular o histórico retroativamente
   - **Opção C**: Fazer ajuste manual no estoque para repor

## 📝 Resumo

- ✅ **Problema identificado**: Módulos de vendas, RMA, transferências não registram histórico
- ✅ **Utilitário criado**: `utils/estoqueHistorico.ts`
- ✅ **Modal melhorado**: Mostra estoque atual vs histórico
- ⚠️ **Pendente**: Atualizar outros módulos para usar o utilitário
- ⚠️ **Opcional**: Popular histórico retroativamente

## 🎯 Benefícios Após Correção

1. ✅ **Auditoria completa**: Todos os movimentos registrados
2. ✅ **Rastreabilidade**: Saber exatamente o que aconteceu com cada unidade
3. ✅ **Debugging facilitado**: Logs mostram discrepâncias
4. ✅ **Consistência**: Uma única função para todos os módulos
