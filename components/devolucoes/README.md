# Componentes de Devoluções

Sistema para gerenciamento de devoluções de vendas com suporte a devoluções parciais e totais, geração de créditos e processamento.

## 📦 Componentes

### DevolucaoStats

Estatísticas e métricas de devoluções.

**Props:**

- `devolucoes: Devolucao[]` - Array de devoluções para calcular estatísticas

**Métricas exibidas:**

- Total de devoluções
- Valor total devolvido
- Devoluções parciais vs completas
- Créditos aplicados vs pendentes
- Valores de créditos (aplicados e pendentes)

**Recursos:**

- 6 cards informativos
- Ícones coloridos por tipo
- Design responsivo (1/2/3/6 colunas)
- Valores formatados em R$

### DevolucaoFilters

Filtros avançados para devoluções.

**Props:**

- `filters: FilterState` - Estado atual dos filtros
- `onFiltersChange: (filters: FilterState) => void` - Callback de mudança
- `onAddClick: () => void` - Callback do botão adicionar
- `canCreate: boolean` - Permissão para criar devoluções
- `clientesOptions: Array<{id, nome}>` - Lista de clientes para filtro

**Funcionalidades:**

- Busca por texto (ID venda, cliente, motivo)
- Filtro por tipo (total/parcial)
- Filtro por motivo
- Filtro por status de crédito
- Filtro por cliente
- Filtro por data (início/fim)
- Filtro por valor (mínimo/máximo)
- Ordenação customizável
- Direção de ordenação (asc/desc)
- Limpar todos os filtros
- Painel expansível de filtros avançados

## 🎯 Estrutura da Página Original

A página original (`page.tsx` - 2220 linhas) possui:

### Estados e Dados

- `devolucoes` - Lista de devoluções
- `vendas` - Lista de vendas (para busca)
- `usuarios` - Lista de usuários
- `clientes` - Lista de clientes
- `lojas` - Lista de lojas

### Modais

- **DevolucaoModal** - Criar/editar devolução

  - Busca de venda com sugestões
  - Seleção de itens para devolver
  - Quantidade personalizável por item
  - Cálculo automático de valores
  - Motivo e observações
  - Seleção de loja

- **ViewModal** - Visualizar detalhes

  - Informações da venda original
  - Itens devolvidos
  - Valores e créditos
  - Histórico

- **DeleteModal** - Confirmar exclusão

- **CreditoModal** - Processar crédito
  - Aplicar crédito ao cliente
  - Atualizar saldo

### Funcionalidades Principais

1. **Busca de Vendas**

   - Autocompletar com sugestões
   - Busca por ID, cliente, data
   - Preview de informações

2. **Seleção de Itens**

   - Lista de produtos da venda
   - Quantidade editável
   - Motivo por item (opcional)
   - Cálculo de subtotal

3. **Cálculos Automáticos**

   - Valor total devolvido
   - Crédito gerado
   - Tipo de devolução (parcial/total)

4. **Processamento de Crédito**

   - Atualizar saldo do cliente
   - Marcar crédito como aplicado
   - Validações de permissão

5. **Tabela de Devoluções**

   - Paginação (15 por página)
   - Ordenação múltipla
   - Filtros avançados
   - Ações por linha (visualizar, editar, deletar, processar crédito)

6. **Permissões**
   - Ver devoluções
   - Criar devoluções
   - Editar devoluções
   - Deletar devoluções
   - Processar créditos

## 📋 Tipos Principais

```typescript
interface Devolucao {
  id: number;
  id_venda: number;
  data_devolucao: string;
  id_cliente?: number;
  cliente_nome?: string;
  id_usuario: string;
  itens_devolvidos: ItemDevolucao[];
  valor_total_devolvido: number;
  tipo_devolucao: "total" | "parcial";
  motivo_devolucao?: string;
  valor_credito_gerado: number;
  credito_aplicado: boolean;
  observacoes?: string;
}

interface ItemDevolucao {
  id_estoque: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  quantidade_original: number;
  quantidade_devolver: number;
  preco_unitario: number;
  desconto: number;
  subtotal_original: number;
  subtotal_devolucao: number;
  foto?: string;
  motivo_devolucao?: string;
}
```

## 🎨 Uso Atual

```tsx
import {
  DevolucaoStats,
  DevolucaoFilters,
  type Devolucao,
  type FilterState,
} from "@/components/devolucoes";

export default function DevolucoesPagina() {
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [filters, setFilters] = useState<FilterState>({...});

  // Estatísticas
  <DevolucaoStats devolucoes={devolucoes} />

  // Filtros
  <DevolucaoFilters
    filters={filters}
    onFiltersChange={setFilters}
    onAddClick={handleAdd}
    canCreate={canCreateDevolucoes}
    clientesOptions={clientes}
  />

  // Resto da página (tabela, modais, etc.)
}
```

## 🔒 Permissões

- `ver_devolucoes` - Visualizar lista de devoluções
- `criar_devolucoes` - Criar novas devoluções
- `editar_devolucoes` - Editar devoluções existentes
- `deletar_devolucoes` - Excluir devoluções
- `processar_creditos` - Aplicar créditos aos clientes

## ⚠️ Nota sobre Componentização

Devido à alta complexidade da página de devoluções (2220 linhas com lógica complexa de:

- Busca e seleção de vendas
- Cálculos de devoluções parciais
- Gerenciamento de estoque
- Processamento de créditos
- Múltiplos modais interconectados

Foram componentizados apenas:

- ✅ **DevolucaoStats** - Estatísticas (independente)
- ✅ **DevolucaoFilters** - Filtros avançados (independente)

A lógica principal permanece na página por enquanto, pois requer:

- Refatoração profunda da lógica de negócio
- Separação de concerns entre UI e lógica
- Criação de hooks customizados para gestão de estado
- Revisão da arquitetura de dados

## 🚀 Melhorias Futuras

Para componentização completa, seria necessário:

- [ ] Hook `useDevolucoes` para lógica de negócio
- [ ] Hook `useVendaSearch` para busca de vendas
- [ ] Hook `useCreditoProcessing` para processamento
- [ ] Componente `DevolucaoTable` independente
- [ ] Componente `DevolucaoFormModal` modular
- [ ] Componente `ItemSelectionTable` reutilizável
- [ ] Componente `CreditoProcessModal` separado
- [ ] Context API para estado compartilhado
- [ ] Separação de lógica de cálculo em utils

## 📊 Complexidade

**Página Atual:**

- 2220 linhas
- 50+ funções
- 30+ estados
- 4 modais complexos
- Integração com múltiplas tabelas
- Lógica de negócio entrelaçada

**Recomendação:** Manter estrutura atual até ter tempo para refatoração completa com testes adequados.
