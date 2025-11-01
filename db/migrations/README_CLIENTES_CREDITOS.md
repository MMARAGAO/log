Instruções para a migration `20251031_create_clientes_creditos.sql`

1. Objetivo

- Criar a tabela `public.clientes_creditos` para registrar todas as alterações de crédito dos clientes.
- Fornecer uma função `public.registrar_credito_cliente` que atualiza o saldo do cliente e registra o evento.

2. Execução

- No Supabase SQL editor ou em seu cliente psql, execute o arquivo SQL presente em `db/migrations/20251031_create_clientes_creditos.sql`.

3. Permissões (Supabase/Postgres)

- Se você utiliza Supabase sem RLS: adapte as GRANTs abaixo ao role apropriado (ex: `authenticated` ou `anon` ou `service_role`).

Exemplos:

-- Conceder permissão de SELECT/INSERT para usuários autenticados (se fizer sentido):
-- GRANT SELECT ON public.clientes_creditos TO authenticated;
-- GRANT INSERT ON public.clientes_creditos TO authenticated;

-- Conceder permissão de EXECUTE na função registrar_credito_cliente para uma role da aplicação (recomendado):
-- GRANT EXECUTE ON FUNCTION public.registrar_credito_cliente(bigint, text, numeric, text, uuid) TO authenticated;

4. Row Level Security (RLS)

- Para ambientes Supabase com RLS ativado para a tabela `clientes`, você deve criar policies para `clientes_creditos` também.
- Política exemplo (permitir que usuários admin/internos vejam tudo e que usuários proprietários vejam seus próprios registros):

-- ALTER TABLE public.clientes_creditos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow admins select" ON public.clientes_creditos FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Allow owner insert" ON public.clientes_creditos FOR INSERT TO authenticated USING (true) WITH CHECK (auth.uid() IS NOT NULL);

Ajuste as policies conforme seu modelo de autenticação e roles.

5. Integração com a aplicação

- No frontend, as chamadas a `insertTable('clientes_creditos', ...)` vão funcionar se a role da conexão tiver INSERT privilégios.
- Alternativamente, chame a função `public.registrar_credito_cliente` via RPC (Supabase) para garantir atomicidade entre atualização de saldo e inserção de histórico.

6. Observações de segurança

- Evite conceder permissões amplas a roles públicas. Prefira usar a função `registrar_credito_cliente` com SECURITY DEFINER e conceder EXECUTE apenas a roles confiáveis.
- Registre o `created_by` quando possível para auditoria.
