/**
 * Tipos TypeScript para o módulo de Devoluções
 */

export interface VendaItem {
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

export interface Venda {
  id: number;
  data_venda: string;
  id_cliente?: number;
  cliente_nome?: string;
  loja_id?: number;
  id_usuario?: string;
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
  credito_usado: number;
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: string;
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ItemDevolucao {
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

export interface Devolucao {
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
  created_at?: string;
  updated_at?: string;
}

export interface FilterState {
  search: string;
  tipo: string;
  motivo: string;
  creditoAplicado: string;
  cliente: string;
  orderBy: string;
  direction: "asc" | "desc";
  inicio: string;
  fim: string;
  valorMin: string;
  valorMax: string;
}

export interface DevolucaoStats {
  total: number;
  valorTotal: number;
  totalParciais: number;
  totalCompletas: number;
  creditosPendentes: number;
  creditosAplicados: number;
  valorCreditoPendente: number;
  valorCreditoAplicado: number;
}

export interface DevolucaoPermissions {
  ver_devolucoes: boolean;
  criar_devolucoes: boolean;
  editar_devolucoes: boolean;
  deletar_devolucoes: boolean;
  processar_creditos: boolean;
}

// Constantes
export const MOTIVOS_DEVOLUCAO = [
  { key: "produto_defeituoso", label: "Produto Defeituoso" },
  { key: "produto_errado", label: "Produto Errado" },
  { key: "nao_atendeu_expectativa", label: "Não Atendeu Expectativa" },
  { key: "arrependimento", label: "Arrependimento da Compra" },
  { key: "entrega_atrasada", label: "Entrega Atrasada" },
  { key: "duplicidade", label: "Duplicidade de Compra" },
  { key: "outro", label: "Outro" },
] as const;

export const STATUS_CREDITO = [
  { key: true, label: "Aplicado", color: "success" as const },
  { key: false, label: "Pendente", color: "warning" as const },
] as const;

export const TIPO_DEVOLUCAO = [
  { key: "total", label: "Total", color: "danger" as const },
  { key: "parcial", label: "Parcial", color: "warning" as const },
] as const;

export const ORDER_FIELDS = [
  { key: "data_devolucao", label: "Data" },
  { key: "cliente_nome", label: "Cliente" },
  { key: "valor_total_devolvido", label: "Valor" },
  { key: "tipo_devolucao", label: "Tipo" },
  { key: "motivo_devolucao", label: "Motivo" },
  { key: "id_venda", label: "Venda" },
] as const;

export const PAGE_SIZE = 15;
