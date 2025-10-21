/**
 * EstoqueStats - Componente de estatísticas de estoque
 * Exibe métricas importantes sobre produtos e estoque
 */

import { Card, CardBody } from "@heroui/react";
import {
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { EstoqueItem, EstoqueStats as Stats } from "./types";

interface EstoqueStatsProps {
  produtos: EstoqueItem[];
}

export default function EstoqueStats({ produtos }: EstoqueStatsProps) {
  // Calcula estatísticas
  const stats: Stats = {
    totalProdutos: produtos.length,
    totalItens: produtos.reduce(
      (sum, p) => sum + (Number(p.quantidade_total) || 0),
      0
    ),
    valorTotalCompra: produtos.reduce(
      (sum, p) =>
        sum + (Number(p.preco_compra) || 0) * (Number(p.quantidade_total) || 0),
      0
    ),
    valorTotalVenda: produtos.reduce(
      (sum, p) =>
        sum + (Number(p.preco_venda) || 0) * (Number(p.quantidade_total) || 0),
      0
    ),
    margemMedia: 0,
    produtosAbaixoMinimo: produtos.filter(
      (p) =>
        p.minimo &&
        p.quantidade_total !== undefined &&
        p.quantidade_total < p.minimo
    ).length,
    produtosSemEstoque: produtos.filter(
      (p) => !p.quantidade_total || p.quantidade_total === 0
    ).length,
  };

  // Calcula margem média
  if (stats.valorTotalCompra > 0) {
    stats.margemMedia =
      ((stats.valorTotalVenda - stats.valorTotalCompra) /
        stats.valorTotalCompra) *
      100;
  }

  const statCards = [
    {
      label: "Total de Produtos",
      value: stats.totalProdutos,
      icon: CubeIcon,
      color: "primary" as const,
      description: "Produtos cadastrados",
    },
    {
      label: "Total de Itens",
      value: stats.totalItens,
      icon: ShoppingCartIcon,
      color: "secondary" as const,
      description: "Unidades em estoque",
    },
    {
      label: "Valor em Estoque (Compra)",
      value: `R$ ${stats.valorTotalCompra.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`,
      icon: CurrencyDollarIcon,
      color: "success" as const,
      description: "Custo total",
    },
    {
      label: "Valor em Estoque (Venda)",
      value: `R$ ${stats.valorTotalVenda.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`,
      icon: CurrencyDollarIcon,
      color: "success" as const,
      description: "Valor de venda",
    },
    {
      label: "Margem Média",
      value: `${stats.margemMedia.toFixed(1)}%`,
      icon: ChartBarIcon,
      color: stats.margemMedia >= 30 ? "success" : "warning",
      description: "Lucro sobre custo",
    },
    {
      label: "Abaixo do Mínimo",
      value: stats.produtosAbaixoMinimo,
      icon: ExclamationTriangleIcon,
      color: "warning" as const,
      description: "Produtos críticos",
    },
    {
      label: "Sem Estoque",
      value: stats.produtosSemEstoque,
      icon: XMarkIcon,
      color: "danger" as const,
      description: "Produtos zerados",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 mb-6">
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
                <p className="text-xs text-default-500 mb-1 truncate">
                  {stat.label}
                </p>
                <p className="text-base font-semibold truncate">{stat.value}</p>
                <p className="text-xs text-default-400 mt-0.5 truncate">
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
