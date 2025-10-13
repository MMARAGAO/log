import { Card, CardBody } from "@heroui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ProdutoVendidoItem } from "./types";

interface ProdutosChartProps {
  data: ProdutoVendidoItem[];
}

export function ProdutosChart({ data }: ProdutosChartProps) {
  const topProdutos = data.slice(0, 10);

  return (
    <Card>
      <CardBody>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          📦 Top 10 Produtos Mais Vendidos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProdutos} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" stroke="#6B7280" style={{ fontSize: 11 }} />
            <YAxis
              dataKey="produto"
              type="category"
              width={150}
              stroke="#6B7280"
              style={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: number) => [
                value.toLocaleString("pt-BR"),
                "Quantidade",
              ]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="quantidade"
              fill="#3B82F6"
              radius={[0, 8, 8, 0]}
              name="Quantidade"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
