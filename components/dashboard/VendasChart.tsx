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
      <div className="bg-white p-4 border-2 border-primary-200 rounded-xl shadow-2xl">
        <p className="font-bold text-base mb-2 text-primary-700">
          {payload[0].payload.date}
        </p>
        <p className="text-sm text-emerald-700 font-semibold">
          Receita:{" "}
          <span className="font-bold">
            R$ {payload[0].value.toLocaleString("pt-BR")}
          </span>
        </p>
        <p className="text-sm text-blue-700 font-semibold">
          Vendas: <span className="font-bold">{payload[1].value}</span>
        </p>
      </div>
    );
  };

  return (
    <Card className="col-span-2 shadow-2xl rounded-2xl border-2 border-primary-100">
      <CardBody className="rounded-2xl">
        <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-primary-700">
          Evolução de Vendas e Receita
        </h3>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="6 6" stroke="#CBD5E1" />
            <XAxis
              dataKey="date"
              stroke="#334155"
              style={{ fontSize: 13, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#334155"
              style={{ fontSize: 13, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 14, fontWeight: 700 }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorReceita)"
              name="Receita (R$)"
              dot={{ stroke: "#10B981", strokeWidth: 2, fill: "#fff", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVendas)"
              name="Nº Vendas"
              dot={{ stroke: "#3B82F6", strokeWidth: 2, fill: "#fff", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
