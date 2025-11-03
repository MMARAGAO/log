# Instruções para Aplicar a Migration do Histórico de Estoque

## 🚀 Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo `20251103_create_estoque_historico.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via CLI do Supabase

```bash
supabase db push
```

### Opção 3: Via psql (PostgreSQL CLI)

```bash
psql -h [host] -U [usuario] -d [database] -f db/migrations/20251103_create_estoque_historico.sql
```

## ✅ Verificação

Após executar a migration, verifique se a tabela foi criada:

```sql
-- Verificar se a tabela existe
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'estoque_historico';

-- Verificar estrutura da tabela
\d estoque_historico

-- Ou via SQL:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'estoque_historico'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'estoque_historico';

-- Verificar políticas RLS
SELECT * FROM pg_policies
WHERE tablename = 'estoque_historico';
```

## 🧪 Testar a Tabela

### Inserir registro de teste

```sql
INSERT INTO estoque_historico (
  produto_id,
  loja_id,
  quantidade_anterior,
  quantidade_nova,
  quantidade_alterada,
  tipo_operacao,
  usuario_nome,
  observacao
) VALUES (
  1,
  1,
  0,
  10,
  10,
  'entrada_estoque',
  'Sistema',
  'Teste de criação de histórico'
);
```

### Consultar registro

```sql
SELECT * FROM estoque_historico
ORDER BY created_at DESC
LIMIT 5;
```

### Limpar teste (se necessário)

```sql
DELETE FROM estoque_historico
WHERE observacao = 'Teste de criação de histórico';
```

## 🔄 Rollback (se necessário)

Se precisar desfazer a migration:

```sql
-- Remover políticas RLS
DROP POLICY IF EXISTS "Permitir leitura do histórico para todos autenticados" ON public.estoque_historico;
DROP POLICY IF EXISTS "Permitir inserção no histórico para todos autenticados" ON public.estoque_historico;

-- Remover índices
DROP INDEX IF EXISTS idx_estoque_historico_produto_id;
DROP INDEX IF EXISTS idx_estoque_historico_loja_id;
DROP INDEX IF EXISTS idx_estoque_historico_usuario_id;
DROP INDEX IF EXISTS idx_estoque_historico_created_at;
DROP INDEX IF EXISTS idx_estoque_historico_tipo_operacao;

-- Remover tabela
DROP TABLE IF EXISTS public.estoque_historico;
```

## 📊 Estatísticas

Após alguns dias de uso, você pode verificar as estatísticas:

```sql
-- Total de registros no histórico
SELECT COUNT(*) as total_registros
FROM estoque_historico;

-- Registros por tipo de operação
SELECT
  tipo_operacao,
  COUNT(*) as total,
  SUM(CASE WHEN quantidade_alterada > 0 THEN quantidade_alterada ELSE 0 END) as total_entradas,
  SUM(CASE WHEN quantidade_alterada < 0 THEN ABS(quantidade_alterada) ELSE 0 END) as total_saidas
FROM estoque_historico
GROUP BY tipo_operacao
ORDER BY total DESC;

-- Usuários mais ativos
SELECT
  usuario_nome,
  COUNT(*) as total_alteracoes
FROM estoque_historico
WHERE usuario_nome IS NOT NULL
GROUP BY usuario_nome
ORDER BY total_alteracoes DESC
LIMIT 10;

-- Produtos com mais alterações
SELECT
  e.produto_id,
  est.descricao,
  COUNT(*) as total_alteracoes
FROM estoque_historico e
JOIN estoque est ON e.produto_id = est.id
GROUP BY e.produto_id, est.descricao
ORDER BY total_alteracoes DESC
LIMIT 10;
```

## 🎯 Próximos Passos

Após aplicar a migration:

1. ✅ Testar funcionalidade de histórico na interface
2. ✅ Verificar se as alterações são registradas corretamente
3. ✅ Confirmar que o modal de histórico exibe os dados
4. 🔄 Integrar com outros módulos (vendas, devoluções, etc.)

## ⚠️ Importante

- A tabela `estoque_historico` é **somente leitura** para usuários normais
- Não é possível editar ou deletar registros de histórico (por design)
- O histórico é registrado automaticamente nas operações de estoque
- Erros no registro de histórico **não bloqueiam** operações principais
