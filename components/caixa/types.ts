// Tipos compartilhados para o sistema de caixa

export interface CaixaAberto {
  id: number;
  loja_id: number;
  usuario_id: string;
  data_abertura: string;
  valor_inicial: number;
  status: "aberto" | "fechado";
  data_fechamento?: string;
  valor_final?: number;
  observacoes_abertura?: string;
  observacoes_fechamento?: string;
}

export interface Venda {
  id: number;
  loja_id: number;
  valor_total?: number; // Pode vir como valor_total
  total_liquido?: number; // Ou como total_liquido (dependendo da origem)
  credito_usado?: number; // NOVO: Valor de crédito do cliente usado na compra
  data_venda: string;
  status: string;
  status_pagamento?: string; // NOVO: Status do pagamento (pago, pendente, etc)
  data_pagamento?: string | null; // NOVO: Data/hora em que foi marcado como pago
  forma_pagamento?: string;
  pagamento_detalhes?: Record<string, number> | null; // NOVO: Detalhes de pagamentos múltiplos (ex: {"pix": 150, "dinheiro": 100})
  cliente_nome?: string;
  observacoes?: string;
  itens?: any[]; // Itens da venda
}

export interface Loja {
  id: number;
  nome: string;
  endereco?: string;
}

export interface ResumoVendas {
  totalVendas: number;
  valorTotalVendas: number;
  valorDinheiro: number;
  valorPix: number;
  valorCartaoDebito: number;
  valorCartaoCredito: number;
  valorTransferencia: number;
  valorBoleto: number;
  valorCrediario: number;
  valorFiado: number;
  ticketMedio: number;
  // Devoluções
  totalDevolvidas: number; // Quantidade de vendas com status "devolvido"
  valorTotalDevolvido: number; // Valor total das vendas devolvidas
}

export interface FormAbrir {
  loja_id: string;
  valor_inicial: string;
  observacoes_abertura: string;
}

export interface FormFechar {
  valor_final: string;
  observacoes_fechamento: string;
}

export interface Sangria {
  id: number;
  caixa_id: number;
  valor: number;
  motivo: string;
  data_sangria: string;
  usuario_id: string;
  status: "ativa" | "cancelada";
  motivo_cancelamento?: string;
  data_cancelamento?: string;
  usuario_cancelamento_id?: string;
  created_at?: string;
}

export interface FormSangria {
  valor: string;
  motivo: string;
}
