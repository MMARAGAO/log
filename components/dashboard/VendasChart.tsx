import { Card, CardBody } from "@heroui/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartDataItem } from "./types";

interface VendasChartProps {
  data: ChartDataItem[];
}

export function VendasChart({ data }: VendasChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 border border-default-200 rounded-lg shadow-lg">
        <p className="font-semibold text-sm mb-2">{payload[0].payload.date}</p>
        <p className="text-xs text-success-600">
          Receita: R$ {payload[0].value.toLocaleString("pt-BR")}
        </p>
        <p className="text-xs text-primary-600">Vendas: {payload[1].value}</p>
      </div>
    );
  };

  return (
    <Card className="col-span-2">
      <CardBody>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          📈 Evolução de Vendas e Receita
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: 12 }} />
            <YAxis stroke="#6B7280" style={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorReceita)"
              name="Receita (R$)"
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorVendas)"
              name="Nº Vendas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
