-- Migration: Create table clientes_creditos
-- Date: 2025-10-31
-- Purpose: Tabela para registrar alterações de crédito dos clientes (adicionar / remover)

-- Ajuste o schema se necessário (ex: public)

CREATE TABLE IF NOT EXISTS public.clientes_creditos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('add', 'remove')),
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  saldo_apos NUMERIC(12,2),
  createdat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID -- opcional: id do usuário que realizou a alteração (Supabase auth.uid())
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_clientes_creditos_cliente_id ON public.clientes_creditos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_creditos_createdat ON public.clientes_creditos(createdat DESC);

-- Exemplo: função para registrar crédito (opcional)
-- A função atualiza o campo credito na tabela clientes e insere o registro na tabela clientes_creditos
-- Obs: execute em um ambiente controlado. Ajuste nomes de colunas/roles conforme sua estrutura.

-- DROP FUNCTION IF EXISTS public.registrar_credito_cliente(bigint, text, numeric, text, uuid);
CREATE OR REPLACE FUNCTION public.registrar_credito_cliente(
  p_cliente_id bigint,
  p_tipo text,
  p_valor numeric,
  p_observacao text DEFAULT NULL,
  p_creator uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_atual numeric := 0;
  v_novo numeric := 0;
BEGIN
  SELECT credito INTO v_atual FROM public.clientes WHERE id = p_cliente_id;
  v_atual := COALESCE(v_atual, 0);
  IF p_tipo = 'add' THEN
    v_novo := v_atual + p_valor;
  ELSIF p_tipo = 'remove' THEN
    v_novo := v_atual - p_valor;
  ELSE
    RAISE EXCEPTION 'Tipo inválido: %', p_tipo;
  END IF;

  -- Atualiza o saldo no cliente
  UPDATE public.clientes SET credito = v_novo, updatedat = now() WHERE id = p_cliente_id;

  -- Insere histórico
  INSERT INTO public.clientes_creditos(cliente_id, tipo, valor, observacao, saldo_apos, createdat, created_by)
  VALUES (p_cliente_id, p_tipo, p_valor, p_observacao, v_novo, now(), p_creator);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajuste do owner/permissions: o SECURITY DEFINER faz a função rodar com privilégios do owner.
-- Recomenda-se criar uma role específica para essa função em ambientes de produção e conceder EXECUTE somente a roles que devem poder registrar créditos.


-- Exemplo de GRANTs (Postgres / Supabase):
-- Substitua 'web_anon' / 'authenticated' / 'app_role' pelos roles do seu ambiente.

-- Permitir leitura/insert/select para a role de aplicação autenticada
-- GRANT SELECT ON public.clientes_creditos TO authenticated;
-- GRANT INSERT ON public.clientes_creditos TO authenticated;
-- GRANT USAGE, EXECUTE ON FUNCTION public.registrar_credito_cliente(bigint, text, numeric, text, uuid) TO authenticated;

-- Se você usa Row Level Security (RLS) no Supabase, configure policies adequadas em vez de GRANTs diretas.

-- Fim da migration

-- ------------------------------------------------------------------
-- Atualizar permissões existentes na tabela `permissoes` adicionando
-- o campo `processar_creditos` em `acessos.clientes` com valor false
-- para registros que ainda não possuem essa chave.
-- ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissoes') THEN
    UPDATE public.permissoes
    SET acessos = (
      CASE
        WHEN (acessos::jsonb -> 'clientes') IS NOT NULL AND NOT ((acessos::jsonb -> 'clientes') ? 'processar_creditos') THEN
          jsonb_set(acessos::jsonb, '{clientes,processar_creditos}', 'false'::jsonb, true)
        ELSE acessos::jsonb
      END
    )::json
    WHERE (acessos::jsonb -> 'clientes') IS NOT NULL;
  END IF;
END$$;
