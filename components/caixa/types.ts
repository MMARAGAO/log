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
  valor_total: number;
  data_venda: string;
  status: string;
  forma_pagamento?: string;
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
