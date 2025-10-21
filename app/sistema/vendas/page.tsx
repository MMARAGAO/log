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
import { VendasStats, VendasFilters } from "@/components/vendas";
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
  TagIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";

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
  | "devolvido";

const STATUS_OPTIONS = [
  { key: "pendente", label: "Pendente", color: "warning", icon: ClockIcon },
  { key: "pago", label: "Pago", color: "success", icon: CheckCircleIcon },
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
  // NOVAS PERMISSÕES DE DESCONTO
  const canAplicarDesconto = !!permVendas?.aplicar_desconto;
  const descontoMaximo = Number(permVendas?.desconto_maximo) || 0;

  // Dados
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [caixaAberto, setCaixaAberto] = useState<any>(null);

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

  // FUNÇÃO MODIFICADA: validarDesconto agora usa toast
  function validarDesconto(
    valor: number,
    totalBruto: number
  ): { valido: boolean } {
    if (!canAplicarDesconto) {
      toast.error("Você não possui permissão para aplicar descontos.");
      return { valido: false };
    }

    if (valor <= 0) {
      return { valido: true };
    }

    // Calcular porcentagem do desconto
    const porcentagem = (valor / totalBruto) * 100;

    if (porcentagem > descontoMaximo) {
      // MUDANÇA: Agora usa toast ao invés de retornar erro
      toast.error(
        `Desconto máximo permitido: ${descontoMaximo}% (R$ ${fmt((totalBruto * descontoMaximo) / 100)})`,
        {
          duration: 4000,
          icon: "🏷️",
          style: {
            background: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
          },
        }
      );
      return { valido: false };
    }

    return { valido: true };
  }

  // FUNÇÃO MODIFICADA: handleDescontoTotalChange com bloqueio de ultrapassagem
  function handleDescontoTotalChange(
    raw: string,
    tipo?: "valor" | "porcentagem"
  ) {
    const tipoAtual = tipo || tipoDesconto;
    const totalBruto = formData.total_bruto || 0;

    if (tipoAtual === "porcentagem") {
      // Para porcentagem, verificar limite máximo
      let num = Math.min(100, Math.max(0, Number(raw) || 0));

      // Aplicar limite de permissão
      if (canAplicarDesconto && descontoMaximo > 0) {
        num = Math.min(num, descontoMaximo);
      }

      setDescontoPercentual(num);
      const descontoEmValor = calcularDesconto("porcentagem", num, totalBruto);

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
      const num = currencyToNumber(masked);

      // NOVA VALIDAÇÃO: Calcular porcentagem do valor inserido
      const porcentagem = totalBruto > 0 ? (num / totalBruto) * 100 : 0;

      // Se ultrapassar o limite máximo, aplicar apenas o valor máximo permitido
      if (
        canAplicarDesconto &&
        descontoMaximo > 0 &&
        porcentagem > descontoMaximo
      ) {
        const valorMaximoPermitido = (totalBruto * descontoMaximo) / 100;

        // Mostrar toast informativo
        toast.error(
          `Desconto limitado a ${descontoMaximo}% (${fmt(valorMaximoPermitido)})`,
          {
            duration: 3000,
            icon: "🏷️",
            style: {
              background: "#fef3c7",
              color: "#d97706",
              border: "1px solid #fcd34d",
            },
          }
        );

        // Aplicar o valor máximo permitido
        setDescontoInput(numberToCurrencyInput(valorMaximoPermitido));
        setFormData((p) => ({ ...p, desconto: valorMaximoPermitido }));
        recalcTotals(
          formData.itens || [],
          valorMaximoPermitido,
          undefined,
          undefined,
          creditoAplicado
        );
        return;
      }

      // Se não exceder o limite, aplicar normalmente
      setDescontoInput(masked);
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
    setItensOriginaisVenda([]); // NOVO: Limpar itens originais
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

    // RESET PARA VERIFICAÇÃO DE CAIXA DA LOJA
    setCaixaLojaAberto(true);
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

    // NOVO: Bloquear edição de vendas com status "pago"
    if (v.status_pagamento === "pago") {
      toast.error(
        "🔒 Não é possível editar vendas com status 'Pago'. O pagamento já foi quitado.",
        {
          duration: 4000,
          icon: "⛔",
          style: {
            background: "#fee2e2",
            color: "#dc2626",
            border: "2px solid #fca5a5",
          },
        }
      );
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

    // NOVO: Bloquear exclusão de vendas com status "pago"
    if (v.status_pagamento === "pago") {
      toast.error(
        "🔒 Não é possível excluir vendas com status 'Pago'. O pagamento já foi quitado.",
        {
          duration: 4000,
          icon: "⛔",
          style: {
            background: "#fee2e2",
            color: "#dc2626",
            border: "2px solid #fca5a5",
          },
        }
      );
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
  const [itensOriginaisVenda, setItensOriginaisVenda] = useState<VendaItem[]>(
    []
  ); // NOVO: Para guardar os itens originais
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
  const [caixaLojaAberto, setCaixaLojaAberto] = useState(true); // Controla se o caixa da loja selecionada está aberto

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
      const [vendasData, clientesData, usuariosData, lojasData, caixaData] =
        await Promise.all([
          fetchTable("vendas"),
          fetchTable("clientes"),
          fetchTable("usuarios"),
          fetchTable("lojas"),
          fetchTable("caixa"),
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

      // Verificar se há caixa aberto
      const caixaAbertoAtual = caixaData?.find(
        (c: any) => c.status === "aberto"
      );
      setCaixaAberto(caixaAbertoAtual || null);

      console.log("[VENDAS] Dados carregados:", {
        vendas: vendasData?.length || 0,
        clientes: clientesData?.length || 0,
        usuarios: usuariosData?.length || 0,
        lojas: lojasData?.length || 0,
        caixaAberto: !!caixaAbertoAtual,
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
    // Verificar se há caixa aberto
    if (!caixaAberto) {
      toast.error(
        "⚠️ Não há caixa aberto! Abra o caixa antes de registrar vendas.",
        {
          duration: 5000,
          icon: "🔒",
          style: {
            background: "#fee2e2",
            color: "#dc2626",
            border: "2px solid #fca5a5",
          },
        }
      );
      return;
    }

    resetForm();
    vendaModal.onOpen();
  }

  function openEditVenda(v: Venda) {
    resetForm();
    setEditingVenda(v);

    // NOVO: Fazer uma cópia profunda dos itens originais para preservar as quantidades
    const itensOriginaisCopia = JSON.parse(JSON.stringify(v.itens || []));
    setItensOriginaisVenda(itensOriginaisCopia);

    console.log(
      "[VENDAS] 💾 Itens originais salvos na edição:",
      itensOriginaisCopia
    );

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
    const lojaVenda = lojas.find((l) => l.id === v.loja_id) || null;
    setSelectedLoja(lojaVenda);

    // Verificar se o caixa da loja desta venda está aberto
    if (lojaVenda && caixaAberto) {
      const caixaDestaLoja = caixaAberto.loja_id === lojaVenda.id;
      setCaixaLojaAberto(caixaDestaLoja);
    } else {
      setCaixaLojaAberto(false);
    }

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

    // NOVA VALIDAÇÃO: Para desconto individual por produto
    if (selectedProduto && canAplicarDesconto && descontoMaximo > 0) {
      const preco = Number(selectedProduto.preco_venda) || 0;
      const subtotalSemDesconto = produtoQtd * preco;
      const porcentagem =
        subtotalSemDesconto > 0 ? (num / subtotalSemDesconto) * 100 : 0;

      // Se tentar digitar um valor que excede o limite, bloquear
      if (porcentagem > descontoMaximo) {
        const valorMaximoPermitido =
          (subtotalSemDesconto * descontoMaximo) / 100;

        toast.error(
          `Desconto no produto limitado a ${descontoMaximo}% (${fmt(valorMaximoPermitido)})`,
          {
            duration: 3000,
            icon: "🏷️",
            style: {
              background: "#fef3c7",
              color: "#d97706",
              border: "1px solid #fcd34d",
            },
          }
        );

        setProdutoDesc(valorMaximoPermitido);
        return;
      }
    }

    setProdutoDesc(num);
  }

  function addProduto() {
    if (!selectedProduto) {
      toast.error("Selecione um produto.");
      return;
    }
    if (!selectedLoja) {
      toast.error("Selecione uma loja primeiro.");
      return;
    }

    // MODIFICADO: Validação com toast
    if (produtoDesc > 0) {
      const preco = Number(selectedProduto.preco_venda) || 0;
      const subtotalSemDesconto = produtoQtd * preco;
      const validacao = validarDesconto(produtoDesc, subtotalSemDesconto);

      if (!validacao.valido) {
        // Toast já foi exibido na função validarDesconto
        return;
      }
    }

    const disponivel = Number(selectedProduto.quantidade) || 0;

    // Se estamos editando uma venda, considerar a quantidade original do produto
    const quantidadeOriginal = editingVenda
      ? editingVenda.itens?.find(
          (i: VendaItem) => i.id_estoque === selectedProduto.id
        )?.quantidade || 0
      : 0;

    // Estoque disponível = estoque atual + quantidade que estava na venda original
    const estoqueDisponivel = disponivel + quantidadeOriginal;

    if (estoqueDisponivel === 0) {
      toast.error("Produto sem estoque nesta loja.", {
        icon: "📦",
      });
      return;
    }
    if (produtoQtd > estoqueDisponivel) {
      toast.error(`Estoque insuficiente. Disponível: ${estoqueDisponivel}`, {
        icon: "⚠️",
      });
      return;
    }

    const itens = [...(formData.itens || [])];
    const idx = itens.findIndex((i) => i.id_estoque === selectedProduto.id);
    const preco = Number(selectedProduto.preco_venda) || 0;

    if (idx >= 0) {
      const soma = itens[idx].quantidade + produtoQtd;
      if (soma > estoqueDisponivel) {
        toast.error(
          `Quantidade total excede estoque. Atual no carrinho: ${itens[idx].quantidade}, disponível: ${estoqueDisponivel}`,
          {
            duration: 4000,
            icon: "📊",
          }
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

    // Toast de sucesso
    toast.success(`${selectedProduto.descricao} adicionado ao carrinho!`, {
      icon: "🛒",
      duration: 2000,
    });
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

    // Se estamos editando uma venda existente, considerar a quantidade original do item
    const quantidadeOriginal = editingVenda
      ? editingVenda.itens?.find(
          (i: VendaItem) => i.id_estoque === item.id_estoque
        )?.quantidade || 0
      : 0;

    // Estoque disponível = estoque atual + quantidade que estava na venda original
    const estoqueDisponivel = disponivel + quantidadeOriginal;

    if (qty > estoqueDisponivel) {
      toast.error(
        `Quantidade solicitada (${qty}) excede o estoque disponível (${estoqueDisponivel}).`,
        {
          duration: 4000,
          icon: "📦",
        }
      );
      return;
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

    // NOVO: Atualizar status automaticamente baseado no pagamento
    let novoStatus: StatusPagamento = formData.status_pagamento || "pendente";
    if (restante === 0 && num > 0) {
      novoStatus = "pago";
      console.log(
        "[VENDAS] ✅ Valor total quitado! Status atualizado para 'pago'"
      );
    } else if (num > 0 && restante > 0) {
      novoStatus = "pendente";
      console.log(
        `[VENDAS] 💰 Pagamento parcial: R$ ${num} de R$ ${formData.total_liquido}. Status: pendente`
      );
    }

    setFormData((p) => ({
      ...p,
      valor_pago: num,
      valor_restante: restante,
      status_pagamento: novoStatus,
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

      // NOVO: Gerar log de alterações de quantidade (apenas para edições)
      let logAlteracoes = "";
      if (editingVenda && itensOriginaisVenda.length > 0) {
        const alteracoes: string[] = [];
        const dataHora = new Date().toLocaleString("pt-BR");

        // Verificar alterações de quantidade
        itensOriginaisVenda.forEach((itemOriginal) => {
          const itemNovo = itensLimpos.find(
            (i) => i.id_estoque === itemOriginal.id_estoque
          );

          if (itemNovo) {
            const qtdOriginal = itemOriginal.quantidade;
            const qtdNova = itemNovo.quantidade;

            if (qtdOriginal !== qtdNova) {
              const diff = qtdNova - qtdOriginal;
              const sinal = diff > 0 ? "+" : "";
              alteracoes.push(
                `${itemOriginal.descricao}: ${qtdOriginal} → ${qtdNova} (${sinal}${diff})`
              );
            }
          } else {
            // Item removido
            alteracoes.push(
              `${itemOriginal.descricao}: ${itemOriginal.quantidade} → 0 (removido)`
            );
          }
        });

        // Verificar itens adicionados
        itensLimpos.forEach((itemNovo) => {
          const itemOriginal = itensOriginaisVenda.find(
            (i) => i.id_estoque === itemNovo.id_estoque
          );
          if (!itemOriginal) {
            alteracoes.push(
              `${itemNovo.descricao}: 0 → ${itemNovo.quantidade} (adicionado)`
            );
          }
        });

        if (alteracoes.length > 0) {
          logAlteracoes = `\n\n📝 [${dataHora}] Alterações:\n${alteracoes.join("\n")}`;
          console.log("[VENDAS] 📝 Histórico de alterações gerado:", {
            quantidade: alteracoes.length,
            alteracoes: alteracoes,
            log: logAlteracoes,
          });
        }
      }

      // MODIFICADO: payload agora inclui informações de crédito e log de alterações
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
            logAlteracoes, // NOVO: adiciona log de alterações
          ]
            .filter(Boolean)
            .join("\n")
            .trim() || null,
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

      // Ajuste de estoque
      if (vendaId && selectedLoja) {
        if (editingVenda) {
          // EDIÇÃO: Ajustar apenas as diferenças no estoque
          console.log("[VENDAS] ═══════════════════════════════════════");
          console.log("[VENDAS] 🔄 INICIANDO AJUSTE DE ESTOQUE NA EDIÇÃO");
          console.log("[VENDAS] ═══════════════════════════════════════");
          console.log(
            `[VENDAS] 🏪 Loja original: ${editingVenda.loja_id}, Loja selecionada: ${selectedLoja.id}`
          );

          const lojaOriginal = editingVenda.loja_id;
          const itensOriginais = itensOriginaisVenda; // MODIFICADO: usar o estado separado
          const mesmaLoja = lojaOriginal === selectedLoja.id;

          console.log(
            `[VENDAS] 📦 Itens originais da venda (PRESERVADOS):`,
            itensOriginais
          );
          console.log(`[VENDAS] 📦 Itens novos (itensLimpos):`, itensLimpos);
          console.log(
            `[VENDAS] ${mesmaLoja ? "✅" : "🔄"} Mesma loja: ${mesmaLoja}`
          );

          // Criar mapa dos itens originais para comparação
          const mapaItensOriginais = new Map();
          itensOriginais.forEach((item) => {
            if (item.id_estoque) {
              mapaItensOriginais.set(item.id_estoque, item.quantidade);
              console.log(
                `[VENDAS] 📋 Item original mapeado: Produto ${item.id_estoque} = ${item.quantidade} unidades`
              );
            }
          });

          // Criar mapa dos novos itens
          const mapaItensNovos = new Map();
          itensLimpos.forEach((item) => {
            if (item.id_estoque) {
              mapaItensNovos.set(item.id_estoque, item.quantidade);
              console.log(
                `[VENDAS] 📋 Item novo mapeado: Produto ${item.id_estoque} = ${item.quantidade} unidades`
              );
            }
          });

          // Processar cada produto
          const produtosProcessados = new Set();

          console.log("[VENDAS] ───────────────────────────────────────");
          console.log("[VENDAS] 🔍 PROCESSANDO AJUSTES DE ESTOQUE...");
          console.log("[VENDAS] ───────────────────────────────────────");

          // 1. Primeiro, devolver itens da loja original que foram removidos ou tiveram quantidade reduzida
          for (const itemOriginal of itensOriginais) {
            if (!itemOriginal.id_estoque) continue;

            const qtdOriginal = itemOriginal.quantidade;
            const qtdNova = mapaItensNovos.get(itemOriginal.id_estoque) || 0;

            console.log(
              `[VENDAS] 🔎 Analisando Produto ${itemOriginal.id_estoque} (${itemOriginal.descricao}):`
            );
            console.log(`[VENDAS]    • Quantidade original: ${qtdOriginal}`);
            console.log(`[VENDAS]    • Quantidade nova: ${qtdNova}`);
            console.log(`[VENDAS]    • Diferença: ${qtdNova - qtdOriginal}`);

            produtosProcessados.add(itemOriginal.id_estoque);

            if (mesmaLoja) {
              // Mesma loja: calcular diferença direta
              const diferenca = qtdNova - qtdOriginal;

              if (diferenca === 0) {
                console.log(
                  `[VENDAS] ➡️ Sem alteração para produto ${itemOriginal.id_estoque}`
                );
                continue;
              }

              const { data: current, error: curErr } = await supabase
                .from("estoque_lojas")
                .select("quantidade")
                .eq("produto_id", itemOriginal.id_estoque)
                .eq("loja_id", lojaOriginal)
                .single();

              if (curErr) {
                console.error(
                  `[VENDAS] ❌ ERRO ao buscar estoque do produto ${itemOriginal.id_estoque}:`,
                  curErr
                );
                continue;
              }

              const estoqueAtual = Number(current?.quantidade) || 0;
              const novoEstoque = estoqueAtual - diferenca; // Se diferenca negativa, aumenta estoque

              console.log(
                `[VENDAS] ${diferenca > 0 ? "➖ DEDUZINDO" : "🔄 DEVOLVENDO"} do estoque (Loja ${lojaOriginal})`
              );
              console.log(`[VENDAS]    • Estoque atual: ${estoqueAtual}`);
              console.log(
                `[VENDAS]    • Operação: ${estoqueAtual} ${diferenca > 0 ? "-" : "+"} ${Math.abs(diferenca)}`
              );
              console.log(`[VENDAS]    • Novo estoque: ${novoEstoque}`);

              const { error: updErr } = await supabase
                .from("estoque_lojas")
                .update({
                  quantidade: novoEstoque,
                  updatedat: new Date().toISOString(),
                })
                .eq("produto_id", itemOriginal.id_estoque)
                .eq("loja_id", lojaOriginal);

              if (updErr) {
                console.error(`[VENDAS] ❌ ERRO ao atualizar estoque:`, updErr);
              } else {
                console.log(
                  `[VENDAS] ✅ SUCESSO! Estoque atualizado de ${estoqueAtual} para ${novoEstoque}`
                );
              }
            } else {
              // Lojas diferentes: devolver para loja original
              const { data: current, error: curErr } = await supabase
                .from("estoque_lojas")
                .select("quantidade")
                .eq("produto_id", itemOriginal.id_estoque)
                .eq("loja_id", lojaOriginal)
                .single();

              if (curErr) {
                console.warn(
                  `[VENDAS] ❌ Erro ao buscar estoque do produto ${itemOriginal.id_estoque}:`,
                  curErr
                );
                continue;
              }

              const estoqueAtual = Number(current?.quantidade) || 0;
              const estoqueDevolvido = estoqueAtual + qtdOriginal;

              console.log(
                `[VENDAS] 🔄 Devolvendo ao estoque (Loja ${lojaOriginal}) - Produto ${itemOriginal.id_estoque} (${itemOriginal.descricao}): ${estoqueAtual} + ${qtdOriginal} = ${estoqueDevolvido}`
              );

              const { error: updErr } = await supabase
                .from("estoque_lojas")
                .update({
                  quantidade: estoqueDevolvido,
                  updatedat: new Date().toISOString(),
                })
                .eq("produto_id", itemOriginal.id_estoque)
                .eq("loja_id", lojaOriginal);

              if (updErr) {
                console.warn(`[VENDAS] ❌ Erro ao devolver estoque:`, updErr);
              } else {
                console.log(`[VENDAS] ✅ Item devolvido com sucesso`);
              }

              // Se o produto também está nos novos itens, deduzir da loja nova
              if (qtdNova > 0) {
                const { data: currentNova, error: curErrNova } = await supabase
                  .from("estoque_lojas")
                  .select("quantidade")
                  .eq("produto_id", itemOriginal.id_estoque)
                  .eq("loja_id", selectedLoja.id)
                  .single();

                if (curErrNova) {
                  console.warn(
                    `[VENDAS] ❌ Erro ao buscar estoque na nova loja:`,
                    curErrNova
                  );
                  continue;
                }

                const estoqueAtualNova = Number(currentNova?.quantidade) || 0;
                const novoEstoqueNova = Math.max(0, estoqueAtualNova - qtdNova);

                console.log(
                  `[VENDAS] ➖ Deduzindo do estoque (Loja ${selectedLoja.id}) - Produto ${itemOriginal.id_estoque}: ${estoqueAtualNova} - ${qtdNova} = ${novoEstoqueNova}`
                );

                const { error: updErrNova } = await supabase
                  .from("estoque_lojas")
                  .update({
                    quantidade: novoEstoqueNova,
                    updatedat: new Date().toISOString(),
                  })
                  .eq("produto_id", itemOriginal.id_estoque)
                  .eq("loja_id", selectedLoja.id);

                if (updErrNova) {
                  console.warn(
                    `[VENDAS] ❌ Erro ao deduzir da nova loja:`,
                    updErrNova
                  );
                } else {
                  console.log(
                    `[VENDAS] ✅ Item deduzido com sucesso da nova loja`
                  );
                }
              }
            }
          }

          // 2. Produtos novos que não estavam na venda original (se mudou de loja ou adicionou novos)
          if (!mesmaLoja) {
            for (const novoItem of itensLimpos) {
              if (
                !novoItem.id_estoque ||
                produtosProcessados.has(novoItem.id_estoque)
              ) {
                continue; // Já foi processado acima
              }

              const { data: current, error: curErr } = await supabase
                .from("estoque_lojas")
                .select("quantidade")
                .eq("produto_id", novoItem.id_estoque)
                .eq("loja_id", selectedLoja.id)
                .single();

              if (curErr) {
                console.warn(
                  `[VENDAS] ❌ Erro ao buscar estoque do novo produto:`,
                  curErr
                );
                continue;
              }

              const estoqueAtual = Number(current?.quantidade) || 0;
              const novoEstoque = Math.max(
                0,
                estoqueAtual - novoItem.quantidade
              );

              console.log(
                `[VENDAS] ➖ Deduzindo produto novo (Loja ${selectedLoja.id}) - Produto ${novoItem.id_estoque} (${novoItem.descricao}): ${estoqueAtual} - ${novoItem.quantidade} = ${novoEstoque}`
              );

              const { error: updErr } = await supabase
                .from("estoque_lojas")
                .update({
                  quantidade: novoEstoque,
                  updatedat: new Date().toISOString(),
                })
                .eq("produto_id", novoItem.id_estoque)
                .eq("loja_id", selectedLoja.id);

              if (updErr) {
                console.warn(
                  `[VENDAS] ❌ Erro ao deduzir produto novo:`,
                  updErr
                );
              } else {
                console.log(`[VENDAS] ✅ Produto novo deduzido com sucesso`);
              }
            }
          }
        } else {
          // NOVA VENDA: Apenas deduzir do estoque
          console.log("[VENDAS] Deduzindo estoque para nova venda...");

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

              console.log(
                `[VENDAS] Nova venda - Produto ${it.id_estoque}: ${atual} - ${it.quantidade} = ${nova}`
              );

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

        console.log("[VENDAS] ═══════════════════════════════════════");
        console.log("[VENDAS] ✅ AJUSTE DE ESTOQUE CONCLUÍDO");
        console.log("[VENDAS] ═══════════════════════════════════════");
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
      if (editingVenda) {
        toast.success(
          `Venda #${editingVenda.id} editada com sucesso! ${credito_usado > 0 ? `Crédito de ${fmt(credito_usado)} aplicado.` : ""}`,
          {
            duration: 3000,
            icon: "✅",
          }
        );
      } else if (credito_usado > 0) {
        toast.success(
          `Venda criada com sucesso! Crédito de ${fmt(credito_usado)} foi aplicado.`,
          {
            duration: 3000,
            icon: "✅",
          }
        );
      } else {
        toast.success("Venda salva com sucesso!", {
          duration: 2000,
          icon: "✅",
        });
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

    // NOVO: Determinar status baseado no pagamento
    let novoStatus: StatusPagamento = targetVenda.status_pagamento;
    if (restante === 0) {
      novoStatus = "pago";
      console.log(
        "[VENDAS] ✅ Pagamento quitado! Status atualizado para 'pago'"
      );
    } else if (novoPago > 0 && restante > 0) {
      novoStatus = "pendente";
      console.log(
        `[VENDAS] 💰 Pagamento parcial registrado. Restante: ${fmt(restante)}`
      );
    }

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
      // MODIFICADO: Agora inclui status_pagamento na atualização
      const updateData: any = {
        valor_pago: novoPago,
        valor_restante: restante,
        status_pagamento: novoStatus,
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

      // NOVO: Toast de feedback
      if (restante === 0) {
        toast.success(`✅ Venda #${targetVenda.id} quitada com sucesso!`, {
          duration: 3000,
          icon: "💰",
        });
      } else {
        toast.success(
          `Pagamento de ${fmt(valor)} registrado. Restante: ${fmt(restante)}`,
          {
            duration: 2500,
            icon: "💵",
          }
        );
      }
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

    // NOVO: Verificação adicional de segurança contra vendas pagas
    if (targetVenda.status_pagamento === "pago") {
      toast.error(
        "🔒 BLOQUEADO: Não é possível excluir vendas com status 'Pago'.",
        {
          duration: 4000,
          icon: "⛔",
          style: {
            background: "#fee2e2",
            color: "#dc2626",
            border: "2px solid #fca5a5",
          },
        }
      );
      deleteModal.onClose();
      return;
    }

    setLoading(true);
    try {
      await deleteTable("vendas", targetVenda.id);
      await loadAll();
      deleteModal.onClose();
      toast.success("Venda excluída com sucesso!", {
        duration: 2000,
        icon: "🗑️",
      });
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
    <div className="container mx-auto p-6 flex flex-col gap-6">
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
              color={caixaAberto ? "primary" : "danger"}
              startContent={
                caixaAberto ? (
                  <PlusIcon className="w-4 h-4" />
                ) : (
                  <LockClosedIcon className="w-4 h-4" />
                )
              }
              onPress={safeOpenNewVenda}
              variant={caixaAberto ? "solid" : "flat"}
            >
              {caixaAberto ? "Nova Venda" : "Caixa Fechado"}
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <VendasStats stats={stats} formatCurrency={fmt} />

      {/* Barra de busca e filtros */}
      <VendasFilters
        searchTerm={filters.search}
        onSearchChange={(value) => setFilters((p) => ({ ...p, search: value }))}
        orderBy={filters.orderBy}
        onOrderByChange={(value) =>
          setFilters((p) => ({ ...p, orderBy: value }))
        }
        direction={filters.direction}
        onDirectionToggle={() =>
          setFilters((p) => ({
            ...p,
            direction: p.direction === "asc" ? "desc" : "asc",
          }))
        }
        onClearFilters={() =>
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
        showFiltersPanel={showFilters}
        onToggleFiltersPanel={() => setShowFilters(!showFilters)}
        onAddClick={safeOpenNewVenda}
        canCreate={canCreateVendas && caixaAberto}
        hasActiveFilters={
          filters.search !== "" ||
          filters.status !== "" ||
          filters.pagamento !== "" ||
          filters.vencidas ||
          filters.cliente !== "" ||
          filters.loja !== "" ||
          filters.inicio !== "" ||
          filters.fim !== "" ||
          filters.valorMin !== "" ||
          filters.valorMax !== ""
        }
      />

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
                            <Tooltip
                              content={
                                v.status_pagamento === "pago"
                                  ? "Não é possível editar vendas pagas"
                                  : "Editar"
                              }
                              color={
                                v.status_pagamento === "pago"
                                  ? "danger"
                                  : "default"
                              }
                            >
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => safeOpenEditVenda(v)}
                                isDisabled={v.status_pagamento === "pago"}
                                className={
                                  v.status_pagamento === "pago"
                                    ? "opacity-40 cursor-not-allowed"
                                    : ""
                                }
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
                            <Tooltip
                              content={
                                v.status_pagamento === "pago"
                                  ? "Não é possível excluir vendas pagas"
                                  : "Excluir"
                              }
                              color="danger"
                            >
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => safeOpenDelete(v)}
                                isDisabled={v.status_pagamento === "pago"}
                                className={
                                  v.status_pagamento === "pago"
                                    ? "opacity-40 cursor-not-allowed"
                                    : ""
                                }
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
                </div>
              )}

              <Divider />

              {/* Seleção de Cliente, Vendedor e Loja */}
              <div className="grid md:grid-cols-3 gap-4">
                <Autocomplete
                  label="Cliente"
                  placeholder={
                    caixaAberto ? "Selecione o cliente" : "Caixa fechado"
                  }
                  selectedKey={selectedCliente?.id.toString()}
                  onSelectionChange={(k) =>
                    setSelectedCliente(
                      clientes.find((c) => c.id.toString() === k) || null
                    )
                  }
                  isRequired
                  isDisabled={!caixaAberto}
                  startContent={
                    !caixaAberto ? (
                      <LockClosedIcon className="w-4 h-4 text-danger" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )
                  }
                >
                  {clientes.map((c) => (
                    <AutocompleteItem key={c.id}>{c.nome}</AutocompleteItem>
                  ))}
                </Autocomplete>

                <Autocomplete
                  label="Vendedor"
                  placeholder={
                    caixaAberto ? "Selecione o vendedor" : "Caixa fechado"
                  }
                  selectedKey={selectedUsuario?.uuid}
                  onSelectionChange={(k) =>
                    setSelectedUsuario(
                      usuarios.find((u) => u.uuid === k) || null
                    )
                  }
                  isDisabled={!caixaAberto}
                  startContent={
                    !caixaAberto ? (
                      <LockClosedIcon className="w-4 h-4 text-danger" />
                    ) : undefined
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
                  placeholder={
                    caixaAberto
                      ? "Selecione a loja"
                      : "Caixa fechado - Abra o caixa primeiro"
                  }
                  selectedKey={selectedLoja?.id.toString()}
                  onSelectionChange={(k) => {
                    const loja =
                      lojas.find((l) => l.id.toString() === k) || null;
                    setSelectedLoja(loja);

                    // Verificar se o caixa dessa loja está aberto
                    if (loja && caixaAberto) {
                      const caixaDestaLoja = caixaAberto.loja_id === loja.id;
                      setCaixaLojaAberto(caixaDestaLoja);

                      if (!caixaDestaLoja) {
                        toast.error(
                          `⚠️ O caixa da loja "${loja.nome}" não está aberto!`,
                          {
                            duration: 5000,
                            icon: "🔒",
                            style: {
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "2px solid #fca5a5",
                            },
                          }
                        );
                      }
                    } else {
                      setCaixaLojaAberto(false);
                    }
                  }}
                  isRequired
                  isDisabled={!caixaAberto}
                  startContent={
                    caixaAberto ? (
                      <BuildingStorefrontIcon className="w-4 h-4" />
                    ) : (
                      <LockClosedIcon className="w-4 h-4 text-danger" />
                    )
                  }
                  description={
                    !caixaAberto
                      ? "🔒 Abra o caixa para selecionar a loja e registrar vendas"
                      : undefined
                  }
                  color={!caixaAberto ? "danger" : "default"}
                >
                  {lojas.map((l) => (
                    <AutocompleteItem key={l.id}>{l.nome}</AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>

              {/* Aviso sobre caixa fechado */}
              {!caixaAberto && (
                <Card className="border-danger-300 bg-danger-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-danger-200 rounded-full">
                        <LockClosedIcon className="w-5 h-5 text-danger-700 shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-danger-800 text-sm font-semibold mb-1">
                          🔒 Caixa Fechado
                        </p>
                        <p className="text-danger-700 text-xs">
                          Não é possível registrar vendas com o caixa fechado.
                          Acesse a tela de Caixa e abra o caixa antes de
                          continuar.
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Aviso sobre caixa da loja selecionada fechado */}
              {caixaAberto && selectedLoja && !caixaLojaAberto && (
                <Card className="border-danger-300 bg-danger-50">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-danger-200 rounded-full">
                        <LockClosedIcon className="w-5 h-5 text-danger-700 shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-danger-800 text-sm font-semibold mb-1">
                          🔒 Caixa da Loja "{selectedLoja.nome}" Não Está Aberto
                        </p>
                        <p className="text-danger-700 text-xs">
                          O caixa aberto é de outra loja. Para registrar vendas
                          nesta loja, feche o caixa atual e abra o caixa da loja
                          "{selectedLoja.nome}".
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Aviso sobre seleção de loja */}
              {caixaAberto && !selectedLoja && (
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
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        startContent={
                          !caixaAberto || !caixaLojaAberto ? (
                            <LockClosedIcon className="w-4 h-4 text-danger" />
                          ) : (
                            <MagnifyingGlassIcon className="w-4 h-4" />
                          )
                        }
                        placeholder={
                          !caixaAberto
                            ? "Caixa fechado"
                            : !caixaLojaAberto
                              ? "Caixa desta loja não está aberto"
                              : "Descrição, marca ou modelo"
                        }
                        isDisabled={!caixaAberto || !caixaLojaAberto}
                      />

                      <Button
                        color="primary"
                        onPress={addProduto}
                        isDisabled={
                          !caixaAberto ||
                          !caixaLojaAberto ||
                          !selectedProduto ||
                          (Number(selectedProduto?.quantidade) || 0) === 0 ||
                          produtoQtd >
                            (Number(selectedProduto?.quantidade) || 0)
                        }
                        startContent={
                          !caixaAberto || !caixaLojaAberto ? (
                            <LockClosedIcon className="w-4 h-4" />
                          ) : (
                            <PlusIcon className="w-4 h-4" />
                          )
                        }
                        className="lg:w-44"
                      >
                        Adicionar
                      </Button>
                    </div>
                    {canAplicarDesconto && descontoMaximo > 0 && (
                      <Card className="border-warning-200 bg-warning-50">
                        <CardBody className="p-3">
                          <div className="flex items-center gap-2 text-warning-700">
                            <TagIcon className="w-4 h-4" />
                            <span className="text-sm">
                              Seu limite de desconto:{" "}
                              <strong>{descontoMaximo}%</strong> por item/venda
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                    {!canAplicarDesconto && (
                      <Card className="border-danger-200 bg-danger-50">
                        <CardBody className="p-3">
                          <div className="flex items-center gap-2 text-danger-700">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span className="text-sm">
                              Você não possui permissão para aplicar descontos
                              nesta venda.
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    )}

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
                          isDisabled={!canAplicarDesconto} // NOVA VALIDAÇÃO
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
                          isDisabled={!canAplicarDesconto} // NOVA VALIDAÇÃO
                        >
                          Porcentagem (%)
                        </Button>
                      </div>

                      {/* NOVO: Indicador de permissão */}
                      {canAplicarDesconto && descontoMaximo > 0 && (
                        <Chip size="sm" color="warning" variant="flat">
                          Limite: {descontoMaximo}%
                        </Chip>
                      )}
                    </div>

                    {/* Campos de Desconto e Totais */}
                    {/* Campos de Desconto e Totais - SEÇÃO MODIFICADA */}
                    <div className="grid md:grid-cols-5 gap-4">
                      {/* Campo de Desconto */}
                      {tipoDesconto === "valor" ? (
                        <Input
                          label="Desconto"
                          value={descontoInput}
                          onChange={(e) => {
                            // NOVA VALIDAÇÃO: Pré-validar antes de enviar para handleDescontoTotalChange
                            const valor = currencyToNumber(
                              currencyMask(e.target.value)
                            );
                            const totalBruto = formData.total_bruto || 0;

                            if (
                              canAplicarDesconto &&
                              descontoMaximo > 0 &&
                              totalBruto > 0
                            ) {
                              const porcentagem = (valor / totalBruto) * 100;
                              const valorMaximo =
                                (totalBruto * descontoMaximo) / 100;

                              // Se tentar digitar um valor que excede o limite, bloquear
                              if (porcentagem > descontoMaximo) {
                                // Não permitir que o usuário digite além do limite
                                return;
                              }
                            }

                            handleDescontoTotalChange(e.target.value, "valor");
                          }}
                          onBlur={handleDescontoTotalBlur}
                          placeholder="R$ 0,00"
                          startContent={
                            <CurrencyDollarIcon className="w-4 h-4" />
                          }
                          description={
                            !canAplicarDesconto
                              ? "Sem permissão para desconto"
                              : canAplicarDesconto && descontoMaximo > 0
                                ? `Máximo: ${fmt(((formData.total_bruto || 0) * descontoMaximo) / 100)} (${descontoMaximo}%)`
                                : `Valor atual: ${fmt(formData.desconto || 0)}`
                          }
                          isDisabled={!canAplicarDesconto}
                          color={!canAplicarDesconto ? "default" : undefined}
                          // NOVA VALIDAÇÃO: Adicionar indicador visual quando próximo do limite
                          variant={
                            canAplicarDesconto &&
                            descontoMaximo > 0 &&
                            formData.total_bruto &&
                            formData.desconto &&
                            (formData.desconto / formData.total_bruto) * 100 >
                              descontoMaximo * 0.8
                              ? "bordered"
                              : "flat"
                          }
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
                          max={
                            canAplicarDesconto
                              ? Math.min(100, descontoMaximo || 100)
                              : 0
                          } // NOVA VALIDAÇÃO
                          endContent={
                            <span className="text-default-400">%</span>
                          }
                          description={
                            !canAplicarDesconto
                              ? "Sem permissão para desconto"
                              : canAplicarDesconto && descontoMaximo > 0
                                ? `Máximo: ${descontoMaximo}% | Valor: ${fmt(formData.desconto || 0)}`
                                : `Valor: ${fmt(formData.desconto || 0)}`
                          }
                          isDisabled={!canAplicarDesconto} // NOVA VALIDAÇÃO
                          color={!canAplicarDesconto ? "default" : undefined}
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
                    {canAplicarDesconto &&
                      (formData.desconto || 0) > 0 &&
                      descontoMaximo > 0 && (
                        <Card className="border-success-200 bg-success-50">
                          <CardBody className="p-3">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-success-600" />
                                <span className="text-success-700">
                                  Desconto aplicado:{" "}
                                  {(
                                    ((formData.desconto || 0) /
                                      (formData.total_bruto || 1)) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>
                              </div>
                              <span className="text-success-600">
                                Limite restante:{" "}
                                {Math.max(
                                  0,
                                  descontoMaximo -
                                    ((formData.desconto || 0) /
                                      (formData.total_bruto || 1)) *
                                      100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </CardBody>
                        </Card>
                      )}

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
                  !caixaAberto ||
                  !caixaLojaAberto ||
                  !selectedCliente ||
                  !selectedLoja ||
                  (formData.itens || []).length === 0
                }
                startContent={
                  !caixaAberto || !caixaLojaAberto ? (
                    <LockClosedIcon className="w-4 h-4" />
                  ) : undefined
                }
              >
                {!caixaAberto || !caixaLojaAberto
                  ? "Caixa Não Disponível"
                  : editingVenda
                    ? "Atualizar"
                    : "Salvar Venda"}
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
                    <div className="space-y-2">
                      <p className="text-xs font-semibold flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4" />
                        Observações e Histórico
                      </p>
                      <Card className="bg-default-50">
                        <CardBody className="p-3 text-xs space-y-2">
                          {targetVenda.observacoes
                            .split("\n\n")
                            .map((section, idx) => {
                              // Se a seção começa com 📝, é um log de alterações
                              const isLog = section.startsWith("📝");

                              return (
                                <div
                                  key={idx}
                                  className={
                                    isLog
                                      ? "border-l-3 border-primary pl-3 bg-primary-50/50 py-2 rounded"
                                      : ""
                                  }
                                >
                                  <div className="whitespace-pre-line">
                                    {section
                                      .split("\n")
                                      .map((line, lineIdx) => {
                                        // Destacar linhas de alteração
                                        const isAumento = line.includes("(+");
                                        const isDiminuicao =
                                          line.includes("(-");
                                        const isRemocao =
                                          line.includes("(removido)");
                                        const isAdicao =
                                          line.includes("(adicionado)");

                                        let lineClass = "";
                                        let icon = null;

                                        if (isAumento) {
                                          lineClass =
                                            "text-success-700 font-medium";
                                          icon = "📈";
                                        } else if (isDiminuicao) {
                                          lineClass =
                                            "text-warning-700 font-medium";
                                          icon = "📉";
                                        } else if (isRemocao) {
                                          lineClass =
                                            "text-danger-700 font-medium";
                                          icon = "🗑️";
                                        } else if (isAdicao) {
                                          lineClass =
                                            "text-primary-700 font-medium";
                                          icon = "➕";
                                        }

                                        return (
                                          <div
                                            key={lineIdx}
                                            className={lineClass}
                                          >
                                            {icon && (
                                              <span className="mr-1">
                                                {icon}
                                              </span>
                                            )}
                                            {line}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              );
                            })}
                        </CardBody>
                      </Card>
                    </div>
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
                                  Math.round(
                                    (Number(targetVenda.valor_restante) || 0) *
                                      0.25 *
                                      100
                                  ) / 100;
                                setPagamentoValor(
                                  numberToCurrencyInput(restante)
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
                                  Math.round(
                                    (Number(targetVenda.valor_restante) || 0) *
                                      0.5 *
                                      100
                                  ) / 100;
                                setPagamentoValor(
                                  numberToCurrencyInput(restante)
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
                                    ? `Restará: ${fmt(Number(targetVenda.valor_restante) - currencyToNumber(pagamentoValor))}`
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

      {/* Toaster no final */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
