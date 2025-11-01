# Backfill: data_pagamento em Vendas Antigas

## 🎯 Objetivo

Preencher retroativamente o campo `data_pagamento` em vendas que já foram pagas mas não têm essa data registrada (foram pagas antes do campo `data_pagamento` existir no sistema).

## 🔍 Problema

Quando o campo `data_pagamento` foi adicionado ao sistema, vendas antigas que já estavam com `status_pagamento = 'pago'` ficaram sem esse campo preenchido. Isso causa:

1. **Vendas pagas não aparecem no Caixa** (que filtra por `data_pagamento`)
2. **Relatórios de Caixa ficam incompletos**
3. **Discrepância entre vendas pagas e valores no Caixa**

## 💡 Solução

Preencher `data_pagamento` usando a melhor aproximação disponível:

### Estratégia de Backfill

Para cada venda com `status_pagamento = 'pago'` e `data_pagamento IS NULL`:

1. **Preferência 1**: `updated_at` (última atualização - provavelmente quando foi marcada como paga)
2. **Preferência 2**: `created_at` (data de criação)
3. **Preferência 3**: `data_venda` (fallback - data da venda)

---

## 🚀 Opções de Execução

### Opção 1: SQL Direto (Recomendado para produção)

Execute o arquivo SQL diretamente no banco de dados:

```bash
# Via psql
psql -h seu-host -U seu-usuario -d seu-banco -f db/migrations/20251101_backfill_data_pagamento.sql

# Via Supabase Dashboard
# 1. Acesse SQL Editor no dashboard do Supabase
# 2. Cole o conteúdo do arquivo 20251101_backfill_data_pagamento.sql
# 3. Execute (Run)
```

**Vantagens:**

- ✅ Mais rápido (executa diretamente no banco)
- ✅ Cria índices para otimizar performance
- ✅ Mostra estatísticas ao final
- ✅ Transacional (rollback automático em caso de erro)

---

### Opção 2: Script TypeScript (Recomendado para desenvolvimento)

Execute via console do navegador ou Node.js:

#### Via Console do Navegador

1. Abra a aplicação e navegue até a página de Vendas
2. Abra o Console do navegador (F12 → Console)
3. Cole o conteúdo do arquivo `scripts/backfill-data-pagamento.ts`
4. Execute o dry run primeiro (simulação):
   ```javascript
   await backfillDataPagamento(true);
   ```
5. Se estiver tudo OK, execute de verdade:
   ```javascript
   await backfillDataPagamento(false);
   ```

#### Via Node.js

```bash
# Instale ts-node se ainda não tiver
npm install -g ts-node

# Execute o script
ts-node scripts/backfill-data-pagamento.ts
```

**Vantagens:**

- ✅ Pode simular antes (dry run)
- ✅ Logs detalhados no console
- ✅ Pode ser executado sem acesso direto ao banco
- ✅ Processa em lotes (não trava em casos de muitas vendas)

---

## 📊 Resultados Esperados

### Antes do Backfill

```sql
-- Vendas pagas sem data_pagamento
SELECT COUNT(*)
FROM vendas
WHERE status_pagamento = 'pago'
  AND data_pagamento IS NULL;

-- Exemplo: 1.247 vendas
```

### Depois do Backfill

```sql
-- Todas as vendas pagas agora têm data_pagamento
SELECT COUNT(*)
FROM vendas
WHERE status_pagamento = 'pago'
  AND data_pagamento IS NOT NULL;

-- Resultado: 1.247 vendas (todas)
```

### Verificação no Caixa

Após o backfill:

1. Abra a tela do Caixa
2. Filtre por datas anteriores (ex: último mês)
3. Verifique que vendas antigas agora aparecem nos relatórios
4. Compare com os valores da página de Vendas

---

## ⚠️ Considerações Importantes

### Precisão das Datas

A data atribuída é uma **aproximação**:

- ✅ **Boa aproximação**: Se a venda foi paga logo após ser criada
- ⚠️ **Aproximação razoável**: Se a venda foi paga dias/semanas depois
- ❌ **Menos precisa**: Se a venda ficou pendente por meses

### Impacto no Caixa

Após o backfill:

- Vendas antigas aparecerão no Caixa da data aproximada de pagamento
- Isso pode causar diferenças em relatórios históricos
- **Recomendação**: Execute em horário de baixo uso

### Reversão

Se precisar reverter:

```sql
-- ATENÇÃO: Isso remove TODAS as data_pagamento, inclusive as novas!
-- Use apenas se tiver backup

UPDATE vendas
SET data_pagamento = NULL
WHERE status_pagamento = 'pago'
  AND updated_at < '2025-11-01'; -- Ajuste a data conforme necessário
```

---

## 🧪 Testes Recomendados

Antes de executar em produção:

### 1. Teste em Ambiente de Desenvolvimento

```bash
# Clone o banco para teste
pg_dump producao_db | psql teste_db

# Execute o backfill no teste
psql teste_db -f db/migrations/20251101_backfill_data_pagamento.sql

# Valide os resultados
```

### 2. Valide uma Amostra

```sql
-- Buscar 10 vendas que serão atualizadas
SELECT
  id,
  status_pagamento,
  data_venda,
  created_at,
  updated_at,
  data_pagamento,
  COALESCE(updated_at, created_at, data_venda) as nova_data_pagamento
FROM vendas
WHERE status_pagamento = 'pago'
  AND data_pagamento IS NULL
LIMIT 10;
```

### 3. Teste o Caixa

Depois do backfill:

1. Escolha uma data aleatória do passado
2. Verifique o Caixa dessa data
3. Compare com registros de vendas antigas
4. Confirme que os valores fazem sentido

---

## 📝 Checklist de Execução

- [ ] **Backup do banco de dados**
- [ ] Testar em ambiente de desenvolvimento primeiro
- [ ] Executar dry run (simulação) se usar o script TypeScript
- [ ] Escolher horário de baixo uso
- [ ] Executar o backfill
- [ ] Verificar logs/resultados
- [ ] Testar a tela do Caixa com datas variadas
- [ ] Validar relatórios de vendas
- [ ] Comunicar equipe sobre possíveis diferenças em relatórios históricos
- [ ] Documentar a data/hora da execução

---

## 🆘 Troubleshooting

### Erro: "Column data_pagamento does not exist"

O campo `data_pagamento` ainda não existe no banco. Adicione primeiro:

```sql
ALTER TABLE vendas
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE;
```

### Muitas vendas para atualizar (timeout)

Use o script TypeScript que processa em lotes:

```javascript
await backfillDataPagamento(false); // Processa em lotes de 100
```

### Datas inconsistentes

Revise a estratégia de fallback no script e ajuste se necessário.

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console/banco
2. Valide que o campo `data_pagamento` existe
3. Confirme que há vendas pagas sem `data_pagamento`
4. Verifique permissões de UPDATE na tabela vendas

---

**Data da documentação:** 01/11/2025  
**Autor:** Sistema Log - Gestão de Vendas  
**Versão:** 1.0
