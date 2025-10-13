# 📊 Dashboard - Componentes Modularizados

## 📁 Estrutura de Arquivos

```
components/dashboard/
├── index.ts                      # Exportações centralizadas
├── types.ts                      # Interfaces TypeScript
├── KPICard.tsx                   # Card de métricas (reutilizável)
├── FiltroPeriodo.tsx             # Filtro de datas com shortcuts
├── VendasChart.tsx               # Gráfico de evolução de vendas
├── ProdutosChart.tsx             # Gráfico de produtos mais vendidos
├── FormasPagamentoChart.tsx      # Gráfico de formas de pagamento
├── OrdensStatus.tsx              # Card de status das ordens
├── EstoqueStatus.tsx             # Card de status do estoque
└── DashboardPDFGenerator.tsx     # Gerador de relatórios em PDF
```

## 🎨 Componentes

### 1. **KPICard**

Card reutilizável para exibir métricas principais.

**Props:**

- `title` - Título da métrica
- `value` - Valor a ser exibido
- `icon` - Ícone React Node
- `color` - Cor do tema (primary, success, danger, warning, default)
- `subtitle` - (Opcional) Texto adicional
- `trend` - (Opcional) Tendência com porcentagem

**Exemplo:**

```tsx
<KPICard
  title="Total de Vendas"
  value={150}
  icon={<ShoppingCartIcon className="w-8 h-8" />}
  color="primary"
  subtitle="R$ 50.000,00 em receita"
/>
```

### 2. **FiltroPeriodo**

Componente para filtrar dados por período com atalhos rápidos.

**Props:**

- `dateStart`, `dateEnd` - Datas de início e fim
- `onDateStartChange`, `onDateEndChange` - Callbacks de mudança
- `selectedPeriod` - Período selecionado (7, 15, 30, 60, 90 dias)
- `onPeriodChange` - Callback de mudança de período
- `showFilters`, `onToggleFilters` - Controle de exibição

**Atalhos:**

- 7 dias
- 15 dias
- 30 dias (padrão)
- 60 dias
- 90 dias

### 3. **VendasChart**

Gráfico de área mostrando evolução de vendas e receita.

**Props:**

- `data` - Array de ChartDataItem com: date, receita, vendas

**Features:**

- Gradiente personalizado
- Tooltip customizado
- Duas áreas: Receita e Nº de Vendas

### 4. **ProdutosChart**

Gráfico de barras horizontais dos produtos mais vendidos.

**Props:**

- `data` - Array de ProdutoVendidoItem com: produto, quantidade, valor

**Features:**

- Top 10 produtos automático
- Barras com bordas arredondadas
- Cores do tema

### 5. **FormasPagamentoChart**

Gráfico de pizza com distribuição de formas de pagamento.

**Props:**

- `data` - Array de FormasPagamentoItem com: forma, total, quantidade

**Features:**

- 8 cores distintas
- Labels com porcentagem
- Tooltip com valores formatados

### 6. **OrdensStatus**

Card com resumo e progresso das ordens de serviço.

**Props:**

- `ordens` - Array de Ordem

**Métricas Exibidas:**

- Ordens Abertas (warning)
- Ordens em Andamento (primary)
- Ordens Concluídas (success)
- Taxa de Conclusão (progress bar)
- Total no Período

### 7. **EstoqueStatus**

Card com status e alertas do estoque.

**Props:**

- `info` - EstoqueInfo com: valorTotal, totalProdutos, produtosAbaixoMinimo, produtosSemEstoque

**Features:**

- Status geral com cores dinâmicas
- Progress bar de saúde do estoque
- Alerta visual para produtos sem estoque
- Valor total em estoque

### 8. **DashboardPDFGenerator**

Classe estática para geração de relatórios em PDF.

**Método:**

```tsx
DashboardPDFGenerator.gerar(
  periodo: { inicio: string, fim: string },
  kpis: KPIData,
  produtos: ProdutoVendidoItem[],
  formasPagamento: FormasPagamentoItem[],
  vendasPorLoja: VendasPorLojaItem[],
  topClientes: TopClienteItem[],
  topVendedores: TopVendedorItem[],
  estoqueInfo: EstoqueInfo
)
```

**Seções do PDF:**

1. 📊 Cabeçalho com período
2. 💰 Indicadores Principais
3. 📈 Vendas e Devoluções
4. 🔧 Ordens de Serviço
5. 📦 Top 10 Produtos
6. 💳 Formas de Pagamento
7. 🏪 Vendas por Loja
8. 👥 Top 10 Clientes
9. 💼 Top 10 Vendedores
10. 📊 Status do Estoque
11. 📋 Resumo Geral
12. Rodapé com paginação

**Formato:** PDF multipáginas com tabelas e formatação profissional.

## 📊 Types (Interfaces)

### Principais Interfaces:

- **Venda** - Dados de vendas
- **Estoque** - Produtos
- **EstoqueLoja** - Estoque por loja
- **Cliente** - Clientes
- **Ordem** - Ordens de serviço
- **Usuario** - Usuários/Vendedores
- **Loja** - Lojas
- **Transferencia** - Transferências entre lojas
- **Devolucao** - Devoluções
- **Fornecedor** - Fornecedores

### Interfaces de Dados Processados:

- **KPIData** - Todos os KPIs calculados
- **ChartDataItem** - Dados para gráfico de vendas
- **ProdutoVendidoItem** - Produtos com quantidade e valor
- **FormasPagamentoItem** - Formas de pagamento agregadas
- **VendasPorLojaItem** - Performance por loja
- **TopClienteItem** - Clientes com totais
- **TopVendedorItem** - Vendedores com totais
- **EstoqueInfo** - Informações consolidadas do estoque

## 🎯 Benefícios da Componentização

### ✅ **Antes (page.tsx original):**

- 1300 linhas em um único arquivo
- Difícil manutenção
- Código duplicado
- Difícil testar

### ✅ **Depois (componentizado):**

- **page.tsx:** ~600 linhas (lógica de negócio)
- **8 componentes reutilizáveis:** ~1200 linhas total
- Fácil manutenção
- Componentes testáveis individualmente
- Reutilização em outras páginas
- Código organizado e legível

## 🚀 Como Usar

### Importação:

```tsx
import {
  KPICard,
  FiltroPeriodo,
  VendasChart,
  ProdutosChart,
  FormasPagamentoChart,
  OrdensStatus,
  EstoqueStatus,
  DashboardPDFGenerator,
  type KPIData,
  // ... outros types
} from "@/components/dashboard";
```

### Exemplo Completo:

```tsx
// 1. Calcular dados
const kpis = useMemo(() => {
  // ... cálculos
  return { totalVendas, receita, ... };
}, [vendasFiltradas]);

// 2. Usar componentes
<KPICard
  title="Total de Vendas"
  value={kpis.totalVendas}
  icon={<ShoppingCartIcon />}
  color="primary"
/>

<VendasChart data={chartData} />

// 3. Exportar PDF
<Button onPress={() => {
  DashboardPDFGenerator.gerar(
    { inicio: dateStart, fim: dateEnd },
    kpis,
    produtos,
    formasPagamento,
    vendasPorLoja,
    topClientes,
    topVendedores,
    estoqueInfo
  );
}}>
  Exportar PDF
</Button>
```

## 📦 Dependências

- **jspdf** - Geração de PDF
- **jspdf-autotable** - Tabelas em PDF
- **recharts** - Gráficos React
- **@heroui/react** - Componentes UI
- **@heroicons/react** - Ícones

## 🎨 Paleta de Cores

```tsx
const COLORS = [
  "#3B82F6", // primary
  "#10B981", // success
  "#FACC15", // warning
  "#F43F5E", // danger
  "#8B5CF6", // purple
  "#14B8A6", // teal
  "#FB923C", // orange
  "#EC4899", // pink
];
```

## 📄 Backup

O arquivo original foi salvo como:
`app/sistema/dashboard/page.backup.tsx`

## 🔧 Manutenção

Para adicionar novos KPIs ou gráficos:

1. Adicione o type em `types.ts`
2. Crie o componente em `components/dashboard/`
3. Exporte em `index.ts`
4. Use no `page.tsx`

## 📊 Performance

- **useMemo** para cálculos pesados
- Componentes otimizados
- Renderização condicional
- Loading states adequados

---

✨ **Dashboard totalmente modularizado e pronto para produção!**
