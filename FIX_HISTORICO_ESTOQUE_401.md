# Correção do Erro 401 no Histórico de Estoque

## Problema Identificado

Quando você atualiza um produto no estoque, está aparecendo o erro:

```
Failed to load resource: the server responded with a status of 401 ()
❌ Erro ao inserir registro: Object
❌ Erro ao inserir histórico: Object
```

## Causa do Problema

O erro 401 indica que há um problema de **autenticação/autorização** com as políticas RLS (Row Level Security) do Supabase na tabela `estoque_historico`.

Além disso, havia um problema no código onde o `usuario_id` estava sendo adicionado duas vezes ao tentar inserir no histórico.

## Correções Realizadas

### 1. Correção no Código (`lib/insertTable.ts`)

Foi corrigido para **não adicionar** `usuario_id` duplicado quando a tabela é `estoque_historico`, pois esse campo já vem preenchido pela função `registrarHistoricoEstoque`.

### 2. Correção na Função de Registro (`app/sistema/estoque/page.tsx`)

- Adicionada verificação se o usuário está autenticado antes de registrar histórico
- Melhorado o tratamento de erros com mais detalhes no log

### 3. Correção nas Políticas RLS do Supabase (SQL)

Criado o arquivo `db/migrations/20251105_fix_estoque_historico_rls.sql` com as políticas corretas.

## Como Aplicar a Correção

### Passo 1: Executar o SQL no Supabase

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Copie e cole o conteúdo do arquivo `db/migrations/20251105_fix_estoque_historico_rls.sql`
5. Clique em **Run** para executar

### Passo 2: Verificar as Políticas

Após executar o SQL, você verá uma tabela mostrando as políticas criadas:

```
| policyname                      | cmd    | roles         |
|---------------------------------|--------|---------------|
| estoque_historico_select_policy | SELECT | authenticated |
| estoque_historico_insert_policy | INSERT | authenticated |
```

Se aparecer algo assim, está correto!

### Passo 3: Testar

1. No seu sistema, faça login normalmente
2. Vá em **Estoque**
3. Tente editar a quantidade de um produto
4. O histórico deve ser registrado sem erros

## O que mudou?

### Antes:

- ❌ Políticas RLS com nomes longos e possivelmente conflitantes
- ❌ `usuario_id` sendo adicionado duas vezes
- ❌ Falta de validação se o usuário está autenticado

### Depois:

- ✅ Políticas RLS claras e objetivas
- ✅ `usuario_id` adicionado apenas uma vez
- ✅ Validação de autenticação antes de registrar histórico
- ✅ Melhor tratamento de erros com logs detalhados

## Verificação Adicional

Se o erro persistir após executar o SQL, verifique:

1. **Usuário está logado?**

   - Abra o console do navegador (F12)
   - Digite: `localStorage.getItem('sb-yyqpqkajqukqkmrgzgsu-auth-token')`
   - Deve retornar um token JSON

2. **Token válido?**

   - Vá em **Application** > **Local Storage** no DevTools
   - Procure por `sb-yyqpqkajqukqkmrgzgsu-auth-token`
   - Verifique se `expires_at` não está no passado

3. **Tabela existe?**
   - No Supabase, vá em **Table Editor**
   - Verifique se `estoque_historico` está listada

## Solução Alternativa (se ainda houver problemas)

Se o erro persistir, você pode **desabilitar temporariamente o RLS** para teste:

```sql
ALTER TABLE public.estoque_historico DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO**: Isso é APENAS para teste! Não deixe em produção sem RLS!

Depois de testar, reabilite:

```sql
ALTER TABLE public.estoque_historico ENABLE ROW LEVEL SECURITY;
```

## Logs para Depuração

Agora o código mostra logs mais detalhados:

- `📝 Registrando histórico de estoque:` - Dados sendo enviados
- `✅ Histórico de estoque registrado com sucesso` - Sucesso!
- `❌ Erro ao registrar histórico de estoque:` - Erro com detalhes
- `⚠️ Usuário não autenticado, pulando registro de histórico` - Usuário não logado

Fique de olho nesses logs no console do navegador (F12) para entender o que está acontecendo.
