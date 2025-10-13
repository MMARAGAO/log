# Componentes de Vendas

Componentes React para o sistema de gestão de vendas.

## 📁 Estrutura

```
components/vendas/
├── types.ts              # Definições de tipos TypeScript
├── VendasStats.tsx       # Componente de estatísticas
├── VendasFilters.tsx     # Componente de filtros e busca
├── index.ts              # Barrel exports
└── README.md             # Este arquivo
```

## 🎯 Componentes

### VendasStats

Exibe métricas principais das vendas em cards.

**Props:**

```typescript
interface VendasStatsProps {
  stats: VendasStats;
  formatCurrency: (value: number) => string;
}
```

**Métricas exibidas:**

- Total de vendas (com quantidade de pagas)
- Faturamento (com ticket médio)
- A receber (valor pendente em laranja)
- Vencidas (em vermelho se houver)

**Exemplo de uso:**

```tsx
import { VendasStats } from "@/components/vendas";

const stats = {
  count: 150,
  pagas: 120,
  faturamento: 45000,
  ticket: 300,
  receber: 9000,
  vencidas: 5,
};

<VendasStats
  stats={stats}
  formatCurrency={(v) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }
/>;
```

### VendasFilters

Barra de busca, ordenação e filtros para vendas.

**Props:**

```typescript
interface VendasFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  orderBy: string;
  onOrderByChange: (value: string) => void;
  direction: "asc" | "desc";
  onDirectionToggle: () => void;
  onClearFilters: () => void;
  showFiltersPanel: boolean;
  onToggleFiltersPanel: () => void;
  onAddClick: () => void;
  canCreate: boolean;
  hasActiveFilters: boolean;
}
```

**Funcionalidades:**

- Campo de busca com ícone e clear button
- Seletor de ordenação (data, cliente, valor, status, etc.)
- Botão de direção (crescente/decrescente)
- Botão de toggle para painel de filtros avançados
- Botão de limpar filtros (aparece apenas se houver filtros ativos)
- Botão de adicionar venda (aparece apenas se tiver permissão)

**Exemplo de uso:**

```tsx
import { VendasFilters } from "@/components/vendas";

<VendasFilters
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  orderBy={filters.orderBy}
  onOrderByChange={(value) => setFilters((p) => ({ ...p, orderBy: value }))}
  direction={filters.direction}
  onDirectionToggle={() =>
    setFilters((p) => ({
      ...p,
      direction: p.direction === "asc" ? "desc" : "asc",
    }))
  }
  onClearFilters={handleClearFilters}
  showFiltersPanel={showFilters}
  onToggleFiltersPanel={() => setShowFilters(!showFilters)}
  onAddClick={handleAddVenda}
  canCreate={canCreateVendas}
  hasActiveFilters={searchTerm !== "" || filters.status !== ""}
/>;
```

## 📊 Types

### Principais Interfaces

**Venda:**

```typescript
interface Venda {
  id: number;
  data_venda: string;
  id_cliente?: number;
  cliente_nome?: string;
  id_usuario?: string;
  loja_id?: number;
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
  credito_usado?: number;
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
}
```

**VendaItem:**

```typescript
interface VendaItem {
  id_estoque: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  subtotal: number;
  foto?: string;
}
```

**StatusPagamento:**

```typescript
type StatusPagamento =
  | "pago"
  | "pendente"
  | "cancelado"
  | "vencido"
  | "fiado"
  | "devolvido";
```

**FilterState:**

```typescript
interface FilterState {
  search: string;
  status: string;
  pagamento: string;
  vencidas: boolean;
  cliente: string;
  loja: string;
  orderBy: string;
  direction: "asc" | "desc";
  inicio: string;
  fim: string;
  valorMin: string;
  valorMax: string;
}
```

### Constantes

**STATUS_OPTIONS:**
Array com opções de status (pendente, pago, fiado, vencido, cancelado, devolvido).

**PAGAMENTO_OPTIONS:**
Array com formas de pagamento (Dinheiro, PIX, Cartões, Transferência, Boleto, Crediário, Fiado).

**ORDER_FIELDS:**
Array com campos de ordenação disponíveis.

## 🎨 Características

### Design

- **Responsivo**: Grid adaptativo (2 colunas em tablet, 4 em desktop)
- **Tema**: Suporte a dark mode através do HeroUI
- **Cores**: Códigos de cor semânticos (verde para pago, laranja para pendente, vermelho para vencido)
- **Ícones**: Heroicons 24 outline para consistência visual

### Acessibilidade

- Labels descritivos
- Tooltips informativos
- Cores com bom contraste
- Suporte a navegação por teclado

### Performance

- Componentes leves e focados
- Re-renders otimizados
- Formatação de moeda através de prop function

## 🔧 Integração

### 1. Importar componentes

```tsx
import { VendasStats, VendasFilters } from "@/components/vendas";
import type {
  Venda,
  VendasStats as StatsType,
  FilterState,
} from "@/components/vendas";
```

### 2. Configurar estado

```tsx
const [vendas, setVendas] = useState<Venda[]>([]);
const [filters, setFilters] = useState<FilterState>({
  search: "",
  status: "",
  pagamento: "",
  vencidas: false,
  cliente: "",
  loja: "",
  orderBy: "data_venda",
  direction: "desc",
  inicio: "",
  fim: "",
  valorMin: "",
  valorMax: "",
});
const [showFilters, setShowFilters] = useState(false);
```

### 3. Calcular estatísticas

```tsx
const stats: StatsType = useMemo(() => {
  const count = vendas.length;
  const pagas = vendas.filter((v) => v.status_pagamento === "pago").length;
  const faturamento = vendas.reduce((acc, v) => acc + v.total_liquido, 0);
  const ticket = count > 0 ? faturamento / count : 0;
  const receber = vendas.reduce((acc, v) => acc + v.valor_restante, 0);
  const vencidas = vendas.filter(
    (v) =>
      v.fiado && v.data_vencimento && new Date(v.data_vencimento) < new Date()
  ).length;

  return { count, pagas, faturamento, ticket, receber, vencidas };
}, [vendas]);
```

### 4. Renderizar componentes

```tsx
<VendasStats stats={stats} formatCurrency={formatCurrency} />
<VendasFilters
  searchTerm={filters.search}
  onSearchChange={(value) => setFilters(p => ({ ...p, search: value }))}
  orderBy={filters.orderBy}
  onOrderByChange={(value) => setFilters(p => ({ ...p, orderBy: value }))}
  direction={filters.direction}
  onDirectionToggle={() => setFilters(p => ({
    ...p,
    direction: p.direction === "asc" ? "desc" : "asc"
  }))}
  onClearFilters={() => setFilters(initialFilters)}
  showFiltersPanel={showFilters}
  onToggleFiltersPanel={() => setShowFilters(!showFilters)}
  onAddClick={() => setModalOpen(true)}
  canCreate={canCreateVendas}
  hasActiveFilters={filters.search !== "" || filters.status !== ""}
/>
```

## 📝 Notas

### Tabela de Vendas

A tabela de vendas **não foi componentizada** devido à alta complexidade:

- Lógica de cálculo de status dinâmico
- Múltiplos modais (visualização, edição, pagamento, exclusão)
- Validações complexas de permissões
- Integração com múltiplas tabelas (clientes, estoque, usuários)
- Gestão de itens de venda com cálculos em tempo real

A tabela foi mantida no arquivo principal `page.tsx` por ter mais de 2000 linhas de lógica de negócio embutida.

### Filtros Avançados

O painel de filtros avançados (por status, pagamento, cliente, loja, datas, valores) também foi mantido na página principal devido à complexidade e dependências com o estado local.

### Créditos

Sistema de crédito usado em vendas (novo campo `credito_usado`) que permite aplicar crédito do cliente na venda.

## 🚀 Melhorias Futuras

- [ ] Componente VendaCard para visualização de detalhes
- [ ] Componente VendaItemCard para itens individuais
- [ ] Gráficos de vendas (linha temporal, pizza de pagamentos)
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Filtros avançados componentizados
- [ ] Testes unitários para componentes

## 📦 Dependências

- `@heroui/react` - Componentes UI (Card, Input, Select, Button)
- `@heroicons/react` - Ícones
- `react` - Framework base

## 📄 Licença

Parte do sistema interno de gestão.
