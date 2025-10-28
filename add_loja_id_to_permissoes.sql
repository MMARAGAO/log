-- Adiciona a coluna loja_id na tabela permissoes
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE permissoes 
ADD COLUMN IF NOT EXISTS loja_id INTEGER;

-- Adiciona uma constraint de foreign key (opcional, mas recomendado)
ALTER TABLE permissoes
ADD CONSTRAINT fk_permissoes_loja
FOREIGN KEY (loja_id) 
REFERENCES lojas(id)
ON DELETE SET NULL;

-- Cria um índice para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_permissoes_loja_id ON permissoes(loja_id);

-- Comentário da coluna
COMMENT ON COLUMN permissoes.loja_id IS 'ID da loja à qual o usuário tem acesso. NULL significa acesso a todas as lojas';
