export interface Venda {
  id: number;
  data_venda: string;
  total_bruto: number;
  desconto: number;
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: string;
  valor_restante: number;
  valor_pago: number;
  fiado: boolean;
  data_vencimento?: string | null;
  itens: any[];
  cliente_nome?: string | null;
  id_cliente?: number | null;
  id_usuario?: string | null;
  loja_id?: number | null;
}

export interface Estoque {
  id: number;
  descricao: string | null;
  marca?: string | null;
  modelo?: string | null;
  preco_compra?: number | null;
  preco_venda?: number | null;
  minimo?: number | null;
}

export interface EstoqueLoja {
  id: number;
  produto_id: number;
  loja_id: number;
  quantidade: number;
}

export interface Cliente {
  id: number;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
  credito?: number | null;
  createdat?: string;
}

export interface Ordem {
  id: number;
  entrada?: string | null;
  saida?: string | null;
  status?: string | null;
  valor?: number | null;
  prioridade?: string | null;
  prazo?: string | null;
  tecnico_responsavel?: string | null;
  garantia?: boolean;
}

export interface Usuario {
  uuid: string;
  nome?: string | null;
  email?: string | null;
  fotourl?: string[] | null;
  credito?: number | null;
}

export interface Loja {
  id: number;
  nome: string;
  endereco?: string | null;
}

export interface Transferencia {
  id: number;
  loja_origem_id: number;
  loja_destino_id: number;
  data_transferencia: string;
  status: string;
}

export interface Devolucao {
  id: number;
  id_venda: number;
  data_devolucao: string;
  valor_total_devolvido: number;
  tipo_devolucao: string;
  credito_aplicado: boolean;
  valor_credito_gerado: number;
}

export interface Fornecedor {
  id: number;
  nome: string;
  ativo: boolean;
  data_cadastro: string;
}

export interface KPIData {
  totalVendas: number;
  receita: number;
  receitaBruta: number;
  descontos: number;
  aReceber: number;
  valorPago: number;
  fiadoVencido: number;
  ticket: number;
  margemDesconto: number;
  totalDevolucoes: number;
  valorDevolucoes: number;
  taxaDevolucao: number;
  totalOrdens: number;
  ordensAbertas: number;
  ordensConcluidas: number;
  taxaConclusao: number;
  valorOrdens: number;
  ticketOrdem: number;
  totalClientes: number;
  clientesAtivos: number;
  clientesNovos: number;
  totalUsuarios: number;
  totalLojas: number;
  totalFornecedores: number;
  fornecedoresAtivos: number;
}

export interface ChartDataItem {
  date: string;
  receita: number;
  vendas: number;
}

export interface ProdutoVendidoItem {
  produto: string;
  quantidade: number;
  valor: number;
}

export interface FormasPagamentoItem {
  forma: string;
  total: number;
  quantidade: number;
}

export interface VendasPorLojaItem {
  nome: string;
  total: number;
  vendas: number;
  ticket: number;
}

export interface TopClienteItem {
  nome: string;
  total: number;
  vendas: number;
  ticket: number;
}

export interface TopVendedorItem {
  nome: string;
  total: number;
  vendas: number;
  ticket: number;
}

export interface EstoqueInfo {
  valorTotal: number;
  totalProdutos: number;
  produtosAbaixoMinimo: number;
  produtosSemEstoque: number;
}
