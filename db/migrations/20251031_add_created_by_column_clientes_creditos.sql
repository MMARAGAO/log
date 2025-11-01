-- Migration: Add created_by column to clientes_creditos
-- Date: 2025-10-31
-- Purpose: Adiciona a coluna `created_by` para armazenar o id do usuário que realizou a alteração no crédito do cliente.

ALTER TABLE IF EXISTS public.clientes_creditos
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_clientes_creditos_created_by ON public.clientes_creditos(created_by);

-- Adiciona constraint de foreign key para auth.users se o schema/tabela existirem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' AND tc.table_name = 'clientes_creditos' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'created_by'
    ) THEN
      ALTER TABLE public.clientes_creditos
        ADD CONSTRAINT fk_clientes_creditos_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

-- Observações:
-- 1) Se você preferir referenciar a tabela de usuários em outro schema ou com outro nome, adapte a referência acima.
-- 2) Rode este script no SQL editor do Supabase ou via psql.

-- Exemplo de comando psql (PowerShell):
-- psql "postgresql://<user>:<password>@<host>:<port>/<database>" -f "db/migrations/20251031_add_created_by_column_clientes_creditos.sql"

-- Fim da migration
