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

interface EstoqueItem {
  id: number;
  descricao: string | null;
  modelo?: string | null;
  marca?: string | null;
  preco_venda?: number | null;
  quantidade?: number | null;
  fotourl?: string[] | null;
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
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
  total_liquido: number;
  forma_pagamento: FormaPagamento;
  status_pagamento: StatusPagamento;
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

type StatusPagamento = "pago" | "pendente" | "cancelado" | "vencido" | "fiado";
type FormaPagamento =
  | "Dinheiro"
  | "PIX"
  | "Cartão de Débito"
  | "Cartão de Crédito"
  | "Transferência"
  | "Boleto"
  | "Crediário"
  | "Fiado";

const STATUS_OPTIONS: {
  key: StatusPagamento;
  label: string;
  color: "success" | "warning" | "danger" | "default" | "secondary";
  icon: any;
}[] = [
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
];

const PAGAMENTO_OPTIONS: {
  key: FormaPagamento;
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

  const [loading, setLoading] = useState(false);

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

  // Adição de itens
  const [searchProduto, setSearchProduto] = useState("");
  const [selectedProduto, setSelectedProduto] = useState<EstoqueItem | null>(
    null
  );
  const [produtoQtd, setProdutoQtd] = useState(1);
  const [produtoDesc, setProdutoDesc] = useState(0);
  // Novo: estado de input do desconto total (string mascarada)
  const [descontoInput, setDescontoInput] = useState(numberToCurrencyInput(0));
  // Novo: paginação dos produtos
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PAGE_SIZE = 12;

  // Pagamento incremental
  const [pagamentoValor, setPagamentoValor] = useState(""); // manter string mascarada
  const [pagamentoObs, setPagamentoObs] = useState("");

  // Venda em foco (view / pagar / delete)
  const [targetVenda, setTargetVenda] = useState<Venda | null>(null);

  // Carregar dados iniciais
  async function loadAll() {
    setLoading(true);
    try {
      const [vendasData, clientesData, usuariosData, estoqueData] =
        await Promise.all([
          fetchTable("vendas"),
          fetchTable("clientes"),
          fetchTable("usuarios"),
          fetchTable("estoque"),
        ]);
      setVendas(
        (vendasData || []).map((v: any) => ({
          ...v,
          itens: Array.isArray(v.itens) ? v.itens : v.itens || [],
        }))
      );
      setClientes(clientesData || []);
      setUsuarios(usuariosData || []);
      // Antes filtrava quantidade > 0. Agora mantém todos.
      setEstoque(estoqueData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Helpers -------------------------------------------------

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
    if (v.status_pagamento === "cancelado") return "cancelado";
    if (v.valor_restante <= 0) return "pago";
    if (v.fiado) {
      if (
        v.data_vencimento &&
        new Date(v.data_vencimento) < new Date() &&
        v.valor_restante > 0
      )
        return "vencido";
      return "fiado";
    }
    return v.status_pagamento;
  }

  function statusInfo(status: StatusPagamento) {
    return STATUS_OPTIONS.find((s) => s.key === status) || STATUS_OPTIONS[0];
  }

  function pagamentoIcon(p: FormaPagamento) {
    return PAGAMENTO_OPTIONS.find((x) => x.key === p)?.icon || BanknotesIcon;
  }

  // Filtros / ordenação -------------------------------------
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
  }, [vendas, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Estatísticas ---------------------------------------------
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

  // Form venda -----------------------------------------------
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
  }

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
    vendaModal.onOpen();
  }

  function recalcTotals(
    itens: VendaItem[],
    desconto?: number,
    valor_pago?: number,
    fiado?: boolean
  ) {
    const totalBruto = itens.reduce((acc, i) => acc + i.subtotal, 0);
    const desc = desconto ?? formData.desconto ?? 0;
    const liquido = Math.max(0, totalBruto - desc);
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

  // Novo: aplicar desconto total usando máscara
  function handleDescontoTotalChange(raw: string) {
    const masked = currencyMask(raw);
    setDescontoInput(masked);
    const num = currencyToNumber(masked);
    setFormData((p) => ({ ...p, desconto: num }));
    recalcTotals(formData.itens || [], num);
  }

  function handleDescontoTotalBlur() {
    setDescontoInput(numberToCurrencyInput(formData.desconto || 0));
  }

  // Ajuste desconto por item (já tínhamos produtoDesc numérico)
  function handleProdutoDescontoChange(raw: string) {
    const masked = currencyMask(raw);
    const num = currencyToNumber(masked);
    setProdutoDesc(num);
  }

  function addProduto() {
    if (!selectedProduto) return;
    const disponivel = Number(selectedProduto.quantidade) || 0;
    if (disponivel === 0) {
      alert("Produto sem estoque.");
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
          `Quantidade excede estoque. Atual: ${itens[idx].quantidade}, disponível total: ${disponivel}`
        );
        return;
      }
      itens[idx].quantidade = soma;
      itens[idx].desconto = itens[idx].desconto || 0;
      itens[idx].subtotal =
        itens[idx].quantidade * itens[idx].preco_unitario - itens[idx].desconto;
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
    recalcTotals(itens);
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
    // Descobre estoque disponível atual (busca na lista de estoque)
    const prod = estoque.find((p) => p.id === item.id_estoque);
    const disponivel = Number(prod?.quantidade) || 0;
    if (qty > disponivel) {
      alert(`Quantidade solicitada (${qty}) excede o estoque (${disponivel}).`);
      qty = disponivel;
    }
    item.quantidade = qty;
    item.subtotal = item.quantidade * item.preco_unitario - item.desconto;
    recalcTotals(itens);
  }

  function removeItem(index: number) {
    const itens = (formData.itens || []).filter((_, i) => i !== index);
    recalcTotals(itens);
  }

  function applyDesconto(valor: string) {
    const num = currencyToNumber(valor);
    recalcTotals(formData.itens || [], num);
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
      status_pagamento:
        restante === 0
          ? "pago"
          : fiado
            ? "fiado"
            : p.status_pagamento === "cancelado"
              ? "cancelado"
              : "pendente",
    }));
  }

  function toggleFiado(on: boolean) {
    setFormData((p) => ({
      ...p,
      fiado: on,
      status_pagamento:
        on && (p.valor_restante || 0) > 0
          ? "fiado"
          : (p.valor_restante || 0) === 0
            ? "pago"
            : "pendente",
    }));
  }

  // Helper para remover undefined e garantir tipos simples
  function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const out: Record<string, any> = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined) return;
      if (Number.isNaN(v)) return;
      out[k] = v;
    });
    return out as T;
  }

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
      if (formData.fiado && !formData.data_vencimento) {
        alert("Defina data de vencimento para fiado.");
        return;
      }

      // Verificação de permissão
      if (editingVenda && !canEditVendas) {
        alert("Você não possui permissão para editar vendas.");
        return;
      }
      if (!editingVenda && !canCreateVendas) {
        alert("Você não possui permissão para criar vendas.");
        return;
      }

      // Recalcula para garantir consistência
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
      const total_liquido = Math.max(0, total_bruto - desconto);
      const valor_pago = Number(formData.valor_pago) || 0;
      const valor_restante = Math.max(0, total_liquido - valor_pago);

      // Ajusta status coerente
      let status_pagamento = formData.status_pagamento || "pendente";
      if (status_pagamento !== "cancelado") {
        if (valor_restante === 0) status_pagamento = "pago";
        else if (formData.fiado) status_pagamento = "fiado";
        else status_pagamento = "pendente";
      }

      const payloadRaw = {
        data_venda: new Date(formData.data_venda + "T00:00:00").toISOString(),
        data_vencimento: formData.data_vencimento
          ? new Date(formData.data_vencimento + "T00:00:00").toISOString()
          : null,
        id_cliente: selectedCliente.id,
        cliente_nome: selectedCliente.nome,
        id_usuario: selectedUsuario?.uuid || null,
        itens: itensLimpos,
        total_bruto,
        desconto,
        total_liquido,
        forma_pagamento: formData.forma_pagamento,
        status_pagamento,
        fiado: !!formData.fiado,
        valor_pago,
        valor_restante,
        observacoes: formData.observacoes || null,
        updated_at: new Date().toISOString(),
      };

      const payload = sanitizeObject(payloadRaw);

      setLoading(true);
      console.log(
        "[VENDAS] Salvando",
        editingVenda ? "UPDATE" : "INSERT",
        payload
      );

      if (editingVenda) {
        // Tenta via wrapper
        try {
          await updateTable("vendas", editingVenda.id, payload);
        } catch (errWrapper) {
          console.warn(
            "[VENDAS] Falha no wrapper updateTable, tentando fallback Supabase direto",
            errWrapper
          );
          const { error } = await supabase
            .from("vendas")
            .update(payload)
            .eq("id", editingVenda.id);
          if (error) throw error;
        }
        // TODO: Ajustar estoque caso itens tenham sido alterados (diferença entre antigo e novo)
      } else {
        // Inserção
        let insertedId: number | undefined;
        try {
          const inserted = await insertTable("vendas", payload);
          insertedId = inserted?.[0]?.id;
        } catch (errWrapper) {
          console.warn(
            "[VENDAS] Falha no wrapper insertTable, fallback Supabase direto",
            errWrapper
          );
          const { data, error } = await supabase
            .from("vendas")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;
          insertedId = data?.id;
        }

        // Ajuste de estoque (decremento)
        if (insertedId) {
          await Promise.all(
            itensLimpos.map(async (it) => {
              if (!it.id_estoque || !it.quantidade) return;
              const { data: current, error: curErr } = await supabase
                .from("estoque")
                .select("quantidade")
                .eq("id", it.id_estoque)
                .single();
              if (curErr) {
                console.warn(
                  "[VENDAS] Falha ao buscar estoque item",
                  it.id_estoque,
                  curErr
                );
                return;
              }
              const atual = Number(current?.quantidade) || 0;
              const nova = Math.max(0, atual - it.quantidade);
              const { error: updErr } = await supabase
                .from("estoque")
                .update({ quantidade: nova })
                .eq("id", it.id_estoque);
              if (updErr) {
                console.warn(
                  "[VENDAS] Falha ao atualizar estoque item",
                  it.id_estoque,
                  updErr
                );
              }
            })
          );
        }
      }

      await loadAll();
      vendaModal.onClose();
    } catch (e: any) {
      console.error(
        "[VENDAS] Erro ao salvar:",
        e,
        "serializado=",
        (() => {
          try {
            return JSON.stringify(e);
          } catch {
            return "N/A";
          }
        })()
      );
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

  // Pagamento incremental ------------------------------------
  function openPagamento(v: Venda) {
    setTargetVenda(v);
    setPagamentoValor("");
    setPagamentoObs("");
    payModal.onOpen();
  }

  async function confirmarPagamento() {
    if (!targetVenda) return;

    // Verificação de permissão
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
    const status: StatusPagamento =
      restante === 0 ? "pago" : targetVenda.fiado ? "fiado" : "pendente";
    const obsConcat = [
      targetVenda.observacoes || "",
      `${new Date().toLocaleDateString("pt-BR")}: Pagamento ${fmt(valor)}${
        pagamentoObs ? " - " + pagamentoObs : ""
      }`,
    ]
      .join("\n")
      .trim();
    setLoading(true);
    try {
      await updateTable("vendas", targetVenda.id, {
        valor_pago: novoPago,
        valor_restante: restante,
        status_pagamento: status,
        observacoes: obsConcat,
      });
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

  // Exclusão -------------------------------------------------
  function openDelete(v: Venda) {
    setTargetVenda(v);
    deleteModal.onOpen();
  }
  async function confirmarDelete() {
    if (!targetVenda) return;

    // Verificação de permissão
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

  // View -----------------------------------------------------
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

  // Novo: slice paginado
  const paginatedProdutos = useMemo(() => {
    const start = (productPage - 1) * PRODUCTS_PAGE_SIZE;
    return produtosFiltrados.slice(start, start + PRODUCTS_PAGE_SIZE);
  }, [produtosFiltrados, productPage]);

  // Reset página ao alterar busca
  useEffect(() => {
    setProductPage(1);
  }, [searchProduto]);

  // ...existing functions...

  // Verificação de loading/erro
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

      {/* Estatísticas - sempre visível se pode ver vendas */}
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
                          color={info.color}
                          variant="flat"
                          startContent={<Icon className="w-3.5 h-3.5" />}
                        >
                          {info.label}
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

      {/* Modal Venda - só abre se tiver permissão */}
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
                    const key = Array.from(k)[0] as FormaPagamento;
                    const isFiado = key === "Fiado";
                    setFormData((p) => ({
                      ...p,
                      forma_pagamento: key,
                      fiado: isFiado,
                      status_pagamento:
                        isFiado && (p.valor_restante || 0) > 0
                          ? "fiado"
                          : p.status_pagamento === "cancelado"
                            ? "cancelado"
                            : (p.valor_restante || 0) === 0
                              ? "pago"
                              : "pendente",
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
                  onSelectionChange={(k) =>
                    setFormData((p) => ({
                      ...p,
                      status_pagamento: Array.from(k)[0] as StatusPagamento,
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.key}>{s.label}</SelectItem>
                  ))}
                </Select>
                <div className="flex items-center gap-2 mt-5">
                  <Switch
                    isSelected={formData.fiado}
                    onValueChange={(v) => toggleFiado(v)}
                  >
                    Fiado
                  </Switch>
                </div>
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
                    value={numberToCurrencyInput(formData.valor_pago || 0)}
                    onChange={(e) => applyValorPago(e.target.value)}
                    placeholder="R$ 0,00"
                  />
                  <Input
                    label="Restante"
                    isReadOnly
                    value={numberToCurrencyInput(formData.valor_restante || 0)}
                  />
                </div>
              )}

              <Divider />

              <div className="grid md:grid-cols-2 gap-4">
                <Autocomplete
                  label="Cliente"
                  placeholder="Selecione"
                  selectedKey={selectedCliente?.id.toString()}
                  onSelectionChange={(k) =>
                    setSelectedCliente(
                      clientes.find((c) => c.id.toString() === k) || null
                    )
                  }
                >
                  {clientes.map((c) => (
                    <AutocompleteItem key={c.id}>{c.nome}</AutocompleteItem>
                  ))}
                </Autocomplete>

                <Autocomplete
                  label="Vendedor"
                  placeholder="Selecione"
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
              </div>

              <Divider />

              <div className="space-y-4">
                {/* SUBSTITUIR dentro do Modal Venda: bloco onde estava a grid md:grid-cols-5 (buscar / select produto / qtd / desconto / botão) */}
                <div className="space-y-4">
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
                        label="Qtd"
                        type="number"
                        className="w-28"
                        value={produtoQtd.toString()}
                        onChange={(e) =>
                          setProdutoQtd(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                      />
                      <Input
                        label="Desc. Item"
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
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
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(Number(p.preco_venda) || 0)}
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
                      {paginatedProdutos.length === 0 && (
                        <div className="col-span-full text-center py-8 text-xs text-default-500">
                          Nenhum produto encontrado.
                        </div>
                      )}
                    </div>

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

                  {/* Itens (mantido abaixo) */}
                  <div className="space-y-2">
                    {(formData.itens || []).length === 0 && (
                      <p className="text-xs text-default-500">
                        Nenhum item adicionado.
                      </p>
                    )}
                    {(formData.itens || []).map((it, idx) => (
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
                              {[
                                it.marca,
                                it.modelo,
                                "R$ " + it.preco_unitario.toFixed(2),
                              ]
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
                    ))}
                  </div>

                  <Divider />

                  {/* Totais */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Input
                      label="Desconto Total"
                      value={descontoInput}
                      onChange={(e) =>
                        handleDescontoTotalChange(e.target.value)
                      }
                      onBlur={handleDescontoTotalBlur}
                    />
                    <Input
                      label="Total Bruto"
                      isReadOnly
                      value={numberToCurrencyInput(formData.total_bruto || 0)}
                    />
                    <Input
                      label="Total Líquido"
                      isReadOnly
                      value={numberToCurrencyInput(formData.total_liquido || 0)}
                    />
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
                    />
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
                  />
                </div>
              </div>
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
                  !selectedCliente || (formData.itens || []).length === 0
                }
              >
                Salvar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Detalhes - sempre visível se pode ver vendas */}
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
                    <p className="text-default-500">Total</p>
                    <p>{fmt(Number(targetVenda.total_liquido))}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Restante</p>
                    <p>{fmt(Number(targetVenda.valor_restante))}</p>
                  </div>
                  {targetVenda.fiado && (
                    <div>
                      <p className="text-default-500">Vencimento</p>
                      <p>{fmtDate(targetVenda.data_vencimento || "")}</p>
                    </div>
                  )}
                </div>
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

      {/* Modal Pagamento - só abre se tiver permissão */}
      {canProcessarPagamentos && (
        <Modal isOpen={payModal.isOpen} onOpenChange={payModal.onOpenChange}>
          <ModalContent>
            <ModalHeader>Registrar Pagamento</ModalHeader>
            <ModalBody className="space-y-4">
              {targetVenda && (
                <>
                  <div className="text-xs space-y-1">
                    <p>
                      Total: <strong>{fmt(targetVenda.total_liquido)}</strong>
                    </p>
                    <p>
                      Pago: <strong>{fmt(targetVenda.valor_pago)}</strong>
                    </p>
                    <p>
                      Restante:{" "}
                      <strong>{fmt(targetVenda.valor_restante)}</strong>
                    </p>
                  </div>
                  <Input
                    label="Valor"
                    placeholder="R$ 0,00"
                    value={pagamentoValor}
                    color={
                      currencyToNumber(pagamentoValor) >
                      Number(targetVenda?.valor_restante || 0)
                        ? "danger"
                        : "default"
                    }
                    description={
                      currencyToNumber(pagamentoValor) >
                      Number(targetVenda?.valor_restante || 0)
                        ? "Não pode exceder o valor restante."
                        : ""
                    }
                    onChange={(e) => {
                      const masked = currencyMask(e.target.value);
                      const valNum = currencyToNumber(masked);
                      const restante = Number(targetVenda?.valor_restante) || 0;
                      if (valNum > restante) {
                        setPagamentoValor(numberToCurrencyInput(restante));
                      } else {
                        setPagamentoValor(masked);
                      }
                    }}
                  />
                  <Textarea
                    label="Observação"
                    minRows={2}
                    value={pagamentoObs}
                    onChange={(e) => setPagamentoObs(e.target.value)}
                  />
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={payModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={confirmarPagamento}
                isLoading={loading}
                isDisabled={
                  currencyToNumber(pagamentoValor) <= 0 ||
                  (targetVenda
                    ? currencyToNumber(pagamentoValor) >
                      Number(targetVenda.valor_restante || 0)
                    : true)
                }
              >
                Confirmar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Delete - só abre se tiver permissão */}
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
