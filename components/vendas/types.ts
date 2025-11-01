/**
 * Types para o sistema de vendas
 */

import {
  ClockIcon,
  CheckCircleIcon,
  HandRaisedIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

export interface Cliente {
  id: number;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
  doc?: string | null;
}

export interface Loja {
  id: number;
  nome: string;
  endereco?: string | null;
  telefone?: string | null;
  fotourl?: string[] | null;
  descricao?: string | null;
}

export interface EstoqueItem {
  id: number;
  descricao: string | null;
  modelo?: string | null;
  marca?: string | null;
  preco_venda?: number | null;
  fotourl?: string[] | null;
  quantidade?: number | null;
  loja_id?: number | null;
}

export interface Usuario {
  uuid: string;
  nome: string | null;
  email?: string | null;
  cargo?: string | null;
  fotourl?: string[] | null;
}

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
  id_usuario?: string;
  loja_id?: number;
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
  credito_usado?: number;
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  data_pagamento?: string | null; // NOVO: Data/hora em que foi marcado como pago
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type StatusPagamento =
  | "pago"
  | "pendente"
  | "cancelado"
  | "vencido"
  | "fiado"
  | "devolvido";

export const STATUS_OPTIONS = [
  { key: "pendente", label: "Pendente", color: "warning", icon: ClockIcon },
  { key: "pago", label: "Pago", color: "success", icon: CheckCircleIcon },
  { key: "fiado", label: "Fiado", color: "secondary", icon: HandRaisedIcon },
  {
    key: "vencido",
    label: "Vencido",
    color: "danger",
    icon: ExclamationTriangleIcon,
  },
  { key: "cancelado", label: "Cancelado", color: "default", icon: XMarkIcon },
  {
    key: "devolvido",
    label: "Devolvido",
    color: "danger",
    icon: ArrowPathIcon,
  },
];

export const PAGAMENTO_OPTIONS: {
  key: string;
  label: string;
  icon: any;
}[] = [
  { key: "Dinheiro", label: "Dinheiro", icon: BanknotesIcon },
  { key: "PIX", label: "PIX", icon: DevicePhoneMobileIcon },
  { key: "Cartão de Débito", label: "Cartão Débito", icon: CreditCardIcon },
  { key: "Cartão de Crédito", label: "Cartão Crédito", icon: CreditCardIcon },
  { key: "Transferência", label: "Transferência", icon: BuildingLibraryIcon },
  { key: "Boleto", label: "Boleto", icon: DocumentTextIcon },
  { key: "Crediário", label: "Crediário", icon: CalendarDaysIcon },
  { key: "Fiado", label: "Fiado", icon: HandRaisedIcon },
];

export const ORDER_FIELDS = [
  { key: "id", label: "ID" },
  { key: "data_venda", label: "Data" },
  { key: "cliente_nome", label: "Cliente" },
  { key: "total_liquido", label: "Valor" },
  { key: "valor_restante", label: "Restante" },
  { key: "status_pagamento", label: "Status" },
  { key: "forma_pagamento", label: "Pagamento" },
  { key: "data_vencimento", label: "Vencimento" },
];

export interface FilterState {
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
  filtrarPorDataPagamento: boolean; // true = data_pagamento (Caixa), false = data_venda (padrão)
}

export interface VendasStats {
  count: number;
  pagas: number;
  faturamento: number;
  ticket: number;
  receber: number;
  vencidas: number;
  devolvidas: number;
  totalDevolvido: number;
}

export interface VendasPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export const PAGE_SIZE = 15;
