/**
 * ClienteStats - Componente de estatísticas de clientes
 * Exibe métricas importantes sobre a base de clientes
 */

import { Card, CardBody, Chip } from "@heroui/react";
import {
  UserIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  AtSymbolIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import type { Cliente, ClienteStats as Stats } from "./types";

interface ClienteStatsProps {
  clientes: Cliente[];
}

export default function ClienteStats({ clientes }: ClienteStatsProps) {
  // Calcula estatísticas
  const stats: Stats = {
    total: clientes.length,
    pessoasFisicas: clientes.filter((c) => {
      const clean = c.doc?.replace(/\D/g, "") || "";
      return clean.length === 11;
    }).length,
    pessoasJuridicas: clientes.filter((c) => {
      const clean = c.doc?.replace(/\D/g, "") || "";
      return clean.length === 14;
    }).length,
    comWhatsapp: clientes.filter((c) => c.whatsapp).length,
    comInstagram: clientes.filter((c) => c.instagram).length,
    creditoTotal: clientes.reduce(
      (sum, c) => sum + (Number(c.credito) || 0),
      0
    ),
  };

  const statCards = [
    {
      label: "Total de Clientes",
      value: stats.total,
      icon: UserGroupIcon,
      color: "primary" as const,
    },
    {
      label: "Pessoas Físicas",
      value: stats.pessoasFisicas,
      icon: UserIcon,
      color: "secondary" as const,
    },
    {
      label: "Pessoas Jurídicas",
      value: stats.pessoasJuridicas,
      icon: BuildingOfficeIcon,
      color: "default" as const,
    },
    {
      label: "Com WhatsApp",
      value: stats.comWhatsapp,
      icon: ChatBubbleLeftRightIcon,
      color: "success" as const,
    },
    {
      label: "Com Instagram",
      value: stats.comInstagram,
      icon: AtSymbolIcon,
      color: "warning" as const,
    },
    {
      label: "Crédito Total",
      value: `R$ ${stats.creditoTotal.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`,
      icon: CurrencyDollarIcon,
      color: "success" as const,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.label} className="border-none shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-${stat.color}/10 text-${stat.color}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-default-500 truncate">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold truncate">{stat.value}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
