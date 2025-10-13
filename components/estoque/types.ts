/**
 * Tipos TypeScript para o módulo de Estoque
 */

export interface EstoqueLoja {
  id: number;
  produto_id: number;
  loja_id: number;
  quantidade: number;
  updatedat: string;
}

export interface EstoqueItem {
  id: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  compativel?: string;
  minimo?: number;
  preco_compra?: number;
  preco_venda?: number;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  observacoes?: string;
  // Campos calculados
  estoque_lojas?: EstoqueLoja[];
  quantidade_total?: number;
}

export interface Loja {
  id: number;
  nome: string;
  endereco?: string;
  telefone?: string;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  descricao?: string;
}

export interface FormDataEstoque {
  descricao?: string;
  modelo?: string;
  marca?: string;
  compativel?: string;
  minimo?: number;
  preco_compra?: number;
  preco_venda?: number;
  observacoes?: string;
  // Estoque por loja
  estoque_lojas?: { [lojaId: number]: number };
}

export interface EstoqueStats {
  totalProdutos: number;
  totalItens: number;
  valorTotalCompra: number;
  valorTotalVenda: number;
  margemMedia: number;
  produtosAbaixoMinimo: number;
  produtosSemEstoque: number;
}

export interface EstoquePermissions {
  ver_estoque: boolean;
  criar_estoque: boolean;
  editar_estoque: boolean;
  deletar_estoque: boolean;
}

export const ITEMS_PER_PAGE = 12;

export const ORDER_FIELDS = [
  { key: "descricao", label: "Descrição" },
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "quantidade_total", label: "Quantidade" },
  { key: "preco_venda", label: "Preço" },
  { key: "minimo", label: "Estoque Mínimo" },
] as const;
