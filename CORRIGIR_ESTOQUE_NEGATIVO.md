# 🔧 Como Corrigir Estoque Negativo

## 🎯 Resumo Executivo

**Problema**: BATERIA SAMSUNG GOLD S24 ULTRA com **-2 unidades** no ATACADO  
**Causa**: Transferência #11 (16 produtos) foi confirmada e depois cancelada, mas estoque não foi revertido  
**Impacto**: 1 produto confirmado negativo, possíveis outros 15 produtos afetados  
**Status**: ✅ **BUG CORRIGIDO** no código - apenas precisa corrigir dados históricos

### ⚡ Ação Imediata (SQL):

```sql
-- Reverter transferência #11
UPDATE estoque_lojas SET quantidade = CAST(quantidade AS INTEGER) + 1 WHERE produto_id = 9568 AND loja_id = 3;
UPDATE estoque_lojas SET quantidade = CAST(quantidade AS INTEGER) - 1 WHERE produto_id = 9568 AND loja_id = 1;
```

---

## Problema Identificado

A "BATERIA SAMSUNG GOLD S24 ULTRA" está com **-2 unidades** no estoque da loja ATACADO após transferência de **16 produtos** do ATACADO para Loja Feira.

## 🔍 Causa Raiz Identificada

Após análise dos dados:

### Transferência #11 (16 produtos)

**Do ATACADO para Loja Feira:**

- 1x BATERIA SAMSUNG GOLD S24 ULTRA (GE-180) ← **Problema aqui!**
- 1x DISPLAY MOTOROLA ORIGINAL MOTO G5G PLUS/G100 PRETA
- 1x DISPLAY XIAOMI ORIGINAL MI 12 LITE S/ARO PRETA
- 2x BENZINA BI-RETIFICADA 1L
- 5x OCA 13
- 1x DISPLAY IPHONE JK XR PRETA
- 1x FERRAMENTA CANETA QUEBRA TAMPA WYLIE WL-795
- 1x FLEX CAMERA FRONTAL ORIGINAL IPHONE 8 PLUS
- 1x VIDRO APPLE WATCH S4/S5/S6/SE 44MM PRETA
- 1x DISPLAY SAMSUNG ORIGINAL X200/X205 TAB A8 10.5 PRETA
- 1x BATERIA XIAOMI GOLD REDMI 7/NOTE 8/NOTE 8T BN46 (GE-450)
- 1x TOUCH APPLE WATCH S5/SE 44MM PRETA
- 1x BATERIA IPAD 5/6/7/8/9/ AIR 1
- 1x DISPLAY MOTOROLA MACAQUINHO MOTO EDGE 50 ULTRA S/ARO PRETA
- 1x TAMPA SAMSUNG S20 PLUS PRETA
- 1x DISPLAY SAMSUNG ORIGINAL A21S A217 S/ARO PRETA

### Linha do Tempo:

1. ✅ **13:47** - Transferência #11 criada (Status: PENDENTE)

   - Sistema validou que ATACADO tinha estoque suficiente
   - Estoque **NÃO foi alterado** ✅

2. ❌ **13:58** - Transferência #11 confirmada (Status: CONCLUÍDA)

   - **PROBLEMA**: ATACADO tinha **-1** bateria Samsung (já estava negativo!)
   - Após confirmar: ATACADO ficou com **-2** (piorou!)
   - Loja Feira recebeu corretamente: 4 → **5**

3. ⚠️ **14:07** - Transferência #11 cancelada (Status: CANCELADA)
   - **BUG CRÍTICO**: Estoque **NÃO foi revertido!**
   - ATACADO continuou com **-2**
   - Loja Feira continuou com **5**

### 🎯 Conclusões:

1. ⚠️ **ATACADO já estava com estoque negativo** antes da transferência #11
2. ❌ Sistema **permitiu confirmar** transferência mesmo com estoque insuficiente (BUG - agora corrigido!)
3. ❌ Sistema **não revertia** estoque ao cancelar transferência concluída (BUG - agora corrigido!)

## ⚠️ Possíveis Causas (Históricas)

1. Transferência foi **confirmada** com estoque já insuficiente
2. Sistema **não revertia** estoque ao cancelar transferência concluída (BUG - agora corrigido!)
3. Transferências anteriores podem ter deixado estoque negativo

## ✅ Correções Aplicadas no Código

1. **Logs detalhados** em `handleSave()` - mostra quantidade antes e depois
2. **Validação de quantidade negativa** em `updateEstoqueLoja()` - bloqueia operação se tentar deixar negativo
3. **Queries otimizadas** - evita timeout no Vercel
4. **Status PENDENTE** - transferência criada NÃO altera estoque
5. **🆕 REVERSÃO DE ESTOQUE** em `cancelarTransferencia()` - agora reverte o estoque se cancelar transferência concluída!

### Nova Funcionalidade: Cancelamento com Reversão

Quando você cancela uma transferência **CONCLUÍDA**, o sistema agora:

- ✅ Devolve a quantidade para a loja de **ORIGEM**
- ✅ Retira a quantidade da loja de **DESTINO**
- ✅ Mostra aviso antes de confirmar o cancelamento
- ✅ Loga todo o processo de reversão

Se cancelar uma transferência **PENDENTE**, apenas muda o status (não há estoque para reverter).

## 🔍 Como Verificar no Supabase

### 1. Verificar Estoque Atual

```sql
SELECT
  el.*,
  e.descricao,
  l.nome as loja_nome
FROM estoque_lojas el
JOIN estoque e ON el.produto_id = e.id
JOIN lojas l ON el.loja_id = l.id
WHERE e.descricao ILIKE '%BATERIA SAMSUNG GOLD S24 ULTRA%'
ORDER BY el.updatedat DESC;
```

### 2. Verificar Transferências Recentes

```sql
SELECT
  t.*,
  lo.nome as loja_origem,
  ld.nome as loja_destino
FROM transferencias t
JOIN lojas lo ON t.loja_origem_id = lo.id
JOIN lojas ld ON t.loja_destino_id = ld.id
WHERE t.createdat >= NOW() - INTERVAL '24 hours'
ORDER BY t.createdat DESC;
```

### 3. Verificar Itens da Transferência

```sql
SELECT
  ti.*,
  e.descricao,
  t.status
FROM transferencia_itens ti
JOIN estoque e ON ti.produto_id = e.id
JOIN transferencias t ON ti.transferencia_id = t.id
WHERE e.descricao ILIKE '%BATERIA SAMSUNG GOLD S24 ULTRA%'
ORDER BY ti.createdat DESC;
```

## 🛠️ Como Corrigir o Estoque

### ⚡ Correção Rápida (Caso Específico Atual)

```sql
-- Corrigir BATERIA SAMSUNG GOLD S24 ULTRA no ATACADO
-- Produto ID: 9568, Loja ID: 3

-- Opção 1: Reverter manualmente a transferência #11 (RECOMENDADO)
-- Devolver 1 unidade para ATACADO
UPDATE estoque_lojas
SET quantidade = CAST(quantidade AS INTEGER) + 1,
    updatedat = NOW()
WHERE produto_id = 9568 AND loja_id = 3;

-- Retirar 1 unidade da Loja Feira
UPDATE estoque_lojas
SET quantidade = CAST(quantidade AS INTEGER) - 1,
    updatedat = NOW()
WHERE produto_id = 9568 AND loja_id = 1;

-- Opção 2: Zerar ATACADO (se não sabe o valor correto)
UPDATE estoque_lojas
SET quantidade = 0,
    updatedat = NOW()
WHERE produto_id = 9568 AND loja_id = 3;
```

### Opção 1: Via SQL (Genérica)

```sql
-- 1. Identificar o ID do produto
SELECT id, descricao FROM estoque
WHERE descricao ILIKE '%BATERIA SAMSUNG GOLD S24 ULTRA%';

-- 2. Identificar o ID da loja ATACADO
SELECT id, nome FROM lojas WHERE nome ILIKE '%ATACADO%';

-- 3. Atualizar para a quantidade correta (substitua os IDs)
UPDATE estoque_lojas
SET quantidade = 0, -- ou a quantidade correta que deveria ter
    updatedat = NOW()
WHERE produto_id = ? -- ID do produto da etapa 1
  AND loja_id = ?;   -- ID da loja da etapa 2
```

### Opção 2: Via Interface do Sistema

1. Ir em **Estoque**
2. Buscar "BATERIA SAMSUNG GOLD S24 ULTRA"
3. Clicar em **Editar**
4. Ajustar manualmente a quantidade da loja ATACADO
5. Salvar

### Opção 3: Criar Ajuste de Estoque

```sql
-- Adicionar registro de ajuste (se tiver tabela de ajustes)
INSERT INTO estoque_historico (
  produto_id,
  loja_id,
  quantidade_anterior,
  quantidade_nova,
  quantidade_alterada,
  tipo_operacao,
  usuario_id,
  observacao
) VALUES (
  ?, -- produto_id
  ?, -- loja_id
  -2, -- quantidade anterior
  0,  -- quantidade nova (ou o valor correto)
  2,  -- diferença
  'ajuste_manual',
  1,  -- seu user_id
  'Correção de estoque negativo causado por bug'
);
```

## 🚨 Verificar Triggers no Supabase

Acesse: **Database → Functions → Triggers**

Procure por triggers nas tabelas:

- `transferencias`
- `transferencia_itens`

Se encontrar algum trigger que altere `estoque_lojas` automaticamente, **DESABILITE** ou **REMOVA**.

## ✅ Teste Após Correção

1. Criar uma transferência **SEM CONFIRMAR**
2. Verificar que o estoque **NÃO MUDOU**
3. **Confirmar** a transferência
4. Verificar que o estoque **FOI ALTERADO**

## 📝 Logs a Observar

Ao criar transferência, você verá no console:

```
🔄 Iniciando criação de transferência...
📊 QUANTIDADE ANTES DA CRIAÇÃO:
   BATERIA SAMSUNG GOLD S24 ULTRA: 5 (será transferido: 2)
➕ Criando transferência com status PENDENTE
⚠️ IMPORTANTE: O estoque NÃO deve ser alterado nesta etapa!
✅ Transferência criada!
📊 QUANTIDADE DEPOIS DE RECARREGAR:
   BATERIA SAMSUNG GOLD S24 ULTRA: 5  ← DEVE SER IGUAL!
```

Se aparecer diferente, há um **trigger** no banco executando!

---

## 🎯 Resumo da Solução Completa

### 1️⃣ **Correção Imediata do Estoque** (Fazer AGORA)

Execute no SQL do Supabase para corrigir o estoque negativo:

```sql
-- Reverter transferência #11 manualmente
UPDATE estoque_lojas SET quantidade = CAST(quantidade AS INTEGER) + 1 WHERE produto_id = 9568 AND loja_id = 3;
UPDATE estoque_lojas SET quantidade = CAST(quantidade AS INTEGER) - 1 WHERE produto_id = 9568 AND loja_id = 1;
```

### 2️⃣ **Código Corrigido** (JÁ APLICADO ✅)

- ✅ Validação de quantidade negativa
- ✅ Logs detalhados em todas as operações
- ✅ **Reversão automática** ao cancelar transferência concluída
- ✅ Queries otimizadas

### 3️⃣ **Testes Recomendados**

1. Criar transferência → Verificar que estoque não mudou
2. Confirmar transferência → Verificar que estoque foi alterado
3. Cancelar transferência concluída → Verificar que estoque foi revertido ✨ **NOVO!**

### 4️⃣ **Investigação Completa**

#### 🔍 Encontrar TODOS os produtos com estoque negativo:

```sql
-- Ver todos os produtos negativos em qualquer loja
SELECT
  e.id as produto_id,
  e.descricao,
  l.id as loja_id,
  l.nome as loja,
  el.quantidade,
  el.updatedat as ultima_atualizacao
FROM estoque_lojas el
JOIN estoque e ON el.produto_id = e.id
JOIN lojas l ON el.loja_id = l.id
WHERE CAST(el.quantidade AS INTEGER) < 0
ORDER BY el.quantidade ASC, e.descricao;
```

#### 📋 Ver histórico completo da bateria Samsung:

```sql
-- Todas as operações que mexeram com esta bateria
SELECT
  eh.id,
  eh.tipo_operacao,
  eh.quantidade_anterior,
  eh.quantidade_nova,
  eh.quantidade_alterada,
  eh.observacao,
  eh.usuario_nome,
  eh.created_at,
  l.nome as loja
FROM estoque_historico eh
JOIN lojas l ON eh.loja_id = l.id
WHERE eh.produto_id = 9568 -- BATERIA SAMSUNG GOLD S24 ULTRA
ORDER BY eh.created_at DESC;
```

#### 🔄 Ver TODAS as transferências desta bateria:

```sql
-- Histórico de transferências
SELECT
  t.id,
  t.status,
  t.createdat,
  t.updatedat,
  lo.nome as origem,
  ld.nome as destino,
  ti.quantidade,
  t.observacoes
FROM transferencias t
JOIN lojas lo ON t.loja_origem_id = lo.id
JOIN lojas ld ON t.loja_destino_id = ld.id
JOIN transferencia_itens ti ON ti.transferencia_id = t.id
WHERE ti.produto_id = 9568
ORDER BY t.createdat DESC;
```

#### ⚠️ Verificar outros produtos da transferência #11:

```sql
-- Ver se outros produtos também ficaram negativos
SELECT
  e.descricao,
  el_atacado.quantidade as qtd_atacado,
  el_feira.quantidade as qtd_feira,
  ti.quantidade as qtd_transferida
FROM transferencia_itens ti
JOIN estoque e ON ti.produto_id = e.id
LEFT JOIN estoque_lojas el_atacado ON el_atacado.produto_id = e.id AND el_atacado.loja_id = 3
LEFT JOIN estoque_lojas el_feira ON el_feira.produto_id = e.id AND el_feira.loja_id = 1
WHERE ti.transferencia_id = 11
ORDER BY e.descricao;
```

---

## 💡 Lições Aprendidas

1. **Sempre validar quantidade antes de atualizar estoque** ✅ (Agora implementado!)
2. **Operações de cancelamento devem reverter mudanças** ✅ (Agora implementado!)
3. **Logs detalhados facilitam debug em produção** ✅ (Implementado!)
4. **Queries otimizadas evitam timeout no Vercel** ✅ (Implementado!)
5. **Estoque negativo indica problema anterior** - Investigar histórico!

---

## 🚨 Plano de Ação Urgente

### Fase 1: Correção Imediata (FAZER AGORA)

```sql
-- 1. Reverter transferência #11 manualmente
BEGIN;

-- Devolver 1 bateria para ATACADO
UPDATE estoque_lojas
SET quantidade = CAST(quantidade AS INTEGER) + 1
WHERE produto_id = 9568 AND loja_id = 3;

-- Retirar 1 bateria da Loja Feira
UPDATE estoque_lojas
SET quantidade = CAST(quantidade AS INTEGER) - 1
WHERE produto_id = 9568 AND loja_id = 1;

COMMIT;
```

### Fase 2: Auditoria Completa (RECOMENDADO)

```sql
-- 2. Verificar se outros produtos da transferência #11 também estão negativos
SELECT
  e.descricao,
  el.quantidade as qtd_atacado,
  ti.quantidade as qtd_transferida,
  CASE
    WHEN CAST(el.quantidade AS INTEGER) < 0 THEN '❌ NEGATIVO'
    WHEN CAST(el.quantidade AS INTEGER) < ti.quantidade THEN '⚠️ INSUFICIENTE'
    ELSE '✅ OK'
  END as status
FROM transferencia_itens ti
JOIN estoque e ON ti.produto_id = e.id
LEFT JOIN estoque_lojas el ON el.produto_id = e.id AND el.loja_id = 3
WHERE ti.transferencia_id = 11
ORDER BY
  CASE
    WHEN CAST(el.quantidade AS INTEGER) < 0 THEN 1
    WHEN CAST(el.quantidade AS INTEGER) < ti.quantidade THEN 2
    ELSE 3
  END,
  e.descricao;
```

### Fase 3: Correção em Massa (SE NECESSÁRIO)

```sql
-- 3. Corrigir TODOS os estoques negativos de uma vez
-- ⚠️ CUIDADO: Isso vai ZERAR todos os estoques negativos!
UPDATE estoque_lojas
SET quantidade = 0,
    updatedat = NOW()
WHERE CAST(quantidade AS INTEGER) < 0;

-- Para registrar no histórico (opcional):
INSERT INTO estoque_historico (
  produto_id,
  loja_id,
  quantidade_anterior,
  quantidade_nova,
  quantidade_alterada,
  tipo_operacao,
  observacao
)
SELECT
  el.produto_id,
  el.loja_id,
  CAST(el.quantidade AS INTEGER) as quantidade_anterior,
  0 as quantidade_nova,
  ABS(CAST(el.quantidade AS INTEGER)) as quantidade_alterada,
  'correcao_estoque_negativo',
  'Correção em massa de estoques negativos após bug de cancelamento'
FROM estoque_lojas el
WHERE CAST(el.quantidade AS INTEGER) < 0;
```

---

## ✅ Checklist de Verificação

### Após Corrigir o Estoque:

- [ ] Executei a query de correção do estoque
- [ ] Verifiquei que a bateria Samsung ficou com quantidade correta
- [ ] Executei a query de auditoria dos outros 15 produtos da transferência #11
- [ ] Corrigi outros produtos negativos (se houver)
- [ ] Testei criar nova transferência (status PENDENTE não altera estoque)
- [ ] Testei confirmar transferência (estoque foi alterado corretamente)
- [ ] Testei cancelar transferência concluída (estoque foi revertido) ✨ **NOVO!**
- [ ] Verifiquei os logs do console durante os testes
- [ ] Documentei qualquer outro problema encontrado

### Sinais de que está funcionando:

✅ Ao **criar** transferência: "Status: PENDENTE" + estoque não muda  
✅ Ao **confirmar**: "Status: CONCLUÍDA" + estoque altera  
✅ Ao **cancelar pendente**: "Status: CANCELADA" + nada muda (correto)  
✅ Ao **cancelar concluída**: "Status: CANCELADA" + estoque reverte ✨ **NOVO!**  
✅ Console mostra logs detalhados em todas as operações  
✅ Não consegue criar estoque negativo (operação é bloqueada)

---

## 📞 Suporte

Se encontrar outros problemas:

1. **Ative os logs do console** (F12)
2. **Tente a operação novamente**
3. **Copie todos os logs** que aparecem
4. **Execute as queries de investigação** acima
5. **Documente** o que aconteceu antes do problema

### Queries Úteis para Debug:

```sql
-- Ver último estoque de qualquer produto
SELECT
  e.descricao,
  l.nome as loja,
  el.quantidade,
  el.updatedat
FROM estoque_lojas el
JOIN estoque e ON el.produto_id = e.id
JOIN lojas l ON el.loja_id = l.id
WHERE e.descricao ILIKE '%[nome do produto]%'
ORDER BY el.updatedat DESC;

-- Ver últimas transferências
SELECT
  t.id,
  t.status,
  lo.nome as origem,
  ld.nome as destino,
  t.createdat,
  COUNT(ti.id) as total_itens
FROM transferencias t
JOIN lojas lo ON t.loja_origem_id = lo.id
JOIN lojas ld ON t.loja_destino_id = ld.id
LEFT JOIN transferencia_itens ti ON ti.transferencia_id = t.id
GROUP BY t.id, t.status, lo.nome, ld.nome, t.createdat
ORDER BY t.createdat DESC
LIMIT 20;
```
