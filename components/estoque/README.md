# Componentes de Estoque

Sistema modular para gerenciamento de estoque de produtos com suporte a múltiplas lojas.

## 📦 Componentes

### EstoqueStats

Estatísticas e métricas do estoque.

**Props:**

- `produtos: EstoqueItem[]` - Array de produtos para calcular estatísticas

**Métricas exibidas:**

- Total de produtos cadastrados
- Total de itens em estoque
- Valor total em estoque (custo de compra)
- Valor total em estoque (preço de venda)
- Margem média de lucro
- Produtos abaixo do estoque mínimo
- Produtos sem estoque

**Recursos:**

- 7 cards informativos com ícones coloridos
- Valores formatados em R$
- Design responsivo (1-7 colunas)
- Indicadores visuais de alerta

### EstoqueFilters

Barra de filtros e busca.

**Props:**

- `searchTerm: string` - Termo de busca atual
- `onSearchChange: (value: string) => void` - Callback de busca
- `selectedLoja: number | null` - Loja selecionada
- `onLojaChange: (lojaId: number | null) => void` - Callback de filtro por loja
- `lojas: Loja[]` - Lista de lojas disponíveis
- `onAddClick: () => void` - Callback do botão adicionar
- `canCreate: boolean` - Permissão para criar produtos

**Funcionalidades:**

- Busca por descrição, marca, modelo, compatível
- Filtro por loja
- Botão adicionar responsivo
- Campo clearable

### PhotoCarousel

Carrossel de fotos do produto.

**Props:**

- `photos: string[]` - URLs das fotos
- `alt?: string` - Texto alternativo
- `size?: "sm" | "md" | "lg"` - Tamanho do carrossel

**Recursos:**

- Navegação entre fotos (anterior/próxima)
- Indicadores visuais (bolinhas)
- Contador de fotos (1/3, 2/3, etc.)
- Fallback quando sem foto
- Responsivo
- Tamanhos customizáveis

### EstoqueCard

Card individual de produto.

**Props:**

- `produto: EstoqueItem` - Dados do produto
- `lojas: Loja[]` - Lista de lojas
- `onEdit: (produto: EstoqueItem) => void` - Callback de edição
- `onDelete: (id: number) => void` - Callback de exclusão
- `canEdit: boolean` - Permissão para editar
- `canDelete: boolean` - Permissão para deletar

**Recursos:**

- Carrossel de fotos integrado
- Chips de marca e modelo
- Preços de compra e venda
- Cálculo de margem de lucro
- Quantidade total e por loja
- Status visual do estoque:
  - ✅ **Em Estoque** (verde) - Acima do mínimo
  - ⚠️ **Abaixo do Mínimo** (amarelo) - Crítico
  - ❌ **Sem Estoque** (vermelho) - Zerado
- Lista de estoque por loja
- Observações truncadas
- Dropdown menu com ações

## 🎯 Uso

```tsx
import {
  EstoqueStats,
  EstoqueFilters,
  EstoqueCard,
  PhotoCarousel,
  type EstoqueItem,
} from "@/components/estoque";

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<EstoqueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoja, setSelectedLoja] = useState<number | null>(null);

  // Estatísticas
  <EstoqueStats produtos={produtos} />

  // Filtros
  <EstoqueFilters
    searchTerm={searchTerm}
    onSearchChange={setSearchTerm}
    selectedLoja={selectedLoja}
    onLojaChange={setSelectedLoja}
    lojas={lojas}
    onAddClick={handleAdd}
    canCreate={canCreateEstoque}
  />

  // Grid de produtos
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {produtosFiltrados.map((produto) => (
      <EstoqueCard
        key={produto.id}
        produto={produto}
        lojas={lojas}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditEstoque}
        canDelete={canDeleteEstoque}
      />
    ))}
  </div>

  // Ou use o carrossel separadamente
  <PhotoCarousel photos={produto.fotourl} alt={produto.descricao} size="lg" />
}
```

## 🔒 Permissões

- `ver_estoque` - Visualizar lista de produtos
- `criar_estoque` - Adicionar novos produtos
- `editar_estoque` - Editar produtos existentes
- `deletar_estoque` - Excluir produtos

## 📋 Tipos

```typescript
interface EstoqueItem {
  id: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  compativel?: string;
  minimo?: number;
  preco_compra?: number;
  preco_venda?: number;
  fotourl?: string[];
  observacoes?: string;
  estoque_lojas?: EstoqueLoja[];
  quantidade_total?: number;
}

interface EstoqueLoja {
  id: number;
  produto_id: number;
  loja_id: number;
  quantidade: number;
  updatedat: string;
}

interface Loja {
  id: number;
  nome: string;
  endereco?: string;
  telefone?: string;
}
```

## 🎨 Funcionalidades

1. **Gerenciamento Multi-Loja**

   - Estoque separado por loja
   - Visualização consolidada
   - Filtro por loja específica

2. **Status Inteligente**

   - Detecção automática de estoque baixo
   - Alertas visuais (cores e ícones)
   - Indicador de produtos sem estoque

3. **Cálculos Automáticos**

   - Quantidade total (soma de todas as lojas)
   - Margem de lucro por produto
   - Valor total em estoque
   - Média de margem

4. **Interface Rica**

   - Cards visuais com fotos
   - Carrossel de múltiplas fotos
   - Chips informativos
   - Tooltips explicativos

5. **Busca e Filtros**
   - Busca em múltiplos campos
   - Filtro por loja
   - Paginação integrada

## 📊 Estrutura da Página Original

**Página atual:** 2061 linhas

- Estados complexos de formulário
- Upload de múltiplas fotos
- Gerenciamento de estoque por loja
- Modals de criar/editar
- Paginação customizada

## 🚀 Benefícios da Componentização

1. **Cards Reutilizáveis** - EstoqueCard pode ser usado em outras páginas
2. **Carrossel Genérico** - PhotoCarousel serve para qualquer lista de fotos
3. **Estatísticas Modulares** - Fácil adicionar/remover métricas
4. **Filtros Independentes** - Lógica separada da apresentação
5. **Type-Safety** - TypeScript completo
6. **Manutenibilidade** - Código organizado e testável

## 🎯 Integração

A página principal (`page.tsx`) mantém:

- Lógica de negócio (CRUD)
- Gerenciamento de estado
- Modals de formulário
- Upload de arquivos
- Paginação

Os componentes fornecem:

- Interface visual
- Cards e filtros
- Estatísticas
- Carrossel de fotos

## 📈 Melhorias Futuras

- [ ] Componente EstoqueModal para formulário
- [ ] Componente EstoqueTable para visão tabular
- [ ] Hook useEstoque para lógica de negócio
- [ ] Exportação para Excel/PDF
- [ ] Gráficos de tendência de estoque
- [ ] Sistema de código de barras
- [ ] Histórico de movimentações
- [ ] Alertas automáticos de reposição
