-- Script para ajustar Foreign Keys da tabela usuarios
-- Isso permite deletar usuários sem erros de constraint

-- PASSO 1: Remover constraint NOT NULL das colunas usuario_id
ALTER TABLE caixa ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE estoque ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE estoque_lojas ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE logs ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE vendas ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE ordens ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE devolucoes ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE rma ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE transferencias ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE clientes ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE lojas ALTER COLUMN usuario_id DROP NOT NULL;

-- PASSO 2: Limpar registros órfãos (que referenciam usuários que não existem mais)
UPDATE caixa SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE estoque SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE estoque_lojas SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE logs SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE vendas SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE ordens SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE devolucoes SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE rma SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE transferencias SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE clientes SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

UPDATE lojas SET usuario_id = NULL 
WHERE usuario_id IS NOT NULL 
AND usuario_id NOT IN (SELECT uuid FROM usuarios);

-- PASSO 3: Ajustar as Foreign Keys

-- 1. Tabela: caixa
ALTER TABLE caixa
DROP CONSTRAINT IF EXISTS caixa_usuario_id_fkey;

ALTER TABLE caixa
ADD CONSTRAINT caixa_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;  -- Quando usuário for deletado, campo fica NULL

-- 2. Tabela: estoque
ALTER TABLE estoque
DROP CONSTRAINT IF EXISTS estoque_usuario_id_fkey;

ALTER TABLE estoque
ADD CONSTRAINT estoque_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 3. Tabela: estoque_lojas
ALTER TABLE estoque_lojas
DROP CONSTRAINT IF EXISTS estoque_lojas_usuario_id_fkey;

ALTER TABLE estoque_lojas
ADD CONSTRAINT estoque_lojas_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 4. Tabela: logs
ALTER TABLE logs
DROP CONSTRAINT IF EXISTS logs_usuario_id_fkey;

ALTER TABLE logs
ADD CONSTRAINT logs_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 5. Tabela: vendas
ALTER TABLE vendas
DROP CONSTRAINT IF EXISTS vendas_usuario_id_fkey;

ALTER TABLE vendas
ADD CONSTRAINT vendas_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 6. Tabela: ordens
ALTER TABLE ordens
DROP CONSTRAINT IF EXISTS ordens_usuario_id_fkey;

ALTER TABLE ordens
ADD CONSTRAINT ordens_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 7. Tabela: devolucoes
ALTER TABLE devolucoes
DROP CONSTRAINT IF EXISTS devolucoes_usuario_id_fkey;

ALTER TABLE devolucoes
ADD CONSTRAINT devolucoes_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 8. Tabela: rma
ALTER TABLE rma
DROP CONSTRAINT IF EXISTS rma_usuario_id_fkey;

ALTER TABLE rma
ADD CONSTRAINT rma_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 9. Tabela: transferencias
ALTER TABLE transferencias
DROP CONSTRAINT IF EXISTS transferencias_usuario_id_fkey;

ALTER TABLE transferencias
ADD CONSTRAINT transferencias_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 10. Tabela: clientes
ALTER TABLE clientes
DROP CONSTRAINT IF EXISTS clientes_usuario_id_fkey;

ALTER TABLE clientes
ADD CONSTRAINT clientes_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- 11. Tabela: lojas
ALTER TABLE lojas
DROP CONSTRAINT IF EXISTS lojas_usuario_id_fkey;

ALTER TABLE lojas
ADD CONSTRAINT lojas_usuario_id_fkey
FOREIGN KEY (usuario_id)
REFERENCES usuarios(uuid)
ON DELETE SET NULL;

-- Mensagem de sucesso
SELECT 'Foreign keys ajustadas com sucesso!' as status;
