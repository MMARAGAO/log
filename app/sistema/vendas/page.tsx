"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authZustand";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import {
  currencyMask,
  currencyToNumber,
  numberToCurrencyInput,
} from "@/utils/maskInput";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Switch,
  Pagination,
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Tooltip,
  Divider,
  Spinner,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HandRaisedIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserIcon,
  CubeIcon,
  MinusIcon,
  ShoppingCartIcon,
  PrinterIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

// Tipos baseados no schema
interface Cliente {
  id: number;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
  doc?: string | null;
}

interface Loja {
  id: number;
  nome: string;
  endereco?: string | null;
  telefone?: string | null;
  fotourl?: string[] | null;
  descricao?: string | null;
}

interface EstoqueItem {
  id: number;
  descricao: string | null;
  modelo?: string | null;
  marca?: string | null;
  preco_venda?: number | null;
  fotourl?: string[] | null;
  // Campos do estoque_lojas
  quantidade?: number | null;
  loja_id?: number | null;
}

interface Usuario {
  uuid: string;
  nome: string | null;
  email?: string | null;
  cargo?: string | null;
  fotourl?: string[] | null;
}

interface VendaItem {
  id_estoque: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  subtotal: number;
  foto?: string;
}

interface Venda {
  id: number;
  data_venda: string; // ISO
  id_cliente?: number;
  cliente_nome?: string;
  id_usuario?: string;
  loja_id?: number;
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
  credito_usado?: number; // NOVO CAMPO
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

type StatusPagamento =
  | "pago"
  | "pendente"
  | "cancelado"
  | "vencido"
  | "fiado"
  | "devolvido";

const STATUS_OPTIONS = [
  { key: "pendente", label: "Pendente", color: "warning", icon: ClockIcon },
  { key: "pago", label: "Pago", color: "success", icon: CheckCircleIcon },
  { key: "fiado", label: "Fiado", color: "secondary", icon: HandRaisedIcon },
  {
    key: "vencido",
    label: "Vencido",
    color: "danger",
    icon: ExclamationTriangleIcon,
  },
  { key: "cancelado", label: "Cancelado", color: "default", icon: XMarkIcon },
  {
    key: "devolvido",
    label: "Devolvido",
    color: "danger",
    icon: ArrowPathIcon,
  },
];

const PAGAMENTO_OPTIONS: {
  key: string;
  label: string;
  icon: any;
}[] = [
  { key: "Dinheiro", label: "Dinheiro", icon: BanknotesIcon },
  { key: "PIX", label: "PIX", icon: DevicePhoneMobileIcon },
  { key: "Cartão de Débito", label: "Cartão Débito", icon: CreditCardIcon },
  { key: "Cartão de Crédito", label: "Cartão Crédito", icon: CreditCardIcon },
  { key: "Transferência", label: "Transferência", icon: BuildingLibraryIcon },
  { key: "Boleto", label: "Boleto", icon: DocumentTextIcon },
  { key: "Crediário", label: "Crediário", icon: CalendarDaysIcon },
  { key: "Fiado", label: "Fiado", icon: HandRaisedIcon },
];

const ORDER_FIELDS = [
  { key: "data_venda", label: "Data" },
  { key: "cliente_nome", label: "Cliente" },
  { key: "total_liquido", label: "Valor" },
  { key: "valor_restante", label: "Restante" },
  { key: "status_pagamento", label: "Status" },
  { key: "forma_pagamento", label: "Pagamento" },
  { key: "data_vencimento", label: "Vencimento" },
];

interface FilterState {
  search: string;
  status: string;
  pagamento: string;
  vencidas: boolean;
  cliente: string;
  loja: string;
  orderBy: string;
  direction: "asc" | "desc";
  inicio: string;
  fim: string;
  valorMin: string;
  valorMax: string;
}

const PAGE_SIZE = 15;

export default function VendasPage() {
  // Auth
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permVendas = acessos?.vendas;
  const canViewVendas = !!permVendas?.ver_vendas;
  const canCreateVendas = !!permVendas?.criar_vendas;
  const canEditVendas = !!permVendas?.editar_vendas;
  const canDeleteVendas = !!permVendas?.deletar_vendas;
  const canProcessarPagamentos = !!permVendas?.processar_pagamentos;

  // Dados
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);

  // NOVOS ESTADOS PARA CRÉDITO
  const [clienteCredito, setClienteCredito] = useState(0);
  const [creditoAplicado, setCreditoAplicado] = useState(0);
  const [creditoInput, setCreditoInput] = useState(numberToCurrencyInput(0));
  const [usarCredito, setUsarCredito] = useState(false);
  const [pagamentoFormaPagamento, setPagamentoFormaPagamento] = useState("");

  // Adicionar novos estados para controle do tipo de desconto
  const [tipoDesconto, setTipoDesconto] = useState<"valor" | "porcentagem">(
    "valor"
  );
  const [descontoPercentual, setDescontoPercentual] = useState(0);

  // Função para calcular desconto baseado no tipo
  function calcularDesconto(
    tipo: "valor" | "porcentagem",
    valor: number,
    totalBruto: number
  ) {
    if (tipo === "porcentagem") {
      return (totalBruto * valor) / 100;
    }
    return valor;
  }

  // Função modificada para lidar com desconto por porcentagem
  function handleDescontoTotalChange(
    raw: string,
    tipo?: "valor" | "porcentagem"
  ) {
    const tipoAtual = tipo || tipoDesconto;

    if (tipoAtual === "porcentagem") {
      // Para porcentagem, não usar máscara de moeda
      const num = Math.min(100, Math.max(0, Number(raw) || 0));
      setDescontoPercentual(num);
      const descontoEmValor = calcularDesconto(
        "porcentagem",
        num,
        formData.total_bruto || 0
      );
      setFormData((p) => ({ ...p, desconto: descontoEmValor }));
      recalcTotals(
        formData.itens || [],
        descontoEmValor,
        undefined,
        undefined,
        creditoAplicado
      );
    } else {
      // Para valor, usar máscara de moeda
      const masked = currencyMask(raw);
      setDescontoInput(masked);
      const num = currencyToNumber(masked);
      setFormData((p) => ({ ...p, desconto: num }));
      recalcTotals(
        formData.itens || [],
        num,
        undefined,
        undefined,
        creditoAplicado
      );
    }
  }

  function handleDescontoTotalBlur() {
    if (tipoDesconto === "valor") {
      setDescontoInput(numberToCurrencyInput(formData.desconto || 0));
    }
  }

  // Função para alternar tipo de desconto
  function alternarTipoDesconto(novoTipo: "valor" | "porcentagem") {
    setTipoDesconto(novoTipo);

    // Limpar valores ao trocar tipo
    if (novoTipo === "porcentagem") {
      setDescontoPercentual(0);
      setDescontoInput(numberToCurrencyInput(0));
    } else {
      setDescontoInput(numberToCurrencyInput(0));
      setDescontoPercentual(0);
    }

    // Resetar desconto
    setFormData((p) => ({ ...p, desconto: 0 }));
    recalcTotals(
      formData.itens || [],
      0,
      undefined,
      undefined,
      creditoAplicado
    );
  }

  // Atualizar função resetForm
  function resetForm() {
    setEditingVenda(null);
    setFormData({
      data_venda: new Date().toISOString().slice(0, 10),
      itens: [],
      total_bruto: 0,
      desconto: 0,
      total_liquido: 0,
      forma_pagamento: "Dinheiro",
      status_pagamento: "pendente",
      fiado: false,
      valor_pago: 0,
      valor_restante: 0,
      data_vencimento: undefined,
    });
    setSelectedCliente(null);
    setSelectedLoja(null);
    setSelectedUsuario(
      user
        ? {
            uuid: user.id,
            nome: user.nome || user.email || "Usuário",
          }
        : null
    );
    setSelectedProduto(null);
    setProdutoQtd(1);
    setProdutoDesc(0);
    setDescontoInput(numberToCurrencyInput(0));
    setValorPagoInput(numberToCurrencyInput(0));

    // NOVOS RESETS PARA DESCONTO
    setTipoDesconto("valor");
    setDescontoPercentual(0);

    // RESETS PARA CRÉDITO
    setClienteCredito(0);
    setCreditoAplicado(0);
    setCreditoInput(numberToCurrencyInput(0));
    setUsarCredito(false);

    setEstoque([]);
    setSearchProduto("");
    setProductPage(1);
  }

  const [loading, setLoading] = useState(false);

  // NOVA FUNÇÃO: Buscar crédito do cliente
  async function buscarCreditoCliente(clienteId: number) {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("credito")
        .eq("id", clienteId)
        .single();

      if (error) throw error;

      const credito = Number(data?.credito) || 0;
      setClienteCredito(credito);
      return credito;
    } catch (e) {
      console.error("[VENDAS] Erro ao buscar crédito do cliente:", e);
      setClienteCredito(0);
      return 0;
    }
  }

  // Handlers com verificação de permissão
  function safeOpenNewVenda() {
    if (!canCreateVendas) {
      alert("Você não possui permissão para criar vendas.");
      return;
    }
    openNewVenda();
  }

  function safeOpenEditVenda(v: Venda) {
    if (!canEditVendas) {
      alert("Você não possui permissão para editar vendas.");
      return;
    }
    openEditVenda(v);
  }

  function safeOpenPagamento(v: Venda) {
    if (!canProcessarPagamentos) {
      alert("Você não possui permissão para processar pagamentos.");
      return;
    }
    openPagamento(v);
  }

  function safeOpenDelete(v: Venda) {
    if (!canDeleteVendas) {
      alert("Você não possui permissão para deletar vendas.");
      return;
    }
    openDelete(v);
  }

  // Filtros
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    pagamento: "",
    vencidas: false,
    cliente: "",
    loja: "",
    orderBy: "data_venda",
    direction: "desc",
    inicio: "",
    fim: "",
    valorMin: "",
    valorMax: "",
  });

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Modal principal (criar/editar)
  const vendaModal = useDisclosure();
  // Modal detalhes
  const viewModal = useDisclosure();
  // Modal pagamento
  const payModal = useDisclosure();
  // Modal exclusão
  const deleteModal = useDisclosure();

  // Estado de formulário de venda
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [formData, setFormData] = useState<Partial<Venda>>({
    data_venda: new Date().toISOString().slice(0, 10),
    itens: [],
    total_bruto: 0,
    desconto: 0,
    total_liquido: 0,
    forma_pagamento: "Dinheiro",
    status_pagamento: "pendente",
    fiado: false,
    valor_pago: 0,
    valor_restante: 0,
  });

  // Seleções auxiliares
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);

  // Adição de itens
  const [searchProduto, setSearchProduto] = useState("");
  const [selectedProduto, setSelectedProduto] = useState<EstoqueItem | null>(
    null
  );
  const [produtoQtd, setProdutoQtd] = useState(1);
  const [produtoDesc, setProdutoDesc] = useState(0);
  const [descontoInput, setDescontoInput] = useState(numberToCurrencyInput(0));
  const [valorPagoInput, setValorPagoInput] = useState(
    numberToCurrencyInput(0)
  );
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PAGE_SIZE = 12;

  // Pagamento incremental
  const [pagamentoValor, setPagamentoValor] = useState("");
  const [pagamentoObs, setPagamentoObs] = useState("");

  // Venda em foco (view / pagar / delete)
  const [targetVenda, setTargetVenda] = useState<Venda | null>(null);

  // Carregar dados iniciais
  async function loadAll() {
    setLoading(true);
    try {
      const [vendasData, clientesData, usuariosData, lojasData] =
        await Promise.all([
          fetchTable("vendas"),
          fetchTable("clientes"),
          fetchTable("usuarios"),
          fetchTable("lojas"),
        ]);
      setVendas(
        (vendasData || []).map((v: any) => ({
          ...v,
          itens: Array.isArray(v.itens) ? v.itens : v.itens || [],
        }))
      );
      setClientes(clientesData || []);
      setUsuarios(usuariosData || []);
      setLojas(lojasData || []);

      console.log("[VENDAS] Dados carregados:", {
        vendas: vendasData?.length || 0,
        clientes: clientesData?.length || 0,
        usuarios: usuariosData?.length || 0,
        lojas: lojasData?.length || 0,
      });
    } catch (e) {
      console.error("[VENDAS] Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }

  // Carregar estoque da loja selecionada
  async function loadEstoquePorLoja(lojaId: number) {
    if (!lojaId) {
      setEstoque([]);
      return;
    }

    console.log("[VENDAS] Carregando estoque da loja:", lojaId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("estoque")
        .select(
          `
          id,
          descricao,
          modelo,
          marca,
          preco_venda,
          fotourl,
          estoque_lojas!inner(
            quantidade,
            loja_id
          )
        `
        )
        .eq("estoque_lojas.loja_id", lojaId)
        .gt("estoque_lojas.quantidade", 0);

      if (error) {
        console.error("[VENDAS] Erro na query de estoque:", error);
        throw error;
      }

      const estoqueComQuantidade = (data || []).map((item: any) => {
        const quantidade = item.estoque_lojas?.[0]?.quantidade || 0;
        return {
          id: item.id,
          descricao: item.descricao,
          modelo: item.modelo,
          marca: item.marca,
          preco_venda: item.preco_venda,
          fotourl: item.fotourl,
          quantidade: quantidade,
          loja_id: lojaId,
        };
      });

      setEstoque(estoqueComQuantidade);
    } catch (e) {
      console.error("[VENDAS] Erro ao carregar estoque da loja:", e);
      setEstoque([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Carregar estoque quando loja for selecionada
  useEffect(() => {
    if (selectedLoja?.id) {
      loadEstoquePorLoja(selectedLoja.id);
    } else {
      setEstoque([]);
    }
  }, [selectedLoja?.id]);

  // NOVO USEEFFECT: Buscar crédito quando cliente for selecionado
  useEffect(() => {
    if (selectedCliente?.id) {
      buscarCreditoCliente(selectedCliente.id);
    } else {
      setClienteCredito(0);
      setCreditoAplicado(0);
      setCreditoInput(numberToCurrencyInput(0));
      setUsarCredito(false);
    }
  }, [selectedCliente?.id]);

  // Helpers
  function fmt(v: number | undefined | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  }

  function fmtDate(d?: string | null) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("pt-BR");
  }

  function computeStatus(v: Venda): StatusPagamento {
    return v.status_pagamento;
  }

  function statusInfo(status: StatusPagamento) {
    return STATUS_OPTIONS.find((s) => s.key === status) || STATUS_OPTIONS[0];
  }

  function pagamentoIcon(p: string) {
    return PAGAMENTO_OPTIONS.find((x) => x.key === p)?.icon || BanknotesIcon;
  }

  function getNomeLoja(lojaId?: number) {
    return lojas.find((l) => l.id === lojaId)?.nome || "Sem loja";
  }

  // Filtros / ordenação
  const filtered = useMemo(() => {
    return vendas
      .map((v) => ({ ...v, status_calc: computeStatus(v) }))
      .filter((v) => {
        if (
          filters.search &&
          !(
            v.cliente_nome
              ?.toLowerCase()
              .includes(filters.search.toLowerCase()) ||
            v.id.toString() === filters.search ||
            v.forma_pagamento
              ?.toLowerCase()
              .includes(filters.search.toLowerCase())
          )
        )
          return false;
        if (filters.status && v.status_calc !== filters.status) return false;
        if (filters.pagamento && v.forma_pagamento !== filters.pagamento)
          return false;
        if (filters.vencidas) {
          if (!(v.status_calc === "vencido")) return false;
        }
        if (filters.cliente && v.cliente_nome !== filters.cliente) return false;
        if (filters.loja && v.loja_id?.toString() !== filters.loja)
          return false;
        if (filters.inicio && v.data_venda < filters.inicio) return false;
        if (filters.fim && v.data_venda > filters.fim + "T23:59:59")
          return false;
        const minVal =
          filters.valorMin && currencyToNumber(filters.valorMin) > 0
            ? currencyToNumber(filters.valorMin)
            : null;
        const maxVal =
          filters.valorMax && currencyToNumber(filters.valorMax) > 0
            ? currencyToNumber(filters.valorMax)
            : null;
        if (minVal !== null && (v.total_liquido || 0) < minVal) return false;
        if (maxVal !== null && (v.total_liquido || 0) > maxVal) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = filters.direction === "asc" ? 1 : -1;
        let av: any = a[filters.orderBy as keyof Venda];
        let bv: any = b[filters.orderBy as keyof Venda];
        if (
          filters.orderBy === "data_venda" ||
          filters.orderBy === "data_vencimento"
        ) {
          av = av ? new Date(av).getTime() : 0;
          bv = bv ? new Date(bv).getTime() : 0;
        }
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
  }, [vendas, filters, lojas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Estatísticas
  const stats = useMemo(() => {
    const count = vendas.length;
    const faturamento = vendas.reduce(
      (acc, v) => acc + (Number(v.total_liquido) || 0),
      0
    );
    const pagas = vendas.filter((v) => computeStatus(v) === "pago").length;
    const vencidas = vendas.filter(
      (v) => computeStatus(v) === "vencido"
    ).length;
    const receber = vendas
      .filter((v) => v.valor_restante > 0)
      .reduce((acc, v) => acc + Number(v.valor_restante), 0);
    const ticket = count > 0 ? faturamento / count : 0;
    return { count, faturamento, pagas, vencidas, receber, ticket };
  }, [vendas]);

  function openNewVenda() {
    resetForm();
    vendaModal.onOpen();
  }

  function openEditVenda(v: Venda) {
    resetForm();
    setEditingVenda(v);
    setFormData({
      ...v,
      data_venda: v.data_venda.slice(0, 10),
      data_vencimento: v.data_vencimento
        ? v.data_vencimento.slice(0, 10)
        : undefined,
      itens: v.itens || [],
    });
    setSelectedCliente(clientes.find((c) => c.id === v.id_cliente) || null);
    setSelectedUsuario(usuarios.find((u) => u.uuid === v.id_usuario) || null);
    setSelectedLoja(lojas.find((l) => l.id === v.loja_id) || null);
    vendaModal.onOpen();
  }

  // FUNÇÃO MODIFICADA: recalcTotals agora considera crédito
  function recalcTotals(
    itens: VendaItem[],
    desconto?: number,
    valor_pago?: number,
    fiado?: boolean,
    credito_aplicado?: number
  ) {
    const totalBruto = itens.reduce((acc, i) => acc + i.subtotal, 0);
    const desc = desconto ?? formData.desconto ?? 0;
    const credito = credito_aplicado ?? creditoAplicado ?? 0;

    // Total líquido considerando desconto e crédito
    const liquido = Math.max(0, totalBruto - desc - credito);

    const pago = valor_pago ?? formData.valor_pago ?? 0;
    const isFiado = fiado ?? formData.fiado ?? false;
    const restante = Math.max(0, liquido - pago);

    setFormData((prev) => ({
      ...prev,
      itens,
      total_bruto: totalBruto,
      total_liquido: liquido,
      valor_restante: restante,
    }));
  }

  // NOVAS FUNÇÕES PARA GERENCIAR CRÉDITO
  function handleCreditoChange(raw: string) {
    const masked = currencyMask(raw);
    setCreditoInput(masked);
    const num = currencyToNumber(masked);

    // CORREÇÃO: Adicionar fallback para undefined
    const maxCredito = Math.min(
      clienteCredito,
      (formData.total_bruto || 0) - (formData.desconto || 0)
    );
    const creditoFinal = Math.min(num, maxCredito);

    setCreditoAplicado(creditoFinal);
    recalcTotals(
      formData.itens || [],
      formData.desconto,
      formData.valor_pago,
      formData.fiado,
      creditoFinal
    );
  }

  function handleCreditoBlur() {
    setCreditoInput(numberToCurrencyInput(creditoAplicado || 0));
  }

  function toggleUsarCredito(usar: boolean) {
    setUsarCredito(usar);
    if (!usar) {
      setCreditoAplicado(0);
      setCreditoInput(numberToCurrencyInput(0));
      recalcTotals(
        formData.itens || [],
        formData.desconto,
        formData.valor_pago,
        formData.fiado,
        0
      );
    }
  }

  function handleProdutoDescontoChange(raw: string) {
    const masked = currencyMask(raw);
    const num = currencyToNumber(masked);
    setProdutoDesc(num);
  }

  function addProduto() {
    if (!selectedProduto) {
      alert("Selecione um produto.");
      return;
    }
    if (!selectedLoja) {
      alert("Selecione uma loja primeiro.");
      return;
    }

    const disponivel = Number(selectedProduto.quantidade) || 0;

    if (disponivel === 0) {
      alert("Produto sem estoque nesta loja.");
      return;
    }
    if (produtoQtd > disponivel) {
      alert(`Estoque insuficiente. Disponível: ${disponivel}`);
      return;
    }

    const itens = [...(formData.itens || [])];
    const idx = itens.findIndex((i) => i.id_estoque === selectedProduto.id);
    const preco = Number(selectedProduto.preco_venda) || 0;

    if (idx >= 0) {
      const soma = itens[idx].quantidade + produtoQtd;
      if (soma > disponivel) {
        alert(
          `Quantidade total excede estoque. Atual no carrinho: ${itens[idx].quantidade}, disponível: ${disponivel}`
        );
        return;
      }
      itens[idx].quantidade = soma;
      itens[idx].subtotal =
        itens[idx].quantidade * itens[idx].preco_unitario -
        (itens[idx].desconto || 0);
    } else {
      itens.push({
        id_estoque: selectedProduto.id,
        descricao: selectedProduto.descricao || "Produto",
        modelo: selectedProduto.modelo || undefined,
        marca: selectedProduto.marca || undefined,
        quantidade: produtoQtd,
        preco_unitario: preco,
        desconto: produtoDesc,
        subtotal: produtoQtd * preco - produtoDesc,
        foto: selectedProduto.fotourl?.[0],
      });
    }

    recalcTotals(itens, undefined, undefined, undefined, creditoAplicado);
    setSelectedProduto(null);
    setProdutoQtd(1);
    setProdutoDesc(0);
  }

  function updateItemQty(index: number, qty: number) {
    if (qty <= 0) {
      removeItem(index);
      return;
    }
    const itens = [...(formData.itens || [])];
    const item = itens[index];
    const prod = estoque.find((p) => p.id === item.id_estoque);
    const disponivel = Number(prod?.quantidade) || 0;
    if (qty > disponivel) {
      alert(
        `Quantidade solicitada (${qty}) excede o estoque da loja (${disponivel}).`
      );
      qty = disponivel;
    }
    item.quantidade = qty;
    item.subtotal = item.quantidade * item.preco_unitario - item.desconto;
    recalcTotals(itens, undefined, undefined, undefined, creditoAplicado);
  }

  function removeItem(index: number) {
    const itens = (formData.itens || []).filter((_, i) => i !== index);
    recalcTotals(itens, undefined, undefined, undefined, creditoAplicado);
  }

  function applyDesconto(valor: string) {
    const num = currencyToNumber(valor);
    recalcTotals(
      formData.itens || [],
      num,
      undefined,
      undefined,
      creditoAplicado
    );
    setFormData((p) => ({ ...p, desconto: num }));
  }

  function applyValorPago(valor: string) {
    const num = currencyToNumber(valor);
    const fiado = formData.fiado || false;
    const restante = Math.max(
      0,
      (formData.total_liquido || 0) - (fiado ? num : num)
    );
    setFormData((p) => ({
      ...p,
      valor_pago: num,
      valor_restante: restante,
    }));
  }

  function toggleFiado(on: boolean) {
    setFormData((p) => ({
      ...p,
      fiado: on,
    }));
  }

  function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const out: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined) return;
      if (Number.isNaN(v)) return;
      out[k] = v;
    });
    return out as T;
  }

  // FUNÇÃO MODIFICADA: saveVenda com funcionalidade de crédito
  async function saveVenda() {
    try {
      if (!formData.itens || formData.itens.length === 0) {
        alert("Adicione itens.");
        return;
      }
      if (!selectedCliente) {
        alert("Selecione o cliente.");
        return;
      }
      if (!selectedLoja) {
        alert("Selecione a loja.");
        return;
      }
      if (formData.fiado && !formData.data_vencimento) {
        alert("Defina data de vencimento para fiado.");
        return;
      }

      if (editingVenda && !canEditVendas) {
        alert("Você não possui permissão para editar vendas.");
        return;
      }
      if (!editingVenda && !canCreateVendas) {
        alert("Você não possui permissão para criar vendas.");
        return;
      }

      const itensLimpos: VendaItem[] = (formData.itens || []).map((i) => ({
        id_estoque: i.id_estoque,
        descricao: i.descricao,
        modelo: i.modelo,
        marca: i.marca,
        quantidade: Number(i.quantidade) || 0,
        preco_unitario: Number(i.preco_unitario) || 0,
        desconto: Number(i.desconto) || 0,
        subtotal:
          (Number(i.quantidade) || 0) * (Number(i.preco_unitario) || 0) -
          (Number(i.desconto) || 0),
        foto: i.foto,
      }));

      const total_bruto = itensLimpos.reduce(
        (acc, i) => acc + (i.subtotal + i.desconto),
        0
      );
      const desconto = Number(formData.desconto) || 0;
      const credito_usado = Number(creditoAplicado) || 0; // NOVO

      // MODIFICADO: total líquido agora considera crédito
      const total_liquido = Math.max(0, total_bruto - desconto - credito_usado);
      const valor_pago = Number(formData.valor_pago) || 0;
      const valor_restante = Math.max(0, total_liquido - valor_pago);

      const status_pagamento = formData.status_pagamento || "pendente";

      // MODIFICADO: payload agora inclui informações de crédito
      const payloadRaw = {
        data_venda: new Date(formData.data_venda + "T00:00:00").toISOString(),
        data_vencimento: formData.data_vencimento
          ? new Date(formData.data_vencimento + "T00:00:00").toISOString()
          : null,
        id_cliente: selectedCliente.id,
        cliente_nome: selectedCliente.nome,
        id_usuario: selectedUsuario?.uuid || null,
        loja_id: selectedLoja.id,
        itens: itensLimpos,
        total_bruto,
        desconto,
        credito_usado, // NOVO: salva o crédito usado
        total_liquido,
        forma_pagamento: formData.forma_pagamento,
        status_pagamento,
        fiado: !!formData.fiado,
        valor_pago,
        valor_restante,
        observacoes:
          [
            formData.observacoes || "",
            credito_usado > 0 ? `Crédito aplicado: ${fmt(credito_usado)}` : "",
          ]
            .filter(Boolean)
            .join("\n")
            .trim() || null, // NOVO: adiciona info do crédito nas observações
        updated_at: new Date().toISOString(),
      };

      const payload = sanitizeObject(payloadRaw);

      console.log("Payload final para o DB:", payload);

      setLoading(true);

      let vendaId: number | undefined;

      if (editingVenda) {
        vendaId = editingVenda.id;
        try {
          await updateTable("vendas", editingVenda.id, payload);
        } catch (errWrapper) {
          const { error } = await supabase
            .from("vendas")
            .update(payload)
            .eq("id", editingVenda.id);
          if (error) throw error;
        }
      } else {
        try {
          const inserted = await insertTable("vendas", payload);
          vendaId = inserted?.[0]?.id;
        } catch (errWrapper) {
          const { data, error } = await supabase
            .from("vendas")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;
          vendaId = data?.id;
        }
      }

      // Ajuste de estoque (apenas para vendas novas)
      if (!editingVenda && vendaId && selectedLoja) {
        await Promise.all(
          itensLimpos.map(async (it) => {
            if (!it.id_estoque || !it.quantidade) return;

            const { data: current, error: curErr } = await supabase
              .from("estoque_lojas")
              .select("quantidade")
              .eq("produto_id", it.id_estoque)
              .eq("loja_id", selectedLoja.id)
              .single();

            if (curErr) {
              console.warn(
                "[VENDAS] Falha ao buscar estoque da loja para produto",
                it.id_estoque,
                "loja",
                selectedLoja.id,
                curErr
              );
              return;
            }

            const atual = Number(current?.quantidade) || 0;
            const nova = Math.max(0, atual - it.quantidade);

            const { error: updErr } = await supabase
              .from("estoque_lojas")
              .update({
                quantidade: nova,
                updatedat: new Date().toISOString(),
              })
              .eq("produto_id", it.id_estoque)
              .eq("loja_id", selectedLoja.id);

            if (updErr) {
              console.warn(
                "[VENDAS] Falha ao atualizar estoque da loja",
                it.id_estoque,
                "loja",
                selectedLoja.id,
                updErr
              );
            }
          })
        );
      }

      // NOVA FUNCIONALIDADE: Atualizar crédito do cliente
      if (credito_usado > 0 && selectedCliente) {
        try {
          const novoCredito = Math.max(0, clienteCredito - credito_usado);

          console.log(
            `[VENDAS] Atualizando crédito do cliente ${selectedCliente.id}: ${fmt(clienteCredito)} → ${fmt(novoCredito)}`
          );

          const { error: creditoError } = await supabase
            .from("clientes")
            .update({
              credito: novoCredito,
              updated_at: new Date().toISOString(),
            })
            .eq("id", selectedCliente.id);

          if (creditoError) {
            console.warn(
              "[VENDAS] Erro ao atualizar crédito do cliente:",
              creditoError
            );
            alert(
              `Venda salva com sucesso, mas houve erro ao atualizar o crédito do cliente: ${creditoError.message}`
            );
          } else {
            console.log(
              `[VENDAS] Crédito atualizado com sucesso: ${fmt(clienteCredito)} → ${fmt(novoCredito)}`
            );

            // Atualiza o estado local para refletir o novo saldo
            setClienteCredito(novoCredito);

            // Se não há mais crédito, desativa o uso
            if (novoCredito === 0) {
              setUsarCredito(false);
              setCreditoAplicado(0);
              setCreditoInput(numberToCurrencyInput(0));
            }
          }
        } catch (e) {
          console.error("[VENDAS] Erro ao processar crédito:", e);
          alert(
            `Venda salva com sucesso, mas houve erro ao processar o crédito: ${e}`
          );
        }
      }

      await loadAll();
      vendaModal.onClose();

      // Feedback de sucesso
      if (credito_usado > 0) {
        alert(
          `Venda salva com sucesso! Crédito de ${fmt(credito_usado)} foi aplicado.`
        );
      }
    } catch (e: any) {
      console.error("[VENDAS] Erro ao salvar:", e);
      alert(
        "Erro ao salvar: " +
          (e?.message ||
            e?.details ||
            e?.hint ||
            JSON.stringify(e) ||
            "desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // Pagamento incremental
  function openPagamento(v: Venda) {
    setTargetVenda(v);
    setPagamentoValor("");
    setPagamentoObs("");
    setPagamentoFormaPagamento(v.forma_pagamento || ""); // Inicializa com a forma atual
    payModal.onOpen();
  }

  async function confirmarPagamento() {
    if (!targetVenda) return;

    if (!canProcessarPagamentos) {
      alert("Você não possui permissão para processar pagamentos.");
      return;
    }

    const valor = currencyToNumber(pagamentoValor);
    if (valor <= 0) return;
    const restanteAtual = Number(targetVenda.valor_restante) || 0;
    if (valor > restanteAtual) {
      alert("Valor informado excede o restante (" + fmt(restanteAtual) + ").");
      return;
    }
    const novoPago = Number(targetVenda.valor_pago || 0) + valor;
    const restante = Math.max(0, Number(targetVenda.total_liquido) - novoPago);

    const obsConcat = [
      targetVenda.observacoes || "",
      `${new Date().toLocaleDateString("pt-BR")}: Pagamento ${fmt(valor)}${
        pagamentoObs ? " - " + pagamentoObs : ""
      }${
        pagamentoFormaPagamento &&
        pagamentoFormaPagamento !== targetVenda.forma_pagamento
          ? ` (${pagamentoFormaPagamento})`
          : ""
      }`,
    ]
      .join("\n")
      .trim();

    setLoading(true);
    try {
      // MODIFICADO: Agora inclui a forma de pagamento na atualização
      const updateData: any = {
        valor_pago: novoPago,
        valor_restante: restante,
        observacoes: obsConcat,
      };

      // Se a forma de pagamento foi alterada, atualiza também
      if (
        pagamentoFormaPagamento &&
        pagamentoFormaPagamento !== targetVenda.forma_pagamento
      ) {
        updateData.forma_pagamento = pagamentoFormaPagamento;
      }

      await updateTable("vendas", targetVenda.id, updateData);
      await loadAll();
      payModal.onClose();
    } catch (e: any) {
      console.error("Erro ao registrar pagamento:", e);
      alert(
        "Erro ao registrar pagamento: " +
          (e?.message || e?.details || JSON.stringify(e) || "desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // Exclusão
  function openDelete(v: Venda) {
    setTargetVenda(v);
    deleteModal.onOpen();
  }

  async function confirmarDelete() {
    if (!targetVenda) return;

    if (!canDeleteVendas) {
      alert("Você não possui permissão para deletar vendas.");
      return;
    }

    setLoading(true);
    try {
      await deleteTable("vendas", targetVenda.id);
      await loadAll();
      deleteModal.onClose();
    } catch (e: any) {
      console.error("Erro ao excluir venda:", e);
      alert(
        "Erro ao excluir: " +
          (e?.message ||
            e?.details ||
            e?.hint ||
            JSON.stringify(e) ||
            "erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // View
  function openView(v: Venda) {
    setTargetVenda(v);
    viewModal.onOpen();
  }

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    if (!searchProduto) return estoque;
    return estoque.filter((p) =>
      [p.descricao, p.marca, p.modelo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchProduto.toLowerCase())
    );
  }, [estoque, searchProduto]);

  const paginatedProdutos = useMemo(() => {
    const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
    return produtosFiltrados.slice(start, start + PRODUCTS_PAGE_SIZE);
  }, [produtosFiltrados, productPage]);

  useEffect(() => {
    setProductPage(1);
  }, [searchProduto]);

  if (
    loading &&
    !vendaModal.isOpen &&
    !payModal.isOpen &&
    !deleteModal.isOpen
  ) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando vendas..." />
      </div>
    );
  }

  if (!canViewVendas) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ShoppingCartIcon className="w-6 h-6" />
              Vendas
            </h1>
            <p className="text-sm text-default-500">
              Gestão de vendas e recebimentos
            </p>
          </div>
        </div>

        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar vendas.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // UI -------------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCartIcon className="w-6 h-6" />
            Vendas
          </h1>
          <p className="text-sm text-default-500">
            Gestão de vendas e recebimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "solid" : "flat"}
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowFilters((v) => !v)}
          >
            Filtros
          </Button>
          {canCreateVendas && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={safeOpenNewVenda}
            >
              Nova Venda
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Total de Vendas</p>
            <p className="text-2xl font-semibold">{stats.count}</p>
            <p className="text-xs text-default-400">{stats.pagas} pagas</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Faturamento</p>
            <p className="text-xl font-semibold">{fmt(stats.faturamento)}</p>
            <p className="text-xs text-default-400">
              Ticket médio {fmt(stats.ticket)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">A Receber</p>
            <p className="text-xl font-semibold text-orange-600">
              {fmt(stats.receber)}
            </p>
            <p className="text-xs text-default-400">
              {vendas.filter((v) => v.valor_restante > 0).length} vendas
            </p>
          </CardBody>
        </Card>
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

      {/* Barra de busca */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
          placeholder="Buscar por cliente, ID ou forma de pagamento"
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
          className="flex-1"
        />
        <Select
          size="sm"
          label="Ordenar"
          selectedKeys={[filters.orderBy]}
          onSelectionChange={(k) =>
            setFilters((p) => ({
              ...p,
              orderBy: Array.from(k)[0] as string,
            }))
          }
          className="max-w-xs"
        >
          {ORDER_FIELDS.map((o) => (
            <SelectItem key={o.key}>{o.label}</SelectItem>
          ))}
        </Select>
        <Button
          isIconOnly
          variant="flat"
          onPress={() =>
            setFilters((p) => ({
              ...p,
              direction: p.direction === "asc" ? "desc" : "asc",
            }))
          }
        >
          {filters.direction === "asc" ? (
            <ArrowUpIcon className="w-4 h-4" />
          ) : (
            <ArrowDownIcon className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="flat"
          onPress={() =>
            setFilters({
              search: "",
              status: "",
              pagamento: "",
              vencidas: false,
              cliente: "",
              loja: "",
              orderBy: "data_venda",
              direction: "desc",
              inicio: "",
              fim: "",
              valorMin: "",
              valorMax: "",
            })
          }
        >
          Limpar
        </Button>
      </div>

      {/* Painel de filtros avançados */}
      {showFilters && (
        <Card>
          <CardBody className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Select
              label="Status"
              size="sm"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  status: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.key}>{s.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Forma de Pagamento"
              size="sm"
              selectedKeys={filters.pagamento ? [filters.pagamento] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  pagamento: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todas"
            >
              {PAGAMENTO_OPTIONS.map((p) => (
                <SelectItem key={p.key}>{p.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Cliente"
              size="sm"
              selectedKeys={filters.cliente ? [filters.cliente] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  cliente: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              {Array.from(
                new Set(vendas.map((v) => v.cliente_nome).filter(Boolean))
              ).map((c) => (
                <SelectItem key={c as string}>{c as string}</SelectItem>
              ))}
            </Select>

            <Select
              label="Loja"
              size="sm"
              selectedKeys={filters.loja ? [filters.loja] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  loja: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todas"
            >
              {lojas.map((l) => (
                <SelectItem key={l.id}>{l.nome}</SelectItem>
              ))}
            </Select>

            <Input
              size="sm"
              type="date"
              label="Início"
              value={filters.inicio}
              onChange={(e) =>
                setFilters((p) => ({ ...p, inicio: e.target.value }))
              }
            />
            <Input
              size="sm"
              type="date"
              label="Fim"
              value={filters.fim}
              onChange={(e) =>
                setFilters((p) => ({ ...p, fim: e.target.value }))
              }
            />
            <Input
              size="sm"
              label="Mínimo"
              placeholder="R$ 0,00"
              value={filters.valorMin}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  valorMin: currencyMask(e.target.value),
                }))
              }
            />
            <Input
              size="sm"
              label="Máximo"
              placeholder="R$ 0,00"
              value={filters.valorMax}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  valorMax: currencyMask(e.target.value),
                }))
              }
            />
            <div className="flex items-center gap-2 mt-3">
              <Switch
                size="sm"
                isSelected={filters.vencidas}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, vencidas: v }))
                }
              >
                Vencidas
              </Switch>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <Table removeWrapper aria-label="Tabela de vendas">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Data</TableColumn>
                <TableColumn>Cliente</TableColumn>
                <TableColumn>Pagamento</TableColumn>
                <TableColumn>Total</TableColumn>
                <TableColumn>Restante</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Vencimento</TableColumn>
                <TableColumn>Ações</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Sem registros">
                {pageItems.map((v) => {
                  const st = computeStatus(v);
                  const info = statusInfo(st);
                  const Icon = info.icon;
                  const PayIcon = pagamentoIcon(v.forma_pagamento);
                  return (
                    <TableRow key={v.id}>
                      <TableCell>{v.id}</TableCell>
                      <TableCell>{fmtDate(v.data_venda)}</TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {v.cliente_nome || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <PayIcon className="w-4 h-4" />
                          <span className="text-xs">{v.forma_pagamento}</span>
                        </div>
                      </TableCell>
                      <TableCell>{fmt(Number(v.total_liquido))}</TableCell>
                      <TableCell>
                        {v.valor_restante > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {fmt(Number(v.valor_restante))}
                          </span>
                        ) : (
                          <span className="text-success font-medium">
                            {fmt(0)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          startContent={<Icon className="w-3.5 h-3.5" />}
                        >
                          {v.status_pagamento}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {v.fiado && v.data_vencimento
                          ? fmtDate(v.data_vencimento)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip content="Ver">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openView(v)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                          {canEditVendas && (
                            <Tooltip content="Editar">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => safeOpenEditVenda(v)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                          {canProcessarPagamentos && (
                            <Tooltip content="Pagamento">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => safeOpenPagamento(v)}
                                isDisabled={
                                  computeStatus(v) === "pago" ||
                                  computeStatus(v) === "cancelado"
                                }
                              >
                                <CurrencyDollarIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                          {canDeleteVendas && (
                            <Tooltip content="Excluir" color="danger">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => safeOpenDelete(v)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-between items-center">
        <span className="text-xs text-default-500">
          {filtered.length} registro(s)
        </span>
        {totalPages > 1 && (
          <Pagination
            page={page}
            total={totalPages}
            onChange={setPage}
            showControls
            size="sm"
          />
        )}
      </div>

      {/* Modal Venda */}
      {(canCreateVendas || canEditVendas) && (
        <Modal
          isOpen={vendaModal.isOpen}
          onOpenChange={vendaModal.onOpenChange}
          size="5xl"
          scrollBehavior="inside"
          isDismissable={false}
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2">
              {editingVenda ? "Editar Venda" : "Nova Venda"}
            </ModalHeader>
            <ModalBody className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid md:grid-cols-4 gap-4">
                <Input
                  label="Data"
                  type="date"
                  value={formData.data_venda}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, data_venda: e.target.value }))
                  }
                />

                <Select
                  label="Pagamento"
                  selectedKeys={
                    formData.forma_pagamento
                      ? [formData.forma_pagamento]
                      : ["Dinheiro"]
                  }
                  onSelectionChange={(k) => {
                    const key = Array.from(k)[0] as string;
                    const isFiado = key === "Fiado";
                    setFormData((p) => ({
                      ...p,
                      forma_pagamento: key,
                      fiado: isFiado,
                    }));
                  }}
                >
                  {PAGAMENTO_OPTIONS.map((o) => (
                    <SelectItem key={o.key}>{o.label}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Status"
                  selectedKeys={[formData.status_pagamento || "pendente"]}
                  onSelectionChange={(k) => {
                    const selectedStatus = Array.from(k)[0] as StatusPagamento;
                    setFormData((p) => ({
                      ...p,
                      status_pagamento: selectedStatus,
                    }));
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.key}>{s.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {formData.fiado && (
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    label="Vencimento"
                    type="date"
                    value={formData.data_vencimento || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        data_vencimento: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().slice(0, 10)}
                  />

                  <Input
                    label="Valor Pago"
                    value={valorPagoInput}
                    onChange={(e) => {
                      const masked = currencyMask(e.target.value);
                      setValorPagoInput(masked);
                      applyValorPago(masked);
                    }}
                    onBlur={() => {
                      setValorPagoInput(
                        numberToCurrencyInput(formData.valor_pago || 0)
                      );
                    }}
                    placeholder="R$ 0,00"
                    startContent={<CurrencyDollarIcon className="w-4 h-4" />}
                  />
                </div>
              )}

              <Divider />

              {/* Seleção de Cliente, Vendedor e Loja */}
              <div className="grid md:grid-cols-3 gap-4">
                <Autocomplete
                  label="Cliente"
                  placeholder="Selecione o cliente"
                  selectedKey={selectedCliente?.id.toString()}
                  onSelectionChange={(k) =>
                    setSelectedCliente(
                      clientes.find((c) => c.id.toString() === k) || null
                    )
                  }
                  isRequired
                >
                  {clientes.map((c) => (
                    <AutocompleteItem key={c.id}>{c.nome}</AutocompleteItem>
                  ))}
                </Autocomplete>

                <Autocomplete
                  label="Vendedor"
                  placeholder="Selecione o vendedor"
                  selectedKey={selectedUsuario?.uuid}
                  onSelectionChange={(k) =>
                    setSelectedUsuario(
                      usuarios.find((u) => u.uuid === k) || null
                    )
                  }
                >
                  {usuarios.map((u) => (
                    <AutocompleteItem key={u.uuid}>
                      {u.nome || u.email}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>

                <Autocomplete
                  label="Loja"
                  placeholder="Selecione a loja"
                  selectedKey={selectedLoja?.id.toString()}
                  onSelectionChange={(k) => {
                    const loja =
                      lojas.find((l) => l.id.toString() === k) || null;
                    setSelectedLoja(loja);
                  }}
                  isRequired
                  startContent={<BuildingStorefrontIcon className="w-4 h-4" />}
                >
                  {lojas.map((l) => (
                    <AutocompleteItem key={l.id}>{l.nome}</AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>

              {/* Aviso sobre seleção de loja */}
              {!selectedLoja && (
                <Card className="border-warning-200 bg-warning-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 shrink-0" />
                      <p className="text-warning-700 text-sm">
                        Selecione uma loja para visualizar os produtos
                        disponíveis para venda.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}

              <Divider />

              {/* Seção de Produtos */}
              {selectedLoja && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Produtos</h3>
                    <Chip size="sm" variant="flat" color="primary">
                      {estoque.length} disponíveis
                    </Chip>
                  </div>

                  {/* Busca e Adição de Produtos */}
                  <div className="space-y-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                      <Input
                        className="flex-1"
                        label="Buscar Produto"
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        startContent={
                          <MagnifyingGlassIcon className="w-4 h-4" />
                        }
                        placeholder="Descrição, marca ou modelo"
                      />
                      <Input
                        label="Quantidade"
                        type="number"
                        className="w-32"
                        value={produtoQtd.toString()}
                        onChange={(e) =>
                          setProdutoQtd(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        min="1"
                      />
                      <Input
                        label="Desconto Item"
                        className="w-40"
                        value={numberToCurrencyInput(produtoDesc || 0)}
                        onChange={(e) =>
                          handleProdutoDescontoChange(e.target.value)
                        }
                        placeholder="R$ 0,00"
                      />
                      <Button
                        color="primary"
                        onPress={addProduto}
                        isDisabled={
                          !selectedProduto ||
                          (Number(selectedProduto?.quantidade) || 0) === 0 ||
                          produtoQtd >
                            (Number(selectedProduto?.quantidade) || 0)
                        }
                        startContent={<PlusIcon className="w-4 h-4" />}
                        className="lg:w-44"
                      >
                        Adicionar
                      </Button>
                    </div>

                    {/* Grid de Produtos */}
                    {estoque.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
                        {paginatedProdutos.map((p) => {
                          const selected = selectedProduto?.id === p.id;
                          const disponivel = Number(p.quantidade) || 0;
                          const out = disponivel === 0;

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedProduto(p)}
                              className={`group relative text-left rounded-medium border p-3 transition
                                ${
                                  selected
                                    ? "border-primary bg-primary/10"
                                    : out
                                      ? "border-danger bg-danger/5 hover:border-danger"
                                      : "border-default-200 hover:border-primary"
                                } ${out ? "opacity-70" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                {p.fotourl?.[0] ? (
                                  <Avatar
                                    src={p.fotourl[0]}
                                    size="sm"
                                    radius="sm"
                                    className="shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-md bg-default-200 flex items-center justify-center shrink-0">
                                    <CubeIcon className="w-4 h-4 text-default-500" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p
                                    className={`text-xs font-medium truncate leading-tight ${
                                      out ? "text-danger-600" : ""
                                    }`}
                                    title={p.descricao || ""}
                                  >
                                    {p.descricao || "Produto"}
                                  </p>
                                  <p className="text-[10px] text-default-500 truncate">
                                    {[p.marca, p.modelo]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span
                                  className={`text-[11px] font-semibold ${
                                    out ? "text-danger-600" : "text-default-700"
                                  }`}
                                >
                                  {fmt(Number(p.preco_venda) || 0)}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                    out
                                      ? "border-danger/40 text-danger"
                                      : "border-success/30 text-success"
                                  }`}
                                >
                                  {out ? "Sem estoque" : `${disponivel} un`}
                                </span>
                              </div>
                              {selected && (
                                <span className="absolute top-1.5 right-1.5 inline-block w-2 h-2 rounded-full bg-primary shadow ring-2 ring-background" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-default-500">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Spinner size="sm" />
                            <span>Carregando produtos...</span>
                          </div>
                        ) : (
                          "Nenhum produto encontrado para esta loja."
                        )}
                      </div>
                    )}

                    {/* Paginação de produtos */}
                    {produtosFiltrados.length > PRODUCTS_PAGE_SIZE && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-default-500">
                          Mostrando {paginatedProdutos.length} de{" "}
                          {produtosFiltrados.length}
                        </span>
                        <Pagination
                          size="sm"
                          page={productPage}
                          total={Math.ceil(
                            produtosFiltrados.length / PRODUCTS_PAGE_SIZE
                          )}
                          onChange={setProductPage}
                          showControls
                          className="ml-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Lista de Itens no Carrinho */}
                  <div className="space-y-2">
                    <h4 className="font-medium">
                      Itens no Carrinho ({(formData.itens || []).length})
                    </h4>
                    {(formData.itens || []).length === 0 ? (
                      <p className="text-xs text-default-500 py-4 text-center border border-dashed border-default-200 rounded-md">
                        Nenhum item adicionado.
                      </p>
                    ) : (
                      (formData.itens || []).map((it, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-default-200 p-3"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {it.foto ? (
                              <Avatar src={it.foto} size="sm" />
                            ) : (
                              <div className="w-8 h-8 bg-default-200 rounded-full flex items-center justify-center">
                                <CubeIcon className="w-4 h-4 text-default-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {it.descricao}
                              </p>
                              <p className="text-[11px] text-default-500 truncate">
                                {[it.marca, it.modelo, fmt(it.preco_unitario)]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              isIconOnly
                              variant="flat"
                              size="sm"
                              onPress={() =>
                                updateItemQty(idx, it.quantidade - 1)
                              }
                            >
                              <MinusIcon className="w-4 h-4" />
                            </Button>
                            <Input
                              size="sm"
                              className="w-16"
                              type="number"
                              value={it.quantidade.toString()}
                              onChange={(e) =>
                                updateItemQty(idx, Number(e.target.value) || 1)
                              }
                              min="1"
                            />
                            <Button
                              isIconOnly
                              variant="flat"
                              size="sm"
                              onPress={() =>
                                updateItemQty(idx, it.quantidade + 1)
                              }
                            >
                              <PlusIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => removeItem(idx)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right w-32">
                            <p className="text-xs text-default-500">Subtotal</p>
                            <p className="text-sm font-semibold">
                              {fmt(it.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Divider />

                  {/* NOVA SEÇÃO: Crédito do Cliente */}
                  {selectedCliente && clienteCredito > 0 && (
                    <Card className="border-success-200 bg-success-50">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-success-600" />
                            <span className="text-sm font-medium text-success-700">
                              Crédito Disponível: {fmt(clienteCredito)}
                            </span>
                          </div>
                          <Switch
                            size="sm"
                            isSelected={usarCredito}
                            onValueChange={toggleUsarCredito}
                            color="success"
                          >
                            Usar Crédito
                          </Switch>
                        </div>

                        {usarCredito && (
                          <div className="space-y-3">
                            <Input
                              label="Valor do Crédito a Usar"
                              value={creditoInput}
                              onChange={(e) =>
                                handleCreditoChange(e.target.value)
                              }
                              onBlur={handleCreditoBlur}
                              placeholder="R$ 0,00"
                              startContent={
                                <CurrencyDollarIcon className="w-4 h-4" />
                              }
                              description={`Máximo disponível: ${fmt(Math.min(clienteCredito, (formData.total_bruto || 0) - (formData.desconto || 0)))}`}
                              color={
                                creditoAplicado > 0 ? "success" : "default"
                              }
                            />

                            {creditoAplicado > 0 && (
                              <div className="text-xs text-success-600 bg-success-100 p-2 rounded-md">
                                <CogIcon className="w-4 h-4 inline-block mr-1" />
                                Crédito de {fmt(creditoAplicado)} será aplicado
                                nesta venda
                              </div>
                            )}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  )}

                  {/* Seção de Totais com Desconto Melhorado */}
                  <div className="space-y-4">
                    {/* Tipo de Desconto */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        Tipo de Desconto:
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={tipoDesconto === "valor" ? "solid" : "flat"}
                          color={
                            tipoDesconto === "valor" ? "primary" : "default"
                          }
                          onPress={() => alternarTipoDesconto("valor")}
                        >
                          Valor (R$)
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            tipoDesconto === "porcentagem" ? "solid" : "flat"
                          }
                          color={
                            tipoDesconto === "porcentagem"
                              ? "primary"
                              : "default"
                          }
                          onPress={() => alternarTipoDesconto("porcentagem")}
                        >
                          Porcentagem (%)
                        </Button>
                      </div>
                    </div>

                    {/* Campos de Desconto e Totais */}
                    <div className="grid md:grid-cols-5 gap-4">
                      {/* Campo de Desconto */}
                      {tipoDesconto === "valor" ? (
                        <Input
                          label="Desconto"
                          value={descontoInput}
                          onChange={(e) =>
                            handleDescontoTotalChange(e.target.value, "valor")
                          }
                          onBlur={handleDescontoTotalBlur}
                          placeholder="R$ 0,00"
                          startContent={
                            <CurrencyDollarIcon className="w-4 h-4" />
                          }
                          description={`Valor atual: ${fmt(formData.desconto || 0)}`}
                        />
                      ) : (
                        <Input
                          label="Desconto (%)"
                          type="number"
                          value={descontoPercentual.toString()}
                          onChange={(e) =>
                            handleDescontoTotalChange(
                              e.target.value,
                              "porcentagem"
                            )
                          }
                          placeholder="0"
                          min="0"
                          max="100"
                          endContent={
                            <span className="text-default-400">%</span>
                          }
                          description={`Valor: ${fmt(formData.desconto || 0)}`}
                        />
                      )}

                      {/* Crédito Aplicado (se houver) */}
                      {usarCredito && creditoAplicado > 0 && (
                        <Input
                          label="Crédito Aplicado"
                          isReadOnly
                          value={numberToCurrencyInput(creditoAplicado)}
                          color="success"
                          startContent={
                            <CurrencyDollarIcon className="w-4 h-4" />
                          }
                        />
                      )}

                      {/* Total Bruto */}
                      <Input
                        label="Total Bruto"
                        isReadOnly
                        value={numberToCurrencyInput(formData.total_bruto || 0)}
                        startContent={
                          <CurrencyDollarIcon className="w-4 h-4" />
                        }
                      />

                      {/* Total Líquido */}
                      <Input
                        label="Total Líquido"
                        isReadOnly
                        value={numberToCurrencyInput(
                          formData.total_liquido || 0
                        )}
                        color={
                          creditoAplicado > 0 || (formData.desconto || 0) > 0
                            ? "success"
                            : "default"
                        }
                        startContent={
                          <CurrencyDollarIcon className="w-4 h-4" />
                        }
                      />

                      {/* Valor Restante */}
                      <Input
                        label="Valor Restante"
                        isReadOnly
                        value={numberToCurrencyInput(
                          formData.valor_restante || 0
                        )}
                        color={
                          (formData.valor_restante || 0) === 0
                            ? "success"
                            : "warning"
                        }
                        startContent={
                          <CurrencyDollarIcon className="w-4 h-4" />
                        }
                      />
                    </div>

                    {/* Resumo Visual dos Descontos (se houver) */}
                    {((formData.desconto || 0) > 0 || creditoAplicado > 0) && (
                      <Card className="border-success-200 bg-success-50">
                        <CardBody className="p-3">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Subtotal dos itens:</span>
                              <span className="font-medium">
                                {fmt(formData.total_bruto || 0)}
                              </span>
                            </div>

                            {(formData.desconto || 0) > 0 && (
                              <div className="flex justify-between text-primary">
                                <span>
                                  - Desconto{" "}
                                  {tipoDesconto === "porcentagem"
                                    ? `(${descontoPercentual}%)`
                                    : ""}
                                  :
                                </span>
                                <span className="font-medium">
                                  -{fmt(formData.desconto || 0)}
                                </span>
                              </div>
                            )}

                            {creditoAplicado > 0 && (
                              <div className="flex justify-between text-success-600">
                                <span>- Crédito aplicado:</span>
                                <span className="font-medium">
                                  -{fmt(creditoAplicado)}
                                </span>
                              </div>
                            )}

                            <Divider className="my-1" />
                            <div className="flex justify-between text-success-700 font-semibold">
                              <span>Total a pagar:</span>
                              <span>{fmt(formData.total_liquido || 0)}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>

                  <Textarea
                    label="Observações"
                    minRows={3}
                    value={formData.observacoes || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        observacoes: e.target.value,
                      }))
                    }
                    placeholder="Observações sobre a venda..."
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={vendaModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={saveVenda}
                isLoading={loading}
                isDisabled={
                  !selectedCliente ||
                  !selectedLoja ||
                  (formData.itens || []).length === 0
                }
              >
                {editingVenda ? "Atualizar" : "Salvar Venda"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Detalhes */}
      {/* Modal Detalhes */}
      <Modal
        isOpen={viewModal.isOpen}
        onOpenChange={viewModal.onOpenChange}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            Detalhes da Venda #{targetVenda?.id}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {targetVenda && (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-default-500">Data</p>
                    <p>{fmtDate(targetVenda.data_venda)}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Cliente</p>
                    <p>{targetVenda.cliente_nome}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Pagamento</p>
                    <p>{targetVenda.forma_pagamento}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Status</p>
                    <p>{statusInfo(computeStatus(targetVenda)).label}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Total Bruto</p>
                    <p>{fmt(Number(targetVenda.total_bruto))}</p>
                  </div>
                  {targetVenda.desconto && targetVenda.desconto > 0 && (
                    <div>
                      <p className="text-default-500">Desconto</p>
                      <p className="text-orange-600 font-medium">
                        -{fmt(Number(targetVenda.desconto))}
                      </p>
                    </div>
                  )}
                  {/* desconto em porcentagem */}
                  {targetVenda.desconto && targetVenda.desconto > 0 && (
                    <div>
                      <p className="text-default-500">Desconto (%)</p>
                      <p className="text-orange-600 font-medium">
                        -
                        {(
                          (targetVenda.desconto / targetVenda.total_bruto) *
                          100
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                  )}

                  {targetVenda.credito_usado !== undefined &&
                    targetVenda.credito_usado > 0 && (
                      <div>
                        <p className="text-default-500">Crédito Usado</p>
                        <p className="text-success-600 font-medium">
                          -{fmt(Number(targetVenda.credito_usado))}
                        </p>
                      </div>
                    )}
                  <div>
                    <p className="text-default-500">Total Líquido</p>
                    <p className="font-semibold text-primary">
                      {fmt(Number(targetVenda.total_liquido))}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500">Valor Pago</p>
                    <p>{fmt(Number(targetVenda.valor_pago))}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Restante</p>
                    <p
                      className={
                        targetVenda.valor_restante > 0
                          ? "text-orange-600 font-medium"
                          : "text-success-600"
                      }
                    >
                      {fmt(Number(targetVenda.valor_restante))}
                    </p>
                  </div>
                  {targetVenda.fiado && (
                    <div>
                      <p className="text-default-500">Vencimento</p>
                      <p>{fmtDate(targetVenda.data_vencimento || "")}</p>
                    </div>
                  )}
                </div>

                {/* Resumo Financeiro (se houver desconto ou crédito) */}
                {((targetVenda.desconto && targetVenda.desconto > 0) ||
                  (targetVenda.credito_usado !== undefined &&
                    targetVenda.credito_usado > 0)) && (
                  <>
                    <Divider />
                    <Card className="rounded-md p-3">
                      <p className="font-semibold mb-2 text-xs">
                        Resumo Financeiro
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="">Subtotal dos itens:</span>
                          <span className="font-medium">
                            {fmt(targetVenda.total_bruto)}
                          </span>
                        </div>
                        {targetVenda.desconto && targetVenda.desconto > 0 && (
                          <div className="flex justify-between">
                            <span className="">- Desconto aplicado:</span>
                            <span className="font-medium text-orange-600">
                              -{fmt(targetVenda.desconto)}
                            </span>
                          </div>
                        )}

                        {targetVenda.credito_usado !== undefined &&
                          targetVenda.credito_usado > 0 && (
                            <div className="flex justify-between">
                              <span className="">- Crédito usado:</span>
                              <span className="font-medium text-success-600">
                                -{fmt(targetVenda.credito_usado)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between border-t border-blue-200 pt-1">
                          <span className="font-semibold ">Total final:</span>
                          <span className="font-bold text-primary">
                            {fmt(targetVenda.total_liquido)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                <Divider />
                <div className="space-y-2">
                  <p className="text-xs font-semibold">
                    Itens ({targetVenda.itens.length})
                  </p>
                  {targetVenda.itens.map((i, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-xs border-b border-default-100 pb-1"
                    >
                      <span className="truncate">
                        {i.descricao} x{i.quantidade}
                      </span>
                      <span>{fmt(i.subtotal)}</span>
                    </div>
                  ))}
                </div>
                {targetVenda.observacoes && (
                  <>
                    <Divider />
                    <Textarea
                      isReadOnly
                      label="Observações"
                      value={targetVenda.observacoes}
                    />
                  </>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={viewModal.onClose}>
              Fechar
            </Button>
            <Button
              startContent={<PrinterIcon className="w-4 h-4" />}
              variant="flat"
              onPress={() => window.print()}
            >
              Imprimir
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Pagamento */}
      {canProcessarPagamentos && (
        <Modal
          isOpen={payModal.isOpen}
          onOpenChange={payModal.onOpenChange}
          size="lg"
          scrollBehavior="outside"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5" />
              Registrar Pagamento - Venda #{targetVenda?.id}
            </ModalHeader>
            <ModalBody className="space-y-6">
              {targetVenda && (
                <>
                  {/* Aviso se venda já está paga */}
                  {Number(targetVenda.valor_restante) === 0 && (
                    <Card className="border-success-200 bg-success-100">
                      <CardBody className="p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="w-6 h-6 text-success-600" />
                          <div>
                            <p className="font-semibold text-success-700">
                              Venda Totalmente Paga
                            </p>
                            <p className="text-sm text-success-600">
                              Esta venda já foi quitada completamente. Não é
                              possível adicionar mais pagamentos.
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* Resumo da Venda */}
                  <Card className="border-primary-200 bg-primary-50">
                    <CardBody className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-primary-600 font-medium">
                            Cliente:
                          </p>
                          <p className="font-semibold">
                            {targetVenda.cliente_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary-600 font-medium">Data:</p>
                          <p className="font-semibold">
                            {fmtDate(targetVenda.data_venda)}
                          </p>
                        </div>
                      </div>

                      <Divider className="my-3" />

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-primary-600 font-medium">
                            Total da Venda
                          </p>
                          <p className="text-xl font-bold text-primary">
                            {fmt(targetVenda.total_liquido)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-success-600 font-medium">
                            Já Pago
                          </p>
                          <p className="text-xl font-bold text-success">
                            {fmt(targetVenda.valor_pago)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-warning-600 font-medium">
                            Restante
                          </p>
                          <p className="text-xl font-bold text-warning">
                            {fmt(targetVenda.valor_restante)}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Valor do Pagamento - Só mostra se há valor restante */}
                  {Number(targetVenda.valor_restante) > 0 && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Valor do Pagamento
                          </label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => {
                                if (!targetVenda) return;
                                const restante =
                                  Number(targetVenda.valor_restante) || 0;
                                const valor25 =
                                  Math.round(restante * 0.25 * 100) / 100;
                                setPagamentoValor(
                                  numberToCurrencyInput(valor25)
                                );
                              }}
                              isDisabled={
                                Number(targetVenda.valor_restante) === 0
                              }
                            >
                              25%
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => {
                                if (!targetVenda) return;
                                const restante =
                                  Number(targetVenda.valor_restante) || 0;
                                const valor50 =
                                  Math.round(restante * 0.5 * 100) / 100;
                                setPagamentoValor(
                                  numberToCurrencyInput(valor50)
                                );
                              }}
                              isDisabled={
                                Number(targetVenda.valor_restante) === 0
                              }
                            >
                              50%
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="success"
                              onPress={() => {
                                if (!targetVenda) return;
                                const restante =
                                  Number(targetVenda.valor_restante) || 0;
                                setPagamentoValor(
                                  numberToCurrencyInput(restante)
                                );
                              }}
                              isDisabled={
                                Number(targetVenda.valor_restante) === 0
                              }
                              startContent={
                                <CheckCircleIcon className="w-4 h-4" />
                              }
                            >
                              Valor Total
                            </Button>
                          </div>
                        </div>

                        <Input
                          label="Valor a Pagar"
                          placeholder="R$ 0,00"
                          value={pagamentoValor}
                          size="lg"
                          startContent={
                            <CurrencyDollarIcon className="w-5 h-5" />
                          }
                          isDisabled={Number(targetVenda.valor_restante) === 0}
                          color={
                            currencyToNumber(pagamentoValor) >
                            Number(targetVenda.valor_restante || 0)
                              ? "danger"
                              : currencyToNumber(pagamentoValor) ===
                                  Number(targetVenda.valor_restante || 0)
                                ? "success"
                                : "primary"
                          }
                          description={
                            Number(targetVenda.valor_restante) === 0
                              ? "Esta venda já foi totalmente paga"
                              : currencyToNumber(pagamentoValor) >
                                  Number(targetVenda.valor_restante || 0)
                                ? "⚠️ Valor não pode exceder o restante"
                                : currencyToNumber(pagamentoValor) ===
                                    Number(targetVenda.valor_restante || 0)
                                  ? "✅ Venda será totalmente quitada"
                                  : currencyToNumber(pagamentoValor) > 0
                                    ? `Restará: ${fmt(Number(targetVenda.valor_restante || 0) - currencyToNumber(pagamentoValor))}`
                                    : `Máximo permitido: ${fmt(targetVenda.valor_restante)}`
                          }
                          onChange={(e) => {
                            const masked = currencyMask(e.target.value);
                            const valNum = currencyToNumber(masked);
                            const restante =
                              Number(targetVenda?.valor_restante) || 0;

                            // GARANTIR que nunca exceda o valor restante
                            if (valNum > restante) {
                              setPagamentoValor(
                                numberToCurrencyInput(restante)
                              );
                            } else {
                              setPagamentoValor(masked);
                            }
                          }}
                          onBlur={() => {
                            // Revalidar no blur para garantir consistência
                            const valNum = currencyToNumber(pagamentoValor);
                            const restante =
                              Number(targetVenda?.valor_restante) || 0;
                            if (valNum > restante) {
                              setPagamentoValor(
                                numberToCurrencyInput(restante)
                              );
                            }
                          }}
                        />
                      </div>

                      {/* Forma de Pagamento */}
                      <Select
                        label="Forma de Pagamento"
                        placeholder="Selecione a forma de pagamento"
                        startContent={<CreditCardIcon className="w-4 h-4" />}
                        selectedKeys={
                          pagamentoFormaPagamento
                            ? [pagamentoFormaPagamento]
                            : []
                        }
                        isDisabled={Number(targetVenda.valor_restante) === 0}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          setPagamentoFormaPagamento(selected); // Atualiza o estado
                        }}
                      >
                        {PAGAMENTO_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem
                              key={option.key}
                              startContent={<Icon className="w-4 h-4" />}
                            >
                              {option.label}
                            </SelectItem>
                          );
                        })}
                      </Select>

                      {/* Observações */}
                      <Textarea
                        label="Observação do Pagamento"
                        placeholder="Ex: Pagamento via PIX, Troco para R$ 100,00, etc..."
                        minRows={2}
                        value={pagamentoObs}
                        onChange={(e) => setPagamentoObs(e.target.value)}
                        startContent={<DocumentTextIcon className="w-4 h-4" />}
                        isDisabled={Number(targetVenda.valor_restante) === 0}
                      />

                      {/* Preview do Resultado */}
                      {currencyToNumber(pagamentoValor) > 0 &&
                        Number(targetVenda.valor_restante) > 0 && (
                          <Card className="border-success-200 bg-success-50">
                            <CardBody className="p-3">
                              <p className="text-success-700 font-medium text-sm mb-2">
                                📋 Resumo do Pagamento
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Valor atual pago:</span>
                                  <span className="font-medium">
                                    {fmt(targetVenda.valor_pago)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>+ Este pagamento:</span>
                                  <span className="font-medium text-primary">
                                    {fmt(currencyToNumber(pagamentoValor))}
                                  </span>
                                </div>
                                <Divider className="my-1" />
                                <div className="flex justify-between font-semibold">
                                  <span>Total pago após:</span>
                                  <span className="text-success">
                                    {fmt(
                                      targetVenda.valor_pago +
                                        currencyToNumber(pagamentoValor)
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Restante:</span>
                                  <span
                                    className={
                                      targetVenda.valor_restante -
                                        currencyToNumber(pagamentoValor) ===
                                      0
                                        ? "text-success font-semibold"
                                        : "text-warning"
                                    }
                                  >
                                    {fmt(
                                      Math.max(
                                        0,
                                        targetVenda.valor_restante -
                                          currencyToNumber(pagamentoValor)
                                      )
                                    )}
                                  </span>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                    </>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={payModal.onClose}
                startContent={<XMarkIcon className="w-4 h-4" />}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={confirmarPagamento}
                isLoading={loading}
                startContent={<CheckCircleIcon className="w-4 h-4" />}
                isDisabled={
                  currencyToNumber(pagamentoValor) <= 0 ||
                  Number(targetVenda?.valor_restante || 0) === 0 ||
                  currencyToNumber(pagamentoValor) >
                    Number(targetVenda?.valor_restante || 0)
                }
              >
                {Number(targetVenda?.valor_restante || 0) === 0
                  ? "Venda Já Paga"
                  : currencyToNumber(pagamentoValor) ===
                      Number(targetVenda?.valor_restante || 0)
                    ? "Finalizar Venda"
                    : "Registrar Pagamento"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Delete */}
      {canDeleteVendas && (
        <Modal
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
        >
          <ModalContent>
            <ModalHeader>Excluir Venda</ModalHeader>
            <ModalBody>
              Tem certeza que deseja excluir definitivamente a venda #
              {targetVenda?.id}?
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={deleteModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="danger"
                onPress={confirmarDelete}
                isLoading={loading}
              >
                Excluir
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
