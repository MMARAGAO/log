/**
 * VendasStats - Componente de estatísticas de vendas
 * Exibe cards com métricas principais: total de vendas, faturamento, a receber e vencidas
 */

import { Card, CardBody } from "@heroui/react";
import type { VendasStats } from "./types";

interface VendasStatsProps {
  stats: VendasStats;
  formatCurrency: (value: number) => string;
}

export default function VendasStats({
  stats,
  formatCurrency: fmt,
}: VendasStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Vendas */}
      <Card>
        <CardBody className="p-4">
          <p className="text-xs text-default-500">Total de Vendas</p>
          <p className="text-2xl font-semibold">{stats.count}</p>
          <p className="text-xs text-default-400">{stats.pagas} pagas</p>
        </CardBody>
      </Card>

      {/* Faturamento */}
      <Card>
        <CardBody className="p-4">
          <p className="text-xs text-default-500">Faturamento</p>
          <p className="text-xl font-semibold">{fmt(stats.faturamento)}</p>
          <p className="text-xs text-default-400">
            Ticket médio {fmt(stats.ticket)}
          </p>
        </CardBody>
      </Card>

      {/* A Receber */}
      <Card>
        <CardBody className="p-4">
          <p className="text-xs text-default-500">A Receber</p>
          <p className="text-xl font-semibold text-orange-600">
            {fmt(stats.receber)}
          </p>
          <p className="text-xs text-default-400">
            {stats.count > 0
              ? `${Math.round((stats.receber / stats.faturamento) * 100)}% pendente`
              : "Sem vendas"}
          </p>
        </CardBody>
      </Card>

      {/* Vencidas */}
      <Card>
        <CardBody className="p-4">
          <p className="text-xs text-default-500">Vencidas</p>
          <p
            className={`text-xl font-semibold ${
              stats.vencidas > 0 ? "text-red-600" : "text-default-400"
            }`}
          >
            {stats.vencidas}
          </p>
          <p className="text-xs text-default-400">
            {stats.vencidas > 0 ? "Rever cobranças" : "Sem pendências"}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
