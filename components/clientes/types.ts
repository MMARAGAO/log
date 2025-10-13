/**
 * Tipos TypeScript para o módulo de Clientes
 */

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  doc: string;
  endereco?: string;
  instagram?: string;
  whatsapp: boolean;
  fotourl?: string[];
  credito?: number;
  createdat?: string;
  updatedat?: string;
}

export interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  doc: string;
  endereco: string;
  instagram: string;
  whatsapp: boolean;
}

export interface ClientePermissions {
  ver_clientes: boolean;
  criar_clientes: boolean;
  editar_clientes: boolean;
  deletar_clientes: boolean;
}

export type TipoDocumento = "PF" | "PJ" | null;

export interface ClienteStats {
  total: number;
  pessoasFisicas: number;
  pessoasJuridicas: number;
  comWhatsapp: number;
  comInstagram: number;
  creditoTotal: number;
}
