import { Card, CardBody } from "@heroui/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import { FormasPagamentoItem } from "./types";

interface FormasPagamentoChartProps {
  data: FormasPagamentoItem[];
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#FACC15",
  "#F43F5E",
  "#8B5CF6",
  "#14B8A6",
  "#FB923C",
  "#EC4899",
];

export function FormasPagamentoChart({ data }: FormasPagamentoChartProps) {
  // Filtra tipos de pagamento sem nome ou valor zero
  const chartData = data
    .filter((item) => item.forma && item.forma.trim() !== "" && item.total > 0)
    .map((item) => ({
      name: item.forma,
      value: item.total,
      quantidade: item.quantidade,
    }));

  return (
    <Card>
      <CardBody>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          💳 Formas de Pagamento
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) =>
                `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `R$ ${value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`,
                "Total",
              ]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
