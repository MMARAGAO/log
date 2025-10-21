export interface Ordem {
  id: number;
  modelo: string;
  cor?: string;
  defeito?: string;
  diagnostico?: string;
  entrada?: string;
  saida?: string;
  forma_pagamento?: string;
  status: string;
  garantia: boolean;
  periodo_garantia?: string;
  observacoes?: string;
  prazo?: string;
  prioridade: string;
  tecnico_responsavel?: string;
  valor?: number;
  id_cliente?: number;
  fotourl?: string[];
  created_at?: string;
  updated_at?: string;
}
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
