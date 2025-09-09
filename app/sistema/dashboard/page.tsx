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
  Progress,
  Badge,
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
  BuildingStorefrontIcon,
  TruckIcon,
  ArrowUturnLeftIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CalendarDaysIcon,
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
  AreaChart,
  Area,
  ComposedChart,
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
  valor_pago: number;
  fiado: boolean;
  data_vencimento?: string | null;
  itens: any[];
  cliente_nome?: string | null;
  id_cliente?: number | null;
  id_usuario?: string | null;
  loja_id?: number | null;
}

interface Estoque {
  id: number;
  descricao: string | null;
  marca?: string | null;
  modelo?: string | null;
  preco_compra?: number | null;
  preco_venda?: number | null;
  minimo?: number | null;
}

interface EstoqueLoja {
  id: number;
  produto_id: number;
  loja_id: number;
  quantidade: number;
}

interface Cliente {
  id: number;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
  credito?: number | null;
  createdat?: string;
}

interface Ordem {
  id: number;
  entrada?: string | null;
  saida?: string | null;
  status?: string | null;
  valor?: number | null;
  prioridade?: string | null;
  prazo?: string | null;
  tecnico_responsavel?: string | null;
  garantia?: boolean;
}

interface Usuario {
  uuid: string;
  nome?: string | null;
  email?: string | null;
  fotourl?: string[] | null;
  credito?: number | null;
}

interface Loja {
  id: number;
  nome: string;
  endereco?: string | null;
}

interface Transferencia {
  id: number;
  loja_origem_id: number;
  loja_destino_id: number;
  data_transferencia: string;
  status: string;
}

interface Devolucao {
  id: number;
  id_venda: number;
  data_devolucao: string;
  valor_total_devolvido: number;
  tipo_devolucao: string;
  credito_aplicado: boolean;
  valor_credito_gerado: number;
}

interface Fornecedor {
  id: number;
  nome: string;
  ativo: boolean;
  data_cadastro: string;
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
  "#06B6D4",
  "#84CC16",
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [estoque, setEstoque] = useState<Estoque[]>([]);
  const [estoqueLojas, setEstoqueLojas] = useState<EstoqueLoja[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // dias
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
        const [vRaw, eRaw, elRaw, cRaw, oRaw, uRaw, lRaw, tRaw, dRaw, fRaw] =
          await Promise.all([
            fetchTable("vendas"),
            fetchTable("estoque"),
            fetchTable("estoque_lojas"),
            fetchTable("clientes"),
            fetchTable("ordens"),
            fetchTable("usuarios"),
            fetchTable("lojas"),
            fetchTable("transferencias"),
            fetchTable("devolucoes"),
            fetchTable("fornecedores"),
          ]);

        setVendas(
          (vRaw || []).map((v: any) => ({
            ...v,
            itens: Array.isArray(v.itens) ? v.itens : v.itens || [],
          }))
        );
        setEstoque(eRaw || []);
        setEstoqueLojas(elRaw || []);
        setClientes(cRaw || []);
        setOrdens(oRaw || []);
        setUsuarios(uRaw || []);
        setLojas(lRaw || []);
        setTransferencias(tRaw || []);
        setDevolucoes(dRaw || []);
        setFornecedores(fRaw || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-definir período se não há filtro manual
  useEffect(() => {
    if (!dateStart && !dateEnd && selectedPeriod) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(selectedPeriod));
      setDateStart(start.toISOString().slice(0, 10));
      setDateEnd(end.toISOString().slice(0, 10));
    }
  }, [selectedPeriod, dateStart, dateEnd]);

  // Filtro por intervalo de datas
  const vendasFiltradas = useMemo(() => {
    return vendas.filter((v) => {
      if (!dateStart && !dateEnd) return true;
      const d = new Date(v.data_venda).toISOString().slice(0, 10);
      if (dateStart && d < dateStart) return false;
      if (dateEnd && d > dateEnd) return false;
      return true;
    });
  }, [vendas, dateStart, dateEnd]);

  const ordensFiltradasPeriodo = useMemo(() => {
    return ordens.filter((o) => {
      if (!dateStart && !dateEnd) return true;
      const d = o.entrada ? new Date(o.entrada).toISOString().slice(0, 10) : "";
      if (dateStart && d < dateStart) return false;
      if (dateEnd && d > dateEnd) return false;
      return true;
    });
  }, [ordens, dateStart, dateEnd]);

  // KPIs Principais
  const kpis = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const receita = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.total_liquido || 0),
      0
    );
    const receitaBruta = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.total_bruto || 0),
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
    const valorPago = vendasFiltradas.reduce(
      (acc, v) => acc + Number(v.valor_pago || 0),
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
    const margemDesconto =
      receitaBruta > 0 ? (descontos / receitaBruta) * 100 : 0;

    // Devolução
    const totalDevolucoes = devolucoes.reduce(
      (acc, d) => acc + Number(d.valor_total_devolvido || 0),
      0
    );
    const creditoGerado = devolucoes.reduce(
      (acc, d) => acc + Number(d.valor_credito_gerado || 0),
      0
    );

    // Clientes
    const clientesAtivos = clientes.filter((c) =>
      vendas.some((v) => v.id_cliente === c.id)
    ).length;

    // Ordens
    const ordensAbertas = ordens.filter((o) => !o.saida).length;
    const ordensAtrasadas = ordens.filter(
      (o) => !o.saida && o.prazo && new Date(o.prazo) < new Date()
    ).length;

    return {
      totalVendas,
      receita,
      receitaBruta,
      descontos,
      aReceber,
      fiadoVencido,
      ticket,
      margemDesconto,
      totalDevolucoes,
      creditoGerado,
      clientesAtivos,
      ordensAbertas,
      ordensAtrasadas,
      valorPago,
    };
  }, [vendasFiltradas, devolucoes, clientes, vendas, ordens]);

  // Análise temporal - receita por dia
  const receitaTemporal = useMemo(() => {
    const map = new Map<
      string,
      {
        data: string;
        receita: number;
        bruto: number;
        vendas: number;
        devolucoes: number;
      }
    >();

    vendasFiltradas.forEach((v) => {
      const d = new Date(v.data_venda).toISOString().slice(0, 10);
      if (!map.has(d))
        map.set(d, { data: d, receita: 0, bruto: 0, vendas: 0, devolucoes: 0 });
      const r = map.get(d)!;
      r.receita += Number(v.total_liquido || 0);
      r.bruto += Number(v.total_bruto || 0);
      r.vendas += 1;
    });

    // Adicionar devoluções
    devolucoes.forEach((d) => {
      const dt = new Date(d.data_devolucao).toISOString().slice(0, 10);
      if (map.has(dt)) {
        map.get(dt)!.devolucoes += Number(d.valor_total_devolvido || 0);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.data.localeCompare(b.data)
    );
  }, [vendasFiltradas, devolucoes]);

  // Receita por forma de pagamento
  const receitaPorPagamento = useMemo(() => {
    const map = new Map<string, number>();
    vendasFiltradas.forEach((v) => {
      const k = v.forma_pagamento || "Não informado";
      map.set(k, (map.get(k) || 0) + Number(v.total_liquido || 0));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [vendasFiltradas]);

  // Top produtos mais vendidos
  const topProdutos = useMemo(() => {
    const map = new Map<
      string,
      {
        nome: string;
        quantidade: number;
        valor: number;
        margem?: number;
      }
    >();

    vendasFiltradas.forEach((v) => {
      v.itens.forEach((item: any) => {
        const key = item.descricao || `Produto ${item.id_estoque}`;
        if (!map.has(key)) {
          map.set(key, { nome: key, quantidade: 0, valor: 0 });
        }
        const obj = map.get(key)!;
        obj.quantidade += Number(item.quantidade || 0);
        obj.valor += Number(item.subtotal || 0);

        // Calcular margem se temos preço de compra
        const produto = estoque.find((e) => e.id === item.id_estoque);
        if (produto?.preco_compra && produto.preco_venda) {
          obj.margem =
            ((produto.preco_venda - produto.preco_compra) /
              produto.preco_venda) *
            100;
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [vendasFiltradas, estoque]);

  // Performance por loja
  const performanceLojas = useMemo(() => {
    const map = new Map<
      number,
      {
        loja: string;
        vendas: number;
        receita: number;
        ticket: number;
      }
    >();

    vendasFiltradas.forEach((v) => {
      if (!v.loja_id) return;
      const loja = lojas.find((l) => l.id === v.loja_id);
      const nomeLoja = loja?.nome || `Loja ${v.loja_id}`;

      if (!map.has(v.loja_id)) {
        map.set(v.loja_id, {
          loja: nomeLoja,
          vendas: 0,
          receita: 0,
          ticket: 0,
        });
      }
      const obj = map.get(v.loja_id)!;
      obj.vendas += 1;
      obj.receita += Number(v.total_liquido || 0);
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      ticket: item.vendas > 0 ? item.receita / item.vendas : 0,
    }));
  }, [vendasFiltradas, lojas]);

  // Top clientes por valor
  const topClientes = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        nome: string;
        vendas: number;
        valor: number;
        credito: number;
        ultimaCompra?: string;
      }
    >();

    vendasFiltradas.forEach((v) => {
      if (!v.id_cliente) return;
      const cliente = clientes.find((c) => c.id === v.id_cliente);
      const nome = cliente?.nome || v.cliente_nome || "Cliente sem nome";

      if (!map.has(v.id_cliente)) {
        map.set(v.id_cliente, {
          id: v.id_cliente,
          nome,
          vendas: 0,
          valor: 0,
          credito: Number(cliente?.credito || 0),
          ultimaCompra: v.data_venda,
        });
      }
      const obj = map.get(v.id_cliente)!;
      obj.vendas += 1;
      obj.valor += Number(v.total_liquido || 0);

      // Atualizar última compra
      if (new Date(v.data_venda) > new Date(obj.ultimaCompra || "")) {
        obj.ultimaCompra = v.data_venda;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [vendasFiltradas, clientes]);

  // Performance vendedores
  const topVendedores = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        nome: string;
        vendas: number;
        receita: number;
        foto?: string;
        ordens?: number;
      }
    >();

    vendasFiltradas.forEach((v) => {
      if (!v.id_usuario) return;
      const usuario = usuarios.find((u) => u.uuid === v.id_usuario);
      const nome = usuario?.nome || usuario?.email || v.id_usuario.slice(0, 8);

      if (!map.has(v.id_usuario)) {
        map.set(v.id_usuario, {
          id: v.id_usuario,
          nome,
          vendas: 0,
          receita: 0,
          foto: usuario?.fotourl?.[0],
          ordens: ordensFiltradasPeriodo.filter(
            (o) => o.tecnico_responsavel === nome
          ).length,
        });
      }
      const obj = map.get(v.id_usuario)!;
      obj.vendas += 1;
      obj.receita += Number(v.total_liquido || 0);
    });

    return Array.from(map.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 8);
  }, [vendasFiltradas, usuarios, ordensFiltradasPeriodo]);

  // Análise de estoque
  const analiseEstoque = useMemo(() => {
    const totalItens = estoque.length;
    const valorEstoque = estoque.reduce((acc, item) => {
      const quantidadeTotal = estoqueLojas
        .filter((el) => el.produto_id === item.id)
        .reduce((sum, el) => sum + Number(el.quantidade || 0), 0);
      return acc + quantidadeTotal * Number(item.preco_compra || 0);
    }, 0);

    const itensCriticos = estoque.filter((item) => {
      const quantidadeTotal = estoqueLojas
        .filter((el) => el.produto_id === item.id)
        .reduce((sum, el) => sum + Number(el.quantidade || 0), 0);
      return quantidadeTotal <= Number(item.minimo || 0);
    });

    const itensZerados = estoque.filter((item) => {
      const quantidadeTotal = estoqueLojas
        .filter((el) => el.produto_id === item.id)
        .reduce((sum, el) => sum + Number(el.quantidade || 0), 0);
      return quantidadeTotal === 0;
    });

    return {
      totalItens,
      valorEstoque,
      itensCriticos: itensCriticos.length,
      itensZerados: itensZerados.length,
      itensDetalhados: itensCriticos.slice(0, 10),
    };
  }, [estoque, estoqueLojas]);

  // Status das ordens
  const statusOrdens = useMemo(() => {
    const map = new Map<
      string,
      { status: string; total: number; valor: number }
    >();
    ordensFiltradasPeriodo.forEach((o) => {
      const status = (o.status || "Sem status").trim();
      if (!map.has(status)) {
        map.set(status, { status, total: 0, valor: 0 });
      }
      const obj = map.get(status)!;
      obj.total += 1;
      obj.valor += Number(o.valor || 0);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [ordensFiltradasPeriodo]);

  // Transferências pendentes
  const transferenciasPendentes = useMemo(() => {
    return transferencias.filter((t) => t.status === "pendente").length;
  }, [transferencias]);

  function fmtBRL(valor: number): string {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function fmtDate(date: string): string {
    return new Date(date).toLocaleDateString("pt-BR");
  }

  // Tooltip customizado
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.name}: </span>
            <span className="font-medium">
              {typeof p.value === "number" ? fmtBRL(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

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
            <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
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
    console.log("Exportando dados...");
  }

  return (
    <div className="p-4 space-y-6 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-primary" />
            Dashboard Executivo
          </h1>
          <p className="text-sm text-default-500">
            Visão completa do negócio • Período:{" "}
            {dateStart ? fmtDate(dateStart) : "Início"} até{" "}
            {dateEnd ? fmtDate(dateEnd) : "Hoje"}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            {["7", "30", "90"].map((period) => (
              <Button
                key={period}
                size="sm"
                variant={selectedPeriod === period ? "solid" : "flat"}
                onPress={() => {
                  setSelectedPeriod(period);
                  setDateStart("");
                  setDateEnd("");
                }}
              >
                {period}d
              </Button>
            ))}
          </div>

          <Button
            variant={showFilters ? "solid" : "flat"}
            size="sm"
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>

          {canExportarDados && (
            <Button
              color="success"
              variant="flat"
              size="sm"
              startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
              onPress={handleExportData}
            >
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardBody className="flex flex-col gap-4 sm:flex-row">
            <Input
              label="Data Início"
              type="date"
              size="sm"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="max-w-xs"
            />
            <Input
              label="Data Fim"
              type="date"
              size="sm"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="flat"
              size="sm"
              onPress={() => {
                setDateStart("");
                setDateEnd("");
                setSelectedPeriod("30");
              }}
            >
              Limpar
            </Button>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPIs Principais */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCartIcon className="w-5 h-5 text-blue-500" />
                  <Chip size="sm" variant="flat" color="primary">
                    {kpis.totalVendas}
                  </Chip>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Vendas
                </p>
                <p className="text-lg font-bold">{fmtBRL(kpis.receita)}</p>
                <p className="text-xs text-default-400">
                  Ticket: {fmtBRL(kpis.ticket)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                  <Chip size="sm" variant="flat" color="success">
                    {kpis.margemDesconto.toFixed(1)}%
                  </Chip>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Receita Bruta
                </p>
                <p className="text-lg font-bold">{fmtBRL(kpis.receitaBruta)}</p>
                <p className="text-xs text-default-400">
                  Desc: {fmtBRL(kpis.descontos)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ClockIcon className="w-5 h-5 text-orange-500" />
                  <Badge content={kpis.fiadoVencido} color="danger" size="sm">
                    <div className="w-2 h-2" />
                  </Badge>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  A Receber
                </p>
                <p className="text-lg font-bold text-orange-600">
                  {fmtBRL(kpis.aReceber)}
                </p>
                <p className="text-xs text-default-400">
                  Pago: {fmtBRL(kpis.valorPago)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <UsersIcon className="w-5 h-5 text-purple-500" />
                  <Chip size="sm" variant="flat" color="secondary">
                    {clientes.length}
                  </Chip>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Clientes
                </p>
                <p className="text-lg font-bold">{kpis.clientesAtivos}</p>
                <p className="text-xs text-default-400">Ativos no período</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <WrenchScrewdriverIcon className="w-5 h-5 text-indigo-500" />
                  <Badge
                    content={kpis.ordensAtrasadas}
                    color="danger"
                    size="sm"
                  >
                    <Chip size="sm" variant="flat">
                      {kpis.ordensAbertas}
                    </Chip>
                  </Badge>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Ordens
                </p>
                <p className="text-lg font-bold">{ordens.length}</p>
                <p className="text-xs text-default-400">
                  Abertas: {kpis.ordensAbertas}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ArrowUturnLeftIcon className="w-5 h-5 text-red-500" />
                  <Chip size="sm" variant="flat" color="danger">
                    {devolucoes.length}
                  </Chip>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Devoluções
                </p>
                <p className="text-lg font-bold">
                  {fmtBRL(kpis.totalDevolucoes)}
                </p>
                <p className="text-xs text-default-400">
                  Créd: {fmtBRL(kpis.creditoGerado)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BuildingStorefrontIcon className="w-5 h-5 text-teal-500" />
                  <Chip size="sm" variant="flat" color="primary">
                    {lojas.length}
                  </Chip>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Lojas
                </p>
                <p className="text-lg font-bold">
                  {fmtBRL(analiseEstoque.valorEstoque)}
                </p>
                <p className="text-xs text-default-400">Valor estoque</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <TruckIcon className="w-5 h-5 text-amber-500" />
                  <Badge
                    content={transferenciasPendentes}
                    color="warning"
                    size="sm"
                  >
                    <div className="w-2 h-2" />
                  </Badge>
                </div>
                <p className="text-xs text-default-500 uppercase tracking-wide">
                  Estoque
                </p>
                <p className="text-lg font-bold">{analiseEstoque.totalItens}</p>
                <p className="text-xs text-default-400">
                  Críticos: {analiseEstoque.itensCriticos}
                </p>
              </CardBody>
            </Card>
          </div>

          {canViewRelatorios && (
            <>
              {/* Gráficos Principais */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Evolução Financeira</h3>
                      <Chip size="sm" variant="flat">
                        {receitaTemporal.length} dias
                      </Chip>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={receitaTemporal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="data" fontSize={11} />
                          <YAxis
                            tickFormatter={(v) => (v / 1000).toFixed(0) + "k"}
                            fontSize={11}
                          />
                          <RTooltip content={<CustomTooltip />} />
                          <Bar dataKey="vendas" fill="#3B82F6" opacity={0.3} />
                          <Line
                            type="monotone"
                            dataKey="receita"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="bruto"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="devolucoes"
                            stackId="1"
                            stroke="#F43F5E"
                            fill="#F43F5E"
                            fillOpacity={0.3}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-4">
                    <h3 className="font-semibold mb-4">Formas de Pagamento</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={receitaPorPagamento}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {receitaPorPagamento.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Performance por Loja */}
              {performanceLojas.length > 0 && (
                <Card>
                  <CardBody className="p-4">
                    <h3 className="font-semibold mb-4">Performance por Loja</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceLojas}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="loja" />
                          <YAxis tickFormatter={(v) => fmtBRL(v)} />
                          <RTooltip content={<CustomTooltip />} />
                          <Bar dataKey="receita" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Top Rankings */}
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {/* Top Produtos */}
                <Card>
                  <CardBody className="p-4">
                    <h3 className="font-semibold mb-4">Top Produtos (Valor)</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {topProdutos.map((produto, idx) => (
                        <div
                          key={produto.nome}
                          className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-100/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-32">
                                {produto.nome}
                              </p>
                              <p className="text-xs text-default-500">
                                Qtd: {produto.quantidade}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {fmtBRL(produto.valor)}
                            </p>
                            {produto.margem && (
                              <p className="text-xs text-success">
                                {produto.margem.toFixed(1)}% margem
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {/* Top Clientes */}
                <Card>
                  <CardBody className="p-4">
                    <h3 className="font-semibold mb-4">Top Clientes</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {topClientes.map((cliente, idx) => (
                        <div
                          key={cliente.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-100/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium truncate max-w-32">
                                {cliente.nome}
                              </p>
                              <p className="text-xs text-default-500">
                                {cliente.vendas} compras
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {fmtBRL(cliente.valor)}
                            </p>
                            {cliente.credito > 0 && (
                              <p className="text-xs text-warning">
                                Créd: {fmtBRL(cliente.credito)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                {/* Top Vendedores */}
                <Card>
                  <CardBody className="p-4">
                    <h3 className="font-semibold mb-4">Top Vendedores</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {topVendedores.map((vendedor, idx) => (
                        <div
                          key={vendedor.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-100/50"
                        >
                          <div className="flex items-center gap-3">
                            {vendedor.foto ? (
                              <Avatar src={vendedor.foto} size="sm" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                {vendedor.nome.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium truncate max-w-32">
                                {vendedor.nome}
                              </p>
                              <p className="text-xs text-default-500">
                                {vendedor.vendas} vendas •{" "}
                                {vendedor.ordens || 0} OS
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {fmtBRL(vendedor.receita)}
                            </p>
                            <p className="text-xs text-default-500">
                              {vendedor.vendas > 0
                                ? fmtBRL(vendedor.receita / vendedor.vendas)
                                : "-"}{" "}
                              ticket
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </>
          )}

          {/* Status Cards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Estoque Crítico */}
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                    Estoque Crítico
                  </h3>
                  <Chip size="sm" color="warning" variant="flat">
                    {analiseEstoque.itensCriticos} itens
                  </Chip>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analiseEstoque.itensDetalhados.map((item) => {
                    const quantidadeTotal = estoqueLojas
                      .filter((el) => el.produto_id === item.id)
                      .reduce((sum, el) => sum + Number(el.quantidade || 0), 0);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded bg-warning-50 dark:bg-warning-100/10"
                      >
                        <div>
                          <p className="text-sm font-medium truncate">
                            {item.descricao || "Item sem nome"}
                          </p>
                          <p className="text-xs text-default-500">
                            {item.marca} {item.modelo}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {quantidadeTotal}
                          </p>
                          <p className="text-xs text-warning">
                            Min: {item.minimo}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {analiseEstoque.itensCriticos === 0 && (
                    <p className="text-sm text-default-500 text-center py-4">
                      ✅ Nenhum item crítico
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Status Ordens */}
            <Card>
              <CardBody className="p-4">
                <h3 className="font-semibold mb-4">Status das Ordens</h3>
                <div className="space-y-3">
                  {statusOrdens.map((status) => (
                    <div
                      key={status.status}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{status.status}</span>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat">
                          {status.total}
                        </Chip>
                        <span className="text-xs text-default-500">
                          {fmtBRL(status.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {kpis.ordensAtrasadas > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-danger-50 dark:bg-danger-100/10">
                    <p className="text-sm font-medium text-danger">
                      ⚠️ {kpis.ordensAtrasadas} ordens atrasadas
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Resumo Financeiro */}
            <Card>
              <CardBody className="p-4">
                <h3 className="font-semibold mb-4">Resumo Financeiro</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-600">
                      Receita Bruta
                    </span>
                    <span className="font-semibold">
                      {fmtBRL(kpis.receitaBruta)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-600">Descontos</span>
                    <span className="font-semibold text-orange-600">
                      -{fmtBRL(kpis.descontos)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-600">Devoluções</span>
                    <span className="font-semibold text-red-600">
                      -{fmtBRL(kpis.totalDevolucoes)}
                    </span>
                  </div>
                  <hr className="border-default-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">
                      Receita Líquida
                    </span>
                    <span className="font-bold text-lg text-success">
                      {fmtBRL(kpis.receita - kpis.totalDevolucoes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-600">A Receber</span>
                    <span className="font-semibold text-warning">
                      {fmtBRL(kpis.aReceber)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-default-600">
                      Crédito Gerado
                    </span>
                    <span className="font-semibold text-primary">
                      {fmtBRL(kpis.creditoGerado)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
