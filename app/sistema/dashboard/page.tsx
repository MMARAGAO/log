"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { useAuthStore } from "@/store/authZustand";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Input,
  Spinner,
  Avatar,
  Tooltip,
} from "@heroui/react";
import {
  ArrowTrendingUpIcon,
  FunnelIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  Battery0Icon,
  Battery50Icon,
  Battery100Icon,
  UserCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Sector,
} from "recharts";

interface Venda {
  id: number;
  data_venda: string;
  total_bruto: number;
  desconto: number;
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: string;
  valor_restante: number;
  fiado: boolean;
  data_vencimento?: string | null;
  itens: any[];
  cliente_nome?: string | null;
  id_cliente?: number | null;
  id_usuario?: string | null;
}

interface Estoque {
  id: number;
  descricao: string | null;
  marca?: string | null;
  modelo?: string | null;
  preco_compra?: number | null;
  preco_venda?: number | null;
  quantidade?: number | null;
  minimo?: number | null;
}

interface Cliente {
  id: number;
  nome: string | null;
  createdat?: string;
}

interface Ordem {
  id: number;
  entrada?: string | null;
  status?: string | null;
  valor?: number | null;
  prioridade?: string | null;
  prazo?: string | null;
}

interface Usuario {
  uuid: string;
  nome?: string | null;
  email?: string | null;
  fotourl?: string[] | null;
}

const COLORS = [
  "#3B82F6", // Azul moderno
  "#10B981", // Verde esmeralda
  "#FACC15", // Amarelo suave
  "#F43F5E", // Vermelho rosado
  "#8B5CF6", // Roxo vibrante
  "#14B8A6", // Turquesa
  "#FB923C", // Laranja suave
  "#EC4899", // Rosa moderno
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permDashboard = acessos?.dashboard;
  const canViewDashboard = !!permDashboard?.ver_dashboard;
  const canViewRelatorios = !!permDashboard?.ver_relatorios;
  const canExportarDados = !!permDashboard?.exportar_dados;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [vRaw, eRaw, cRaw, oRaw, uRaw] = await Promise.all([
          fetchTable("vendas"),
          fetchTable("estoque"),
          fetchTable("clientes"),
          fetchTable("ordens"),
          fetchTable("usuarios"),
        ]);
        setVendas(
          (vRaw || []).map((v: any) => ({
            ...v,
            itens: Array.isArray(v.itens) ? v.itens : v.itens || [],
          }))
        );
        setEstoque(eRaw || []);
        setClientes(cRaw || []);
        setOrdens(oRaw || []);
        setUsuarios(uRaw || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtro por intervalo de datas (vendas)
  const vendasFiltradas = useMemo(() => {
    return vendas.filter((v) => {
      if (!dateStart && !dateEnd) return true;
      const d = new Date(v.data_venda).toISOString().slice(0, 10);
      if (dateStart && d < dateStart) return false;
      if (dateEnd && d > dateEnd) return false;
      return true;
    });
  }, [vendas, dateStart, dateEnd]);

  // KPIs
  const kpis = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const receita = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.total_liquido || 0),
      0
    );
    const descontos = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.desconto || 0),
      0
    );
    const aReceber = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.valor_restante || 0),
      0
    );
    const fiadoVencido = vendasFiltradas.filter(
      (v) =>
        v.fiado &&
        v.valor_restante > 0 &&
        v.data_vencimento &&
        new Date(v.data_vencimento) < new Date()
    ).length;
    const ticket = totalVendas ? receita / totalVendas : 0;
    return { totalVendas, receita, descontos, aReceber, fiadoVencido, ticket };
  }, [vendasFiltradas]);

  // Série receita por dia (últimos 30/intervalo)
  const receitaDia = useMemo(() => {
    const map = new Map<
      string,
      { data: string; receita: number; bruto: number }
    >();
    vendasFiltradas.forEach((v) => {
      const d = new Date(v.data_venda).toISOString().slice(0, 10);
      if (!map.has(d)) map.set(d, { data: d, receita: 0, bruto: 0 });
      const r = map.get(d)!;
      r.receita += Number(v.total_liquido || 0);
      r.bruto += Number(v.total_bruto || 0);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.data.localeCompare(b.data)
    );
  }, [vendasFiltradas]);

  // Receita por forma de pagamento
  const porPagamento = useMemo(() => {
    const map = new Map<string, number>();
    vendasFiltradas.forEach((v) => {
      const k = v.forma_pagamento || "N/D";
      map.set(k, (map.get(k) || 0) + Number(v.total_liquido || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [vendasFiltradas]);

  // Top produtos (somatório itens)
  const topProdutos = useMemo(() => {
    const map = new Map<string, { nome: string; qty: number; valor: number }>();
    vendasFiltradas.forEach((v) => {
      v.itens.forEach((i: any) => {
        const key = i.descricao || `ID${i.id_estoque}`;
        if (!map.has(key)) map.set(key, { nome: key, qty: 0, valor: 0 });
        const obj = map.get(key)!;
        obj.qty += Number(i.quantidade || 0);
        obj.valor += Number(i.subtotal || 0);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [vendasFiltradas]);

  // Top clientes
  const topClientes = useMemo(() => {
    const map = new Map<
      string,
      { cliente: string; valor: number; vendas: number }
    >();
    vendasFiltradas.forEach((v) => {
      const c = v.cliente_nome || "Sem nome";
      if (!map.has(c)) map.set(c, { cliente: c, valor: 0, vendas: 0 });
      const o = map.get(c)!;
      o.valor += Number(v.total_liquido || 0);
      o.vendas += 1;
    });
    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [vendasFiltradas]);

  // Top Vendedores (por receita líquida)
  const topVendedores = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        nome: string;
        vendas: number;
        receita: number;
        foto?: string;
      }
    >();
    vendasFiltradas.forEach((v) => {
      if (!v.id_usuario) return;
      const u = usuarios.find((x) => x.uuid === v.id_usuario);
      const nome = u?.nome || u?.email || v.id_usuario.slice(0, 8);
      if (!map.has(v.id_usuario))
        map.set(v.id_usuario, {
          id: v.id_usuario,
          nome,
          vendas: 0,
          receita: 0,
          foto: u?.fotourl?.[0],
        });
      const obj = map.get(v.id_usuario)!;
      obj.vendas += 1;
      obj.receita += Number(v.total_liquido || 0);
    });
    return Array.from(map.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 8)
      .map((x, i, arr) => ({
        ...x,
        pct:
          arr.length && arr[0].receita > 0
            ? (x.receita / arr[0].receita) * 100
            : 0,
      }));
  }, [vendasFiltradas, usuarios]);

  // Itens de estoque críticos
  const estoqueCritico = useMemo(() => {
    return estoque
      .filter((e) => (e.quantidade ?? 0) <= (e.minimo ?? 0))
      .sort((a, b) => (a.quantidade || 0) - (b.quantidade || 0))
      .slice(0, 10);
  }, [estoque]);

  // Distribuição status ordens
  const statusOrdens = useMemo(() => {
    const map = new Map<string, number>();
    ordens.forEach((o) => {
      const k = (o.status || "N/D").trim();
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, total]) => ({
      status,
      total,
    }));
  }, [ordens]);

  // Atrasadas ordens (prazo < hoje e sem saida)
  const ordensAtraso = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return ordens
      .filter((o) => o.prazo && o.prazo < hoje && !(o as any).saida)
      .slice(0, 8);
  }, [ordens]);

  function fmtBRL(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  // Tooltip customizado (adapta ao tema via classes Tailwind)
  const CurrencyTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-md border border-default-200 dark:border-default-100/30 bg-white/90 dark:bg-default-50/30 backdrop-blur px-3 py-2 shadow-lg text-[11px] max-w-[220px]">
        {label && (
          <p className="font-semibold mb-1 text-default-700 dark:text-default-900 truncate">
            {label}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div
              key={i}
              className="flex items-start gap-2 leading-tight text-[11px]"
            >
              <span
                className="w-2 h-2 rounded-full mt-1 text-red-500"
                style={{ background: p.color }}
              />
              <span className="text-default-600 dark:text-green-400 font-semibold">
                {(p.name || p.dataKey)
                  .replace("receita", "Receita")
                  .replace("bruto", "Bruto")}
                :{" "}
                <strong className="text-default-800 dark:text-white">
                  {typeof p.value === "number" ? fmtBRL(p.value) : p.value}
                </strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Redesenha o setor ativo sem stroke / sem expandir
  const NoBorderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
        />
      </g>
    );
  };

  // Bloqueio de visualização
  if (!canViewDashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowTrendingUpIcon className="w-8 h-8 text-danger" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-default-500">Visão geral operacional</p>
          </div>
        </div>
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar o dashboard.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  function handleExportData() {
    if (!canExportarDados) {
      alert("Você não possui permissão para exportar dados.");
      return;
    }
    // Lógica de exportação aqui
    console.log("Exportando dados...");
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-6 h-6" />
            Dashboard
          </h1>
          <p className="text-sm text-default-500">
            Visão geral operacional e financeira
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showFilters ? "solid" : "flat"}
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowFilters((v) => !v)}
          >
            Filtros
          </Button>
          <Button
            variant="flat"
            onPress={() => {
              setDateStart("");
              setDateEnd("");
            }}
          >
            Limpar
          </Button>
          {canExportarDados && (
            <Button
              color="success"
              variant="flat"
              startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              onPress={handleExportData}
            >
              Exportar
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardBody className="flex flex-col gap-4 md:flex-row">
            <Input
              label="Início"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="max-w-xs"
            />
            <Input
              label="Fim"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="max-w-xs"
            />
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPIs - sempre visível se tem acesso ao dashboard */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardBody className="p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-default-500">
                  Vendas
                </p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <ShoppingCartIcon className="w-5 h-5" /> {kpis.totalVendas}
                </p>
                <p className="text-[11px] text-default-400">
                  Ticket {fmtBRL(kpis.ticket)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-default-500">
                  Receita
                </p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <CurrencyDollarIcon className="w-5 h-5" />{" "}
                  {fmtBRL(kpis.receita)}
                </p>
                <p className="text-[11px] text-default-400">
                  Descontos {fmtBRL(kpis.descontos)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-default-500">
                  A Receber
                </p>
                <p className="text-xl font-semibold flex items-center gap-1 text-orange-600">
                  <ClockIcon className="w-5 h-5" /> {fmtBRL(kpis.aReceber)}
                </p>
                <p className="text-[11px] text-default-400">
                  Fiado venc. {kpis.fiadoVencido}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-default-500">
                  Clientes
                </p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <UsersIcon className="w-5 h-5" /> {clientes.length}
                </p>
                <p className="text-[11px] text-default-400">
                  Novos mês{" "}
                  {
                    clientes.filter(
                      (c) =>
                        c.createdat &&
                        new Date(c.createdat).getMonth() ===
                          new Date().getMonth()
                    ).length
                  }
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-default-500">
                  Ordens
                </p>
                <p className="text-xl font-semibold flex items-center gap-1">
                  <WrenchScrewdriverIcon className="w-5 h-5" /> {ordens.length}
                </p>
                <p className="text-[11px] text-default-400">
                  Atraso{" "}
                  {
                    ordens.filter(
                      (o) =>
                        o.prazo &&
                        o.prazo < new Date().toISOString().slice(0, 10)
                    ).length
                  }
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-default-500">
                  Descontos %
                </p>
                <p className="text-xl font-semibold">
                  {kpis.receita > 0
                    ? (
                        (kpis.descontos / (kpis.receita + kpis.descontos)) *
                        100
                      ).toFixed(1) + "%"
                    : "0%"}
                </p>
                <p className="text-[11px] text-default-400">Sobre bruto</p>
              </CardBody>
            </Card>
          </div>

          {/* Gráficos principais - só se pode ver relatórios */}
          {canViewRelatorios ? (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardBody className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Receita por Dia</p>
                      <Chip size="sm" variant="flat">
                        {receitaDia.length} dias
                      </Chip>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={receitaDia}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="data" fontSize={11} />
                          <YAxis
                            tickFormatter={(v) => (v / 1000).toFixed(0) + "k"}
                            fontSize={11}
                          />
                          <RTooltip content={<CurrencyTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="receita"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="bruto"
                            stroke="#9333ea"
                            strokeDasharray="5 4"
                            dot={false}
                            activeDot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 space-y-2">
                    <p className="text-sm font-semibold">
                      Receita por Pagamento
                    </p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={porPagamento}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                            activeShape={NoBorderActiveShape}
                            isAnimationActive={false}
                          >
                            {porPagamento.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip content={<CurrencyTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Top listas */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardBody className="p-4 space-y-3">
                    <p className="text-sm font-semibold">
                      Top Produtos (Valor)
                    </p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProdutos}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nome" hide />
                          <YAxis tickFormatter={(v) => v / 1000 + "k"} />
                          <RTooltip content={<CurrencyTooltip />} />
                          <Bar
                            dataKey="valor"
                            stroke="none"
                            activeBar={false}
                            onClick={(e) => {}}
                          >
                            {topProdutos.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {topProdutos.map((p) => (
                        <div
                          key={p.nome}
                          className="text-xs flex justify-between rounded-md px-2 py-1"
                        >
                          <span className="truncate pr-2">{p.nome}</span>
                          <span className="font-medium">{fmtBRL(p.valor)}</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody className="p-4 space-y-3">
                    <p className="text-sm font-semibold">Top Clientes</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {topClientes.map((c) => (
                        <div
                          key={c.cliente}
                          className="text-xs flex justify-between items-center rounded-md px-2 py-1"
                        >
                          <span className="truncate pr-2">{c.cliente}</span>
                          <div className="text-right">
                            <p className="font-medium">{fmtBRL(c.valor)}</p>
                            <p className="text-[10px] text-default-500">
                              {c.vendas} venda(s)
                            </p>
                          </div>
                        </div>
                      ))}
                      {topClientes.length === 0 && (
                        <p className="text-[11px] text-default-500">
                          Sem dados.
                        </p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Top Vendedores */}
              <Card className="bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent dark:from-indigo-400/10">
                <CardBody className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <UserCircleIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />
                      <p className="text-sm font-semibold">
                        Top Vendedores (Receita)
                      </p>
                    </div>
                    <Chip size="sm" variant="flat" color="primary">
                      {topVendedores.reduce((acc, v) => acc + v.vendas, 0)}{" "}
                      vendas
                    </Chip>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {topVendedores.map((v, idx) => (
                      <div
                        key={v.id}
                        className="relative rounded-medium p-3 flex flex-col gap-2 overflow-hidden group bg-default-50/40 dark:bg-default-50/5"
                      >
                        <span
                          className={`absolute inset-y-0 left-0 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 via-${
                            idx % 2 ? "violet" : "blue"
                          }-500 to-transparent opacity-70`}
                        />
                        <div className="flex items-center gap-3">
                          {v.foto ? (
                            <Avatar
                              src={v.foto}
                              size="sm"
                              radius="sm"
                              className="ring-2 ring-indigo-500/40"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-indigo-500/10 dark:bg-indigo-400/20 flex items-center justify-center text-[11px] font-medium text-indigo-600 dark:text-indigo-200 ring-1 ring-indigo-500/30">
                              {v.nome.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">
                              {idx + 1}. {v.nome}
                            </p>
                            <p className="text-[10px] text-default-500">
                              {v.vendas} venda(s)
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-default-500">Receita</span>
                            <span className="font-medium">
                              {v.receita.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-default-200/70 dark:bg-default-100/20 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 transition-all"
                              style={{ width: `${v.pct.toFixed(1)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-default-500">
                          <span>{v.pct.toFixed(1)}% do líder</span>
                          <span>
                            Ticket{" "}
                            {v.vendas
                              ? (v.receita / v.vendas).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent pointer-events-none transition" />
                      </div>
                    ))}
                    {topVendedores.length === 0 && (
                      <div className="col-span-full text-xs text-default-500 py-6 text-center">
                        Sem dados de vendedores no período.
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card className="border-warning-200">
              <CardBody className="text-center py-8">
                <div className="mb-3">
                  <ExclamationTriangleIcon className="w-12 h-12 text-warning mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Relatórios Restritos
                </h3>
                <p className="text-warning text-sm">
                  Você não possui permissão para visualizar relatórios
                  detalhados.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Estoque crítico / Ordens / Fiado - sempre visível */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardBody className="p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                  Estoque Crítico
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {estoqueCritico.map((i) => {
                    const q = Number(i.quantidade || 0);
                    const min = Number(i.minimo || 0);
                    return (
                      <div
                        key={i.id}
                        className="flex justify-between text-xs rounded-md px-2 py-1"
                      >
                        <span className="truncate flex items-center gap-1">
                          {i.descricao || "Item"}
                        </span>
                        <span className="font-medium">
                          {q}{" "}
                          <span className="text-[10px] text-default-400">
                            min {min}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                  {estoqueCritico.length === 0 && (
                    <p className="text-[11px] text-default-500">
                      Sem itens críticos.
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-2">
                <p className="text-sm font-semibold">Status Ordens</p>
                <div className="space-y-1">
                  {statusOrdens.map((s) => (
                    <div
                      key={s.status}
                      className="flex justify-between text-xs  rounded-md px-2 py-1"
                    >
                      <span>{s.status}</span>
                      <span className="font-medium">{s.total}</span>
                    </div>
                  ))}
                  {statusOrdens.length === 0 && (
                    <p className="text-[11px] text-default-500">Sem ordens.</p>
                  )}
                </div>
                <p className="text-xs font-semibold mt-3">Atrasadas</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {ordensAtraso.map((o) => (
                    <div
                      key={o.id}
                      className="flex justify-between text-[11px]  rounded-md px-2 py-1"
                    >
                      <span className="truncate pr-2">#{o.id}</span>
                      <span className="text-danger">{o.prazo}</span>
                    </div>
                  ))}
                  {ordensAtraso.length === 0 && (
                    <p className="text-[11px] text-default-500">Sem atrasos.</p>
                  )}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="p-4 space-y-2">
                <p className="text-sm font-semibold">Fiado / Vencimento</p>
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  {vendasFiltradas
                    .filter((v) => v.fiado && v.valor_restante > 0)
                    .sort((a, b) =>
                      (a.data_vencimento || "").localeCompare(
                        b.data_vencimento || ""
                      )
                    )
                    .map((v) => {
                      const vencido =
                        v.data_vencimento &&
                        new Date(v.data_vencimento) < new Date();
                      return (
                        <div
                          key={v.id}
                          className="flex justify-between items-center text-xs  rounded-md px-2 py-1"
                        >
                          <div className="truncate pr-2">
                            <span className="font-medium">#{v.id}</span>{" "}
                            {v.cliente_nome}
                          </div>
                          <Tooltip content={v.data_vencimento || "-"}>
                            <Chip
                              size="sm"
                              color={vencido ? "danger" : "warning"}
                              variant="flat"
                            >
                              {v.data_vencimento || "—"}
                            </Chip>
                          </Tooltip>
                        </div>
                      );
                    })}
                  {vendasFiltradas.filter(
                    (v) => v.fiado && v.valor_restante > 0
                  ).length === 0 && (
                    <p className="text-[11px] text-default-500">
                      Sem fiado em aberto.
                    </p>
                  )}
                </div>
                <div className="pt-2 -t mt-2">
                  <p className="text-[11px] text-default-500">
                    Total Fiado Aberto:{" "}
                    <span className="font-medium">
                      {fmtBRL(
                        vendasFiltradas
                          .filter((v) => v.fiado && v.valor_restante > 0)
                          .reduce(
                            (acc, v) => acc + Number(v.valor_restante || 0),
                            0
                          )
                      )}
                    </span>
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
