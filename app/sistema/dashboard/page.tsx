"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { useAuthStore } from "@/store/authZustand";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import {
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  Battery100Icon,
} from "@heroicons/react/24/outline";
import {
  KPICard,
  FiltroPeriodo,
  VendasChart,
  ProdutosChart,
  FormasPagamentoChart,
  OrdensStatus,
  EstoqueStatus,
  DashboardPDFGenerator,
  type Venda,
  type Estoque,
  type EstoqueLoja,
  type Cliente,
  type Ordem,
  type Usuario,
  type Loja,
  type Transferencia,
  type Devolucao,
  type Fornecedor,
  type KPIData,
  type ChartDataItem,
  type ProdutoVendidoItem,
  type FormasPagamentoItem,
  type VendasPorLojaItem,
  type TopClienteItem,
  type TopVendedorItem,
  type EstoqueInfo,
} from "@/components/dashboard";
import toast, { Toaster } from "react-hot-toast";

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
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const { user } = useAuthStore();
  const acessos = user?.permissoes?.acessos;
  const permDashboard = acessos?.dashboard;
  const canViewDashboard = !!permDashboard?.ver_dashboard;
  const canExportarDados = !!permDashboard?.exportar_dados;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
  }

  useEffect(() => {
    if (!dateStart && !dateEnd && selectedPeriod) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(selectedPeriod));
      setDateStart(start.toISOString().slice(0, 10));
      setDateEnd(end.toISOString().slice(0, 10));
    }
  }, [selectedPeriod, dateStart, dateEnd]);

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

  const kpis = useMemo<KPIData>(() => {
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

    const totalDevolucoes = devolucoes.length;
    const valorDevolucoes = devolucoes.reduce(
      (acc, d) => acc + Number(d.valor_total_devolvido || 0),
      0
    );
    const taxaDevolucao = totalVendas > 0 ? (totalDevolucoes / totalVendas) * 100 : 0;

    const totalOrdens = ordensFiltradasPeriodo.length;
    const ordensAbertas = ordensFiltradasPeriodo.filter((o) => o.status === "aberta").length;
    const ordensConcluidas = ordensFiltradasPeriodo.filter((o) => o.status === "concluida").length;
    const taxaConclusao = totalOrdens > 0 ? (ordensConcluidas / totalOrdens) * 100 : 0;
    const valorOrdens = ordensFiltradasPeriodo.reduce(
      (acc, o) => acc + Number(o.valor || 0),
      0
    );
    const ticketOrdem = totalOrdens ? valorOrdens / totalOrdens : 0;

    const totalClientes = clientes.length;
    const clientesAtivos = clientes.filter((c) =>
      vendasFiltradas.some((v) => v.id_cliente === c.id)
    ).length;

    const dataInicioPeriodo = dateStart ? new Date(dateStart) : new Date(0);
    const clientesNovos = clientes.filter((c) => {
      if (!c.createdat) return false;
      return new Date(c.createdat) >= dataInicioPeriodo;
    }).length;

    const totalUsuarios = usuarios.length;
    const totalLojas = lojas.length;
    const totalFornecedores = fornecedores.length;
    const fornecedoresAtivos = fornecedores.filter((f) => f.ativo).length;

    return {
      totalVendas,
      receita,
      receitaBruta,
      descontos,
      aReceber,
      valorPago,
      fiadoVencido,
      ticket,
      margemDesconto,
      totalDevolucoes,
      valorDevolucoes,
      taxaDevolucao,
      totalOrdens,
      ordensAbertas,
      ordensConcluidas,
      taxaConclusao,
      valorOrdens,
      ticketOrdem,
      totalClientes,
      clientesAtivos,
      clientesNovos,
      totalUsuarios,
      totalLojas,
      totalFornecedores,
      fornecedoresAtivos,
    };
  }, [
    vendasFiltradas,
    ordensFiltradasPeriodo,
    devolucoes,
    clientes,
    usuarios,
    lojas,
    fornecedores,
    dateStart,
  ]);

  const chartData = useMemo<ChartDataItem[]>(() => {
    const map = new Map<string, { date: string; receita: number; vendas: number }>();

    vendasFiltradas.forEach((v) => {
      const d = new Date(v.data_venda).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      if (!map.has(d)) map.set(d, { date: d, receita: 0, vendas: 0 });
      const r = map.get(d)!;
      r.receita += Number(v.total_liquido || 0);
      r.vendas += 1;
    });

    return Array.from(map.values());
  }, [vendasFiltradas]);

  const produtosVendidos = useMemo<ProdutoVendidoItem[]>(() => {
    const map = new Map<string, { produto: string; quantidade: number; valor: number }>();

    vendasFiltradas.forEach((v) => {
      v.itens.forEach((item: any) => {
        const key = item.descricao || `Produto ${item.id_estoque}`;
        if (!map.has(key)) {
          map.set(key, { produto: key, quantidade: 0, valor: 0 });
        }
        const obj = map.get(key)!;
        obj.quantidade += Number(item.quantidade || 0);
        obj.valor += Number(item.subtotal || 0);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [vendasFiltradas]);

  const formasPagamento = useMemo<FormasPagamentoItem[]>(() => {
    const map = new Map<string, { forma: string; total: number; quantidade: number }>();

    vendasFiltradas.forEach((v) => {
      const forma = v.forma_pagamento || "Não informado";
      if (!map.has(forma)) {
        map.set(forma, { forma, total: 0, quantidade: 0 });
      }
      const obj = map.get(forma)!;
      obj.total += Number(v.total_liquido || 0);
      obj.quantidade += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [vendasFiltradas]);

  const vendasPorLoja = useMemo<VendasPorLojaItem[]>(() => {
    const map = new Map<number, { nome: string; total: number; vendas: number; ticket: number }>();

    vendasFiltradas.forEach((v) => {
      if (!v.loja_id) return;
      const loja = lojas.find((l) => l.id === v.loja_id);
      const nomeLoja = loja?.nome || `Loja ${v.loja_id}`;

      if (!map.has(v.loja_id)) {
        map.set(v.loja_id, { nome: nomeLoja, total: 0, vendas: 0, ticket: 0 });
      }
      const obj = map.get(v.loja_id)!;
      obj.total += Number(v.total_liquido || 0);
      obj.vendas += 1;
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      ticket: item.vendas > 0 ? item.total / item.vendas : 0,
    }));
  }, [vendasFiltradas, lojas]);

  const topClientes = useMemo<TopClienteItem[]>(() => {
    const map = new Map<number, { nome: string; total: number; vendas: number; ticket: number }>();

    vendasFiltradas.forEach((v) => {
      if (!v.id_cliente) return;
      const cliente = clientes.find((c) => c.id === v.id_cliente);
      const nomeCliente = cliente?.nome || v.cliente_nome || `Cliente ${v.id_cliente}`;

      if (!map.has(v.id_cliente)) {
        map.set(v.id_cliente, { nome: nomeCliente, total: 0, vendas: 0, ticket: 0 });
      }
      const obj = map.get(v.id_cliente)!;
      obj.total += Number(v.total_liquido || 0);
      obj.vendas += 1;
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        ticket: item.vendas > 0 ? item.total / item.vendas : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [vendasFiltradas, clientes]);

  const topVendedores = useMemo<TopVendedorItem[]>(() => {
    const map = new Map<string, { nome: string; total: number; vendas: number; ticket: number }>();

    vendasFiltradas.forEach((v) => {
      if (!v.id_usuario) return;
      const usuario = usuarios.find((u) => u.uuid === v.id_usuario);
      const nomeUsuario = usuario?.nome || `Usuário ${v.id_usuario}`;

      if (!map.has(v.id_usuario)) {
        map.set(v.id_usuario, { nome: nomeUsuario, total: 0, vendas: 0, ticket: 0 });
      }
      const obj = map.get(v.id_usuario)!;
      obj.total += Number(v.total_liquido || 0);
      obj.vendas += 1;
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        ticket: item.vendas > 0 ? item.total / item.vendas : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [vendasFiltradas, usuarios]);

  const estoqueInfo = useMemo<EstoqueInfo>(() => {
    const valorTotal = estoque.reduce((acc, item) => {
      const quantidadeTotal = estoqueLojas
        .filter((el) => el.produto_id === item.id)
        .reduce((sum, el) => sum + el.quantidade, 0);
      return acc + quantidadeTotal * Number(item.preco_compra || 0);
    }, 0);

    const totalProdutos = estoque.length;

    const produtosAbaixoMinimo = estoque.filter((item) => {
      const quantidadeTotal = estoqueLojas
        .filter((el) => el.produto_id === item.id)
        .reduce((sum, el) => sum + el.quantidade, 0);
      return quantidadeTotal <= Number(item.minimo || 0);
    }).length;

    const produtosSemEstoque = estoque.filter((item) => {
      const quantidadeTotal = estoqueLojas
        .filter((el) => el.produto_id === item.id)
        .reduce((sum, el) => sum + el.quantidade, 0);
      return quantidadeTotal === 0;
    }).length;

    return {
      valorTotal,
      totalProdutos,
      produtosAbaixoMinimo,
      produtosSemEstoque,
    };
  }, [estoque, estoqueLojas]);

  function handleExportarPDF() {
    if (!canExportarDados) {
      toast.error("Você não possui permissão para exportar dados.");
      return;
    }

    try {
      DashboardPDFGenerator.gerar(
        { inicio: dateStart, fim: dateEnd },
        kpis,
        produtosVendidos,
        formasPagamento,
        vendasPorLoja,
        topClientes,
        topVendedores,
        estoqueInfo
      );
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar relatório.");
    }
  }

  function fmtBRL(valor: number): string {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (!canViewDashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm">
              Você não possui permissão para visualizar o dashboard.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col justify-center items-center h-96">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-primary" />
            Dashboard Executivo
          </h1>
          <p className="text-default-500 mt-1">
            Visão completa e estratégica do negócio
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            color="primary"
            variant="shadow"
            startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
            onPress={handleExportarPDF}
            isDisabled={!canExportarDados}
          >
            Exportar PDF
          </Button>
          <Button
            color="default"
            variant="flat"
            startContent={<ArrowTrendingUpIcon className="w-5 h-5" />}
            onPress={loadData}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtro de Período */}
      <FiltroPeriodo
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* KPIs Principais - Grid 4 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total de Vendas"
          value={kpis.totalVendas}
          icon={<ShoppingCartIcon className="w-8 h-8" />}
          color="primary"
          subtitle={`${fmtBRL(kpis.receita)} em receita`}
        />
        <KPICard
          title="Receita Líquida"
          value={fmtBRL(kpis.receita)}
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
          color="success"
          subtitle={`Ticket: ${fmtBRL(kpis.ticket)}`}
        />
        <KPICard
          title="A Receber"
          value={fmtBRL(kpis.aReceber)}
          icon={<ClockIcon className="w-8 h-8" />}
          color="warning"
          subtitle={`${kpis.fiadoVencido} fiados vencidos`}
        />
        <KPICard
          title="Clientes Ativos"
          value={kpis.clientesAtivos}
          icon={<UsersIcon className="w-8 h-8" />}
          color="primary"
          subtitle={`${kpis.clientesNovos} novos no período`}
        />
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Ordens de Serviço"
          value={kpis.totalOrdens}
          icon={<WrenchScrewdriverIcon className="w-8 h-8" />}
          color="primary"
          subtitle={`${kpis.ordensConcluidas} concluídas`}
        />
        <KPICard
          title="Valor em Ordens"
          value={fmtBRL(kpis.valorOrdens)}
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
          color="success"
          subtitle={`Ticket: ${fmtBRL(kpis.ticketOrdem)}`}
        />
        <KPICard
          title="Valor em Estoque"
          value={fmtBRL(estoqueInfo.valorTotal)}
          icon={<Battery100Icon className="w-8 h-8" />}
          color="default"
          subtitle={`${estoqueInfo.totalProdutos} produtos`}
        />
        <KPICard
          title="Taxa de Devolução"
          value={`${kpis.taxaDevolucao.toFixed(1)}%`}
          icon={<ArrowTrendingUpIcon className="w-8 h-8" />}
          color={kpis.taxaDevolucao > 5 ? "danger" : "success"}
          subtitle={`${kpis.totalDevolucoes} devoluções`}
        />
      </div>

      {/* Gráficos - Grid 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <VendasChart data={chartData} />
        <ProdutosChart data={produtosVendidos} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FormasPagamentoChart data={formasPagamento} />
        <OrdensStatus ordens={ordensFiltradasPeriodo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <EstoqueStatus info={estoqueInfo} />
        <Card>
          <CardBody>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🏆 Top 5 Clientes
            </h3>
            <div className="space-y-3">
              {topClientes.slice(0, 5).map((cliente, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-default-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cliente.nome}</p>
                      <p className="text-xs text-default-500">
                        {cliente.vendas} compras
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success-600">
                      {fmtBRL(cliente.total)}
                    </p>
                    <p className="text-xs text-default-500">
                      Ticket: {fmtBRL(cliente.ticket)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top Vendedores */}
      {topVendedores.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              💼 Top 10 Vendedores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topVendedores.slice(0, 10).map((vendedor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{vendedor.nome}</p>
                      <p className="text-xs text-default-600">
                        {vendedor.vendas} vendas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-700">
                      {fmtBRL(vendedor.total)}
                    </p>
                    <p className="text-xs text-default-600">
                      {fmtBRL(vendedor.ticket)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
