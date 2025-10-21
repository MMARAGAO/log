export type EstadoAparelho = "novo" | "seminovo" | "usado";
export type StatusAparelho =
  | "disponivel"
  | "reservado"
  | "vendido"
  | "em_reparo"
  | "defeito";
export type StatusVenda = "pendente" | "pago" | "cancelado" | "estornado";
export type FormaPagamento =
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito"
  | "carteira_digital"
  | "misto";

export interface PagamentoDetalhes {
  dinheiro?: number;
  pix?: number;
  debito?: number;
  credito?: number;
  carteira_digital?: number;
  bandeira_cartao?: string;
  ultimos_digitos?: string;
  nsu?: string;
  autorizacao?: string;
}

export interface EstoqueAparelho {
  id?: number;
  created_at?: string;
  updated_at?: string;
  marca: string;
  modelo: string;
  imei?: string;
  serial?: string;
  cor?: string;
  capacidade?: string;
  estado: EstadoAparelho;
  bateria?: number;
  bloqueado?: boolean;
  bloqueio_tipo?: string;
  defeitos?: string[];
  acessorios?: string[];
  preco_compra?: number;
  preco_venda: number;
  custo_reparo?: number;
  status: StatusAparelho;
  loja_id?: number;
  fornecedor_id?: number;
  data_entrada?: string;
  nota_fiscal?: string;
  garantia_fornecedor_meses?: number;
  garantia_fornecedor_expira_em?: string;
  fotos?: string[];
  checklist_entrada?: any;
  observacoes?: string;
  usuario_cadastro_id?: string;
  venda_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VendaAparelho {
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  cliente_id?: number;
  cliente_nome: string;
  cliente_cpf?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  aparelho_marca: string;
  aparelho_modelo: string;
  aparelho_imei?: string;
  aparelho_serial?: string;
  aparelho_cor?: string;
  aparelho_capacidade?: string;
  aparelho_estado: EstadoAparelho;
  aparelho_bateria?: number;
  aparelho_defeitos?: string[];
  aparelho_acessorios?: string[];
  aparelho_observacoes?: string;
  aparelho_fotos?: string[];
  valor_aparelho: number;
  desconto: number;
  valor_final: number;
  forma_pagamento: FormaPagamento;
  pagamento_detalhes?: PagamentoDetalhes;
  parcelas: number;
  status: StatusVenda;
  loja_id?: number;
  vendedor_id?: string;
  garantia_meses: number;
  garantia_expira_em?: string;
  nota_fiscal?: string;
  termo_venda_url?: string;
  checklist_fotos?: string[];
  estoque_aparelho_id?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  doc?: string;
  endereco?: string;
  instagram?: string;
  whatsapp?: boolean;
}

export interface Usuario {
  uuid: string;
  nome: string;
  email?: string;
  nickname?: string;
}

export interface Loja {
  id: number;
  nome: string;
  endereco?: string;
  telefone?: string;
}
