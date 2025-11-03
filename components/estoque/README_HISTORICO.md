# Sistema de Histórico de Estoque

## 📋 Visão Geral

Sistema completo de auditoria e rastreamento de alterações no estoque. Registra todas as modificações de quantidade com informações detalhadas sobre quem, quando, onde e por que as alterações foram feitas.

## 🗄️ Estrutura do Banco de Dados

### Tabela: `estoque_historico`

```sql
CREATE TABLE public.estoque_historico (
  id                   BIGSERIAL PRIMARY KEY,
  produto_id           BIGINT NOT NULL,
  loja_id              BIGINT NOT NULL,
  quantidade_anterior  INT NOT NULL DEFAULT 0,
  quantidade_nova      INT NOT NULL DEFAULT 0,
  quantidade_alterada  INT NOT NULL,
  tipo_operacao        VARCHAR(50),
  usuario_id           UUID,
  usuario_nome         VARCHAR(255),
  observacao           TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGSERIAL | Identificador único do registro |
| `produto_id` | BIGINT | ID do produto alterado |
| `loja_id` | BIGINT | ID da loja onde ocorreu a alteração |
| `quantidade_anterior` | INT | Quantidade antes da alteração |
| `quantidade_nova` | INT | Quantidade após a alteração |
| `quantidade_alterada` | INT | Diferença (positivo = entrada, negativo = saída) |
| `tipo_operacao` | VARCHAR(50) | Tipo da operação realizada |
| `usuario_id` | UUID | ID do usuário que fez a alteração |
| `usuario_nome` | VARCHAR(255) | Nome do usuário (desnormalizado para histórico) |
| `observacao` | TEXT | Motivo ou detalhes da alteração |
| `created_at` | TIMESTAMPTZ | Data e hora da alteração |

### Tipos de Operação

- `ajuste_manual` - Alteração manual de estoque
- `venda` - Saída por venda
- `devolucao` - Entrada por devolução
- `transferencia` - Movimentação entre lojas
- `entrada_estoque` - Primeira entrada ou compra

## 🔧 Implementação

### 1. Migration

Arquivo: `db/migrations/20251103_create_estoque_historico.sql`

- Cria tabela `estoque_historico`
- Adiciona índices para performance
- Configura Row Level Security (RLS)
- Define políticas de acesso

### 2. Interface TypeScript

```typescript
interface EstoqueHistorico {
  id: number;
  produto_id: number;
  loja_id: number;
  quantidade_anterior: number;
  quantidade_nova: number;
  quantidade_alterada: number;
  tipo_operacao: string;
  usuario_id?: string;
  usuario_nome?: string;
  observacao?: string;
  created_at: string;
}
```

### 3. Funções Principais

#### `registrarHistoricoEstoque()`

Registra uma alteração no histórico.

```typescript
await registrarHistoricoEstoque(
  produtoId,
  lojaId,
  quantidadeAnterior,
  quantidadeNova,
  "ajuste_manual",
  "Correção de inventário"
);
```

#### `carregarHistorico()`

Carrega o histórico de um produto específico.

```typescript
await carregarHistorico(produto);
```

## 🎨 Interface do Usuário

### Botão de Histórico

Disponível em dois locais:

1. **Modo Grid**: Menu dropdown (⋮) → "Ver Histórico"
2. **Modo Lista**: Botão "Histórico" na coluna de ações

### Modal de Histórico

Exibe:
- **Cabeçalho**: Nome e modelo do produto
- **Lista de alterações**: Ordenada da mais recente para a mais antiga
- **Cada registro mostra**:
  - Diferença de quantidade (chip verde/vermelho)
  - Tipo de operação
  - Nome da loja
  - Quantidade anterior → nova
  - Usuário responsável
  - Data e hora
  - Observação (se houver)

## 📊 Exemplo de Uso

### Cenário: Ajuste Manual de Estoque

```typescript
// Usuário altera quantidade de 10 para 15
await updateEstoqueLoja(produtoId, lojaId, 15);

// Sistema registra automaticamente:
{
  produto_id: 123,
  loja_id: 1,
  quantidade_anterior: 10,
  quantidade_nova: 15,
  quantidade_alterada: +5,
  tipo_operacao: "ajuste_manual",
  usuario_id: "uuid-do-usuario",
  usuario_nome: "João Silva",
  observacao: "Alteração manual de estoque"
}
```

### Visualização no Modal

```
+5 | Ajuste Manual | Loja Centro

Quantidade: 10 → 15
Por: João Silva
03/11/2025, 14:30

"Alteração manual de estoque"
```

## 🔐 Segurança

### Row Level Security (RLS)

- **Leitura**: Todos os usuários autenticados podem ler o histórico
- **Inserção**: Apenas usuários autenticados podem inserir registros
- **Atualização/Exclusão**: Não permitido (histórico é imutável)

### Índices para Performance

```sql
idx_estoque_historico_produto_id    -- Busca por produto
idx_estoque_historico_loja_id       -- Busca por loja
idx_estoque_historico_usuario_id    -- Busca por usuário
idx_estoque_historico_created_at    -- Ordenação por data
idx_estoque_historico_tipo_operacao -- Filtro por tipo
```

## 🚀 Integração Futura

### Pontos de Integração

O sistema está preparado para registrar histórico em:

1. **Vendas** (`tipo_operacao: "venda"`)
   - Quando um produto é vendido
   - Registrar saída automática do estoque

2. **Devoluções** (`tipo_operacao: "devolucao"`)
   - Quando um item é devolvido
   - Registrar entrada de volta ao estoque

3. **Transferências** (`tipo_operacao: "transferencia"`)
   - Quando mover produtos entre lojas
   - Registrar saída de uma loja e entrada em outra

4. **Compras** (`tipo_operacao: "entrada_estoque"`)
   - Quando adicionar novos produtos de fornecedores

### Exemplo de Integração em Vendas

```typescript
// Em app/sistema/vendas/page.tsx
async function finalizarVenda(venda: Venda) {
  // Finalizar venda...
  
  // Registrar histórico para cada item vendido
  for (const item of venda.itens) {
    await registrarHistoricoEstoque(
      item.produto_id,
      venda.loja_id,
      item.quantidade_anterior,
      item.quantidade_anterior - item.quantidade,
      "venda",
      `Venda #${venda.id} - Cliente: ${venda.cliente_nome}`
    );
  }
}
```

## 📈 Benefícios

1. **Auditoria Completa**: Rastreamento de todas as alterações
2. **Responsabilização**: Saber quem fez cada alteração
3. **Análise de Movimentação**: Entender padrões de entrada/saída
4. **Resolução de Conflitos**: Investigar discrepâncias de estoque
5. **Compliance**: Atender requisitos de auditoria e regulamentação
6. **Transparência**: Histórico acessível para gestores

## 🔍 Consultas Úteis

### Histórico de um produto específico

```sql
SELECT * FROM estoque_historico
WHERE produto_id = 123
ORDER BY created_at DESC;
```

### Alterações por usuário

```sql
SELECT * FROM estoque_historico
WHERE usuario_id = 'uuid-do-usuario'
ORDER BY created_at DESC;
```

### Movimentações de uma loja

```sql
SELECT * FROM estoque_historico
WHERE loja_id = 1
ORDER BY created_at DESC;
```

### Grandes alterações (±10 unidades)

```sql
SELECT * FROM estoque_historico
WHERE ABS(quantidade_alterada) >= 10
ORDER BY created_at DESC;
```

### Resumo de movimentação por tipo

```sql
SELECT 
  tipo_operacao,
  COUNT(*) as total_operacoes,
  SUM(quantidade_alterada) as total_alterado
FROM estoque_historico
GROUP BY tipo_operacao;
```

## 📝 Próximos Passos

- [ ] Integrar com sistema de vendas
- [ ] Integrar com sistema de devoluções
- [ ] Implementar transferências entre lojas
- [ ] Criar relatórios de movimentação
- [ ] Adicionar filtros no modal de histórico (por data, usuário, loja)
- [ ] Exportar histórico para Excel/PDF
- [ ] Dashboard de movimentação de estoque

## 🐛 Tratamento de Erros

O sistema foi projetado para **não bloquear** operações principais:

```typescript
try {
  await registrarHistoricoEstoque(...);
} catch (error) {
  console.error("❌ Erro ao registrar histórico:", error);
  // Continua com a operação principal
}
```

Isso garante que falhas no registro de histórico não impeçam alterações críticas de estoque.
