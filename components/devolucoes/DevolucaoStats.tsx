/**
 * DevolucaoStats - Componente de estatísticas de devoluções
 * Exibe métricas importantes sobre devoluções
 */

import { Card, CardBody } from "@heroui/react";
import {
  ArrowPathIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import type { Devolucao, DevolucaoStats as Stats } from "./types";

interface DevolucaoStatsProps {
  devolucoes: Devolucao[];
}

export default function DevolucaoStats({ devolucoes }: DevolucaoStatsProps) {
  // Calcula estatísticas
  const stats: Stats = {
    total: devolucoes.length,
    valorTotal: devolucoes.reduce(
      (sum, d) => sum + (d.valor_total_devolvido || 0),
      0
    ),
    totalParciais: devolucoes.filter((d) => d.tipo_devolucao === "parcial")
      .length,
    totalCompletas: devolucoes.filter((d) => d.tipo_devolucao === "total")
      .length,
    creditosPendentes: devolucoes.filter((d) => !d.credito_aplicado).length,
    creditosAplicados: devolucoes.filter((d) => d.credito_aplicado).length,
    valorCreditoPendente: devolucoes
      .filter((d) => !d.credito_aplicado)
      .reduce((sum, d) => sum + (d.valor_credito_gerado || 0), 0),
    valorCreditoAplicado: devolucoes
      .filter((d) => d.credito_aplicado)
      .reduce((sum, d) => sum + (d.valor_credito_gerado || 0), 0),
  };

  const statCards = [
    {
      label: "Total de Devoluções",
      value: stats.total,
      icon: ArrowPathIcon,
      color: "primary" as const,
      description: "Todas as devoluções",
    },
    {
      label: "Valor Total Devolvido",
      value: `R$ ${stats.valorTotal.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`,
      icon: CurrencyDollarIcon,
      color: "danger" as const,
      description: "Soma de todas devoluções",
    },
    {
      label: "Devoluções Parciais",
      value: stats.totalParciais,
      icon: ChartBarIcon,
      color: "warning" as const,
      description: "Parte dos itens devolvida",
    },
    {
      label: "Devoluções Completas",
      value: stats.totalCompletas,
      icon: ExclamationCircleIcon,
      color: "danger" as const,
      description: "Todos os itens devolvidos",
    },
    {
      label: "Créditos Aplicados",
      value: `${stats.creditosAplicados} (R$ ${stats.valorCreditoAplicado.toLocaleString(
        "pt-BR",
        { minimumFractionDigits: 2 }
      )})`,
      icon: CheckCircleIcon,
      color: "success" as const,
      description: "Créditos já processados",
    },
    {
      label: "Créditos Pendentes",
      value: `${stats.creditosPendentes} (R$ ${stats.valorCreditoPendente.toLocaleString(
        "pt-BR",
        { minimumFractionDigits: 2 }
      )})`,
      icon: ClockIcon,
      color: "warning" as const,
      description: "Aguardando processamento",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg bg-${stat.color}/10 text-${stat.color} flex-shrink-0`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-default-500 mb-1">{stat.label}</p>
                <p className="text-base font-semibold truncate">{stat.value}</p>
                <p className="text-xs text-default-400 mt-0.5">
                  {stat.description}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
