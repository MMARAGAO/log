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
  PaperClipIcon,
  CloudArrowUpIcon,
  PhotoIcon,
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
  compativel?: string | null;
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
  pagamento_detalhes?: Record<string, number> | null; // NOVO: Detalhamento de pagamentos (único ou múltiplo)
  status_pagamento: StatusPagamento;
  data_pagamento?: string | null; // NOVO: Data/hora em que foi marcado como pago
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
  comprovantes?: string[] | null; // URLs dos comprovantes de pagamento
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
  { key: "id", label: "ID" },
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
  filtrarPorDataPagamento: boolean; // true = filtra por data_pagamento (modo Caixa), false = filtra por data_venda (padrão)
}

const PAGE_SIZE = 15;

// Helper para normalizar forma de pagamento para chave consistente
function normalizePaymentKey(forma: string): string {
  const formaLower = forma.toLowerCase().trim();

  if (formaLower === "dinheiro") return "dinheiro";
  if (formaLower === "pix") return "pix";
  if (
    formaLower.includes("crédito") ||
    formaLower.includes("credito") ||
    formaLower === "cartão de crédito"
  )
    return "credito";
  if (
    formaLower.includes("débito") ||
    formaLower.includes("debito") ||
    formaLower === "cartão de débito"
  )
    return "debito";
  if (formaLower === "carteira_digital" || formaLower === "carteira digital")
    return "carteira_digital";
  if (formaLower === "transferência" || formaLower === "transferencia")
    return "transferencia";
  if (formaLower === "boleto") return "boleto";
  if (formaLower === "crediário" || formaLower === "crediario")
    return "crediario";
  if (formaLower === "fiado") return "fiado";

  return formaLower;
}

// Helper para obter timestamp no horário do Brasil (UTC-3)
function getISOStringInBrazil(): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const date: Record<string, string> = {};
  parts.forEach((part) => {
    date[part.type] = part.value;
  });

  // Retorna timestamp ISO com timezone do Brasil (-03:00)
  return `${date.year}-${date.month}-${date.day}T${date.hour}:${date.minute}:${date.second}-03:00`;
}

export default function VendasPage() {
  // Auth
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permVendas = acessos?.vendas;
  const canViewVendas = !!permVendas?.ver_vendas;
  const canCreateVendas = !!permVendas?.criar_vendas;
  const canEditVendas = !!permVendas?.editar_vendas;
  const canEditVendasPagas = !!permVendas?.editar_vendas_pagas; // NOVO: Permite editar vendas pagas
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
  const [devolucoes, setDevolucoes] = useState<any[]>([]); // Para identificar itens devolvidos

  // Filtrar lojas com base nas permissões do usuário
  const lojasDisponiveis = useMemo(() => {
    const lojaIdUsuario = user?.permissoes?.loja_id;

    // Se loja_id é null, usuário tem acesso a todas as lojas
    if (lojaIdUsuario === null || lojaIdUsuario === undefined) {
      return lojas;
    }

    // Caso contrário, filtra apenas a loja do usuário
    return lojas.filter((loja) => loja.id === lojaIdUsuario);
  }, [lojas, user?.permissoes?.loja_id]);

  // NOVOS ESTADOS PARA CRÉDITO
  const [clienteCredito, setClienteCredito] = useState(0);
  const [creditoAplicado, setCreditoAplicado] = useState(0);
  const [creditoInput, setCreditoInput] = useState(numberToCurrencyInput(0));
  const [usarCredito, setUsarCredito] = useState(false);

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

    // NOVO: Verificar se a venda está paga e se o usuário tem permissão para editar vendas pagas
    const status = computeStatus(v);
    if (status === "pago" && !canEditVendasPagas) {
      alert(
        "Você não possui permissão para editar vendas já pagas. Solicite essa permissão ao administrador."
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
    filtrarPorDataPagamento: false, // Padrão: filtrar por data_venda
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

  // Modal gerenciar comprovantes
  const comprovantesModal = useDisclosure();

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
  const [produtoPreco, setProdutoPreco] = useState(0); // NOVO: Preço editável
  const [produtoPrecoInput, setProdutoPrecoInput] = useState(
    numberToCurrencyInput(0)
  ); // NOVO: Input formatado
  const [descontoInput, setDescontoInput] = useState(numberToCurrencyInput(0));
  const [valorPagoInput, setValorPagoInput] = useState(
    numberToCurrencyInput(0)
  );
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PAGE_SIZE = 12;

  // Pagamento incremental
  const [pagamentoObs, setPagamentoObs] = useState("");
  const [comprovanteFiles, setComprovanteFiles] = useState<File[]>([]);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  // Novas linhas de pagamento (suporta múltiplas formas)
  const [pagamentoRows, setPagamentoRows] = useState<
    { forma: string; valorInput: string }[]
  >([]);
  const totalPagamento = useMemo(
    () => pagamentoRows.reduce((s, r) => s + currencyToNumber(r.valorInput), 0),
    [pagamentoRows]
  );

  // Gerenciamento de comprovantes
  const [novosComprovantesFiles, setNovosComprovantesFiles] = useState<File[]>(
    []
  );
  const [comprovantesParaDeletar, setComprovantesParaDeletar] = useState<
    string[]
  >([]);

  // Venda em foco (view / pagar / delete)
  const [targetVenda, setTargetVenda] = useState<Venda | null>(null);

  // Carregar dados iniciais
  async function loadAll() {
    setLoading(true);
    try {
      const [
        vendasData,
        clientesData,
        usuariosData,
        lojasData,
        caixaData,
        devolucoesData,
      ] = await Promise.all([
        fetchTable("vendas"),
        fetchTable("clientes"),
        fetchTable("usuarios"),
        fetchTable("lojas"),
        fetchTable("caixa"),
        fetchTable("devolucoes"),
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
      setDevolucoes(devolucoesData || []);

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
      // Buscar todos os produtos sem limite (paginação automática)
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("estoque")
          .select(
            `
            id,
            descricao,
            modelo,
            marca,
            compativel,
            preco_venda,
            fotourl,
            estoque_lojas!inner(
              quantidade,
              loja_id
            )
          `
          )
          .eq("estoque_lojas.loja_id", lojaId)
          .gt("estoque_lojas.quantidade", 0)
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("[VENDAS] Erro na query de estoque:", error);
          throw error;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
          console.log(
            `[VENDAS] Carregados ${allData.length} produtos até agora...`
          );
        } else {
          hasMore = false;
        }
      }

      console.log(
        `[VENDAS] ✅ Total de produtos carregados: ${allData.length}`
      );

      const estoqueComQuantidade = allData.map((item: any) => {
        const quantidade = item.estoque_lojas?.[0]?.quantidade || 0;
        return {
          id: item.id,
          descricao: item.descricao,
          modelo: item.modelo,
          marca: item.marca,
          compativel: item.compativel,
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

  // NOVO USEEFFECT: Atualizar preço quando produto for selecionado
  useEffect(() => {
    if (selectedProduto) {
      const precoBase = Number(selectedProduto.preco_venda) || 0;
      setProdutoPreco(precoBase);
      setProdutoPrecoInput(numberToCurrencyInput(precoBase));
    } else {
      setProdutoPreco(0);
      setProdutoPrecoInput(numberToCurrencyInput(0));
    }
  }, [selectedProduto]);

  // Helpers
  function fmt(v: number | undefined | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v || 0);
  }

  function fmtDate(d?: string | null) {
    if (!d) return "-";
    // Se vier só a data (YYYY-MM-DD), adiciona horário e timezone Brasil
    const isOnlyDate = /^\d{4}-\d{2}-\d{2}$/.test(d);
    const dateStr = isOnlyDate ? `${d}T12:00:00-03:00` : d;
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  function fmtHora(d?: string | null) {
    if (!d) return "-";
    const ts = d.includes("+") || d.includes("Z") ? d : d + "Z";
    return new Date(ts).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  function getNomeUsuario(usuarioId?: string | null) {
    if (!usuarioId) return "-";
    const usuario = usuarios.find((u) => u.uuid === usuarioId);
    return usuario?.nome || usuario?.email || "-";
  }

  // Filtros / ordenação
  const filtered = useMemo(() => {
    const resultado = vendas
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

        // Filtro de data: por data_venda (padrão) ou data_pagamento (modo Caixa)
        if (filters.filtrarPorDataPagamento) {
          // Modo Caixa: apenas vendas com data_pagamento (já pagas/recebidas)
          if (!v.data_pagamento) return false; // Excluir vendas não pagas

          // Se houver filtro de data, aplicar ao data_pagamento
          if (filters.inicio || filters.fim) {
            const dataPagamento = v.data_pagamento.slice(0, 10); // YYYY-MM-DD
            if (filters.inicio && dataPagamento < filters.inicio) return false;
            if (filters.fim && dataPagamento > filters.fim) return false;
          }
        } else {
          // Modo padrão: filtrar por data_venda
          if (filters.inicio && v.data_venda < filters.inicio) return false;
          if (filters.fim && v.data_venda > filters.fim + "T23:59:59")
            return false;
        }

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
        const campo = filters.orderBy;
        let av: any = a[campo as keyof Venda];
        let bv: any = b[campo as keyof Venda];

        // Tratamento especial para ID e números
        if (
          campo === "id" ||
          campo === "total_liquido" ||
          campo === "valor_restante"
        ) {
          av = Number(av) || 0;
          bv = Number(bv) || 0;
        }
        // Tratamento especial para datas
        else if (campo === "data_venda" || campo === "data_vencimento") {
          av = av ? new Date(av).getTime() : 0;
          bv = bv ? new Date(bv).getTime() : 0;
        }
        // Tratamento para strings
        else {
          av = (av || "").toString().toLowerCase();
          bv = (bv || "").toString().toLowerCase();
        }

        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });

    return resultado;
  }, [vendas, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Estatísticas
  // Estatísticas baseadas no conjunto filtrado (aplica período/filtros da UI)
  const stats = useMemo(() => {
    const count = filtered.length;

    // Vendas pagas (status = pago)
    const vendasPagas = filtered.filter((v) => computeStatus(v) === "pago");
    const faturamento = vendasPagas.reduce(
      (acc, v) => acc + (Number(v.total_liquido) || 0),
      0
    );

    // Vendas devolvidas (status = devolvido)
    const vendasDevolvidas = filtered.filter(
      (v) => computeStatus(v) === "devolvido"
    );
    const totalDevolvido = vendasDevolvidas.reduce(
      (acc, v) => acc + (Number(v.total_liquido) || 0),
      0
    );

    const pagas = vendasPagas.length;
    const devolvidas = vendasDevolvidas.length;
    const vencidas = filtered.filter(
      (v) => computeStatus(v) === "vencido"
    ).length;
    const receber = filtered
      .filter((v) => v.valor_restante > 0)
      .reduce((acc, v) => acc + Number(v.valor_restante), 0);

    // Ticket médio: baseado apenas em vendas pagas (não inclui devolvidas)
    const ticket = pagas > 0 ? faturamento / pagas : 0;

    return {
      count,
      faturamento,
      pagas,
      devolvidas,
      totalDevolvido,
      vencidas,
      receber,
      ticket,
    };
  }, [filtered, filters.filtrarPorDataPagamento]);

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

    // CORREÇÃO: Se houver uma loja selecionada após o reset, carregar o estoque
    // Isso garante que o estoque seja carregado mesmo que a mesma loja seja selecionada novamente
    if (selectedLoja?.id) {
      loadEstoquePorLoja(selectedLoja.id);
    }

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

    // CORREÇÃO: Carregar estoque explicitamente ao abrir modal de edição
    if (lojaVenda?.id) {
      loadEstoquePorLoja(lojaVenda.id);
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
      const preco = produtoPreco || Number(selectedProduto.preco_venda) || 0; // USA O PREÇO EDITÁVEL
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
    const preco = produtoPreco || Number(selectedProduto.preco_venda) || 0; // USA O PREÇO EDITÁVEL

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
      itens[idx].preco_unitario = preco; // ATUALIZA O PREÇO TAMBÉM
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
    setProdutoPreco(0); // RESETA O PREÇO EDITÁVEL
    setProdutoPrecoInput(numberToCurrencyInput(0)); // RESETA O INPUT

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

  // NOVA FUNÇÃO: Atualizar preço unitário de um item do carrinho
  function updateItemPrice(index: number, newPrice: number) {
    const itens = [...(formData.itens || [])];
    const item = itens[index];
    item.preco_unitario = newPrice;
    item.subtotal =
      item.quantidade * item.preco_unitario - (item.desconto || 0);
    recalcTotals(itens, undefined, undefined, undefined, creditoAplicado);
  }

  // NOVA FUNÇÃO: Atualizar desconto de um item do carrinho
  function updateItemDesconto(index: number, newDesconto: number) {
    const itens = [...(formData.itens || [])];
    const item = itens[index];

    // Validar desconto se necessário
    if (newDesconto > 0 && canAplicarDesconto) {
      const subtotalSemDesconto = item.quantidade * item.preco_unitario;
      const validacao = validarDesconto(newDesconto, subtotalSemDesconto);

      if (!validacao.valido) {
        return; // Toast já exibido em validarDesconto
      }
    }

    item.desconto = newDesconto;
    item.subtotal = item.quantidade * item.preco_unitario - item.desconto;
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
    let dataPagamento: string | null = formData.data_pagamento || null;

    if (restante === 0 && num > 0) {
      novoStatus = "pago";
      dataPagamento = new Date().toISOString(); // Registra data/hora do pagamento
      console.log(
        "[VENDAS] ✅ Valor total quitado! Status atualizado para 'pago'"
      );
    } else if (num > 0 && restante > 0) {
      novoStatus = "pendente";
      dataPagamento = null; // Limpa data de pagamento se ainda está pendente
      console.log(
        `[VENDAS] 💰 Pagamento parcial: R$ ${num} de R$ ${formData.total_liquido}. Status: pendente`
      );
    }

    setFormData((p) => ({
      ...p,
      valor_pago: num,
      valor_restante: restante,
      status_pagamento: novoStatus,
      data_pagamento: dataPagamento,
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
      if (editingVenda) {
        const alteracoes: string[] = [];
        const dataHora = new Date().toLocaleString("pt-BR");
        const nomeUsuario = user?.nome || user?.email || "Usuário";

        // Verificar alterações de data de vencimento
        const dataVencimentoOriginal = editingVenda.data_vencimento || null;
        const dataVencimentoNova = formData.data_vencimento
          ? new Date(formData.data_vencimento + "T12:00:00-03:00").toISOString()
          : null;

        if (
          dataVencimentoOriginal !== dataVencimentoNova &&
          (dataVencimentoOriginal || dataVencimentoNova)
        ) {
          const formatarData = (isoDate: string | null) => {
            if (!isoDate) return "Sem vencimento";
            return new Date(isoDate).toLocaleDateString("pt-BR");
          };

          alteracoes.push(
            `📅 Vencimento: ${formatarData(dataVencimentoOriginal)} → ${formatarData(dataVencimentoNova)}`
          );
        }

        // Verificar alterações de quantidade (se houver itens originais)
        if (itensOriginaisVenda.length > 0) {
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
        }

        if (alteracoes.length > 0) {
          logAlteracoes = `\n\n📝 [${dataHora}] Alterações por ${nomeUsuario}:\n${alteracoes.join("\n")}`;
          console.log("[VENDAS] 📝 Histórico de alterações gerado:", {
            quantidade: alteracoes.length,
            alteracoes: alteracoes,
            usuario: nomeUsuario,
            log: logAlteracoes,
          });
        }
      }

      // MODIFICADO: payload agora inclui informações de crédito e log de alterações
      const payloadRaw = {
        data_venda: editingVenda
          ? editingVenda.data_venda
          : getISOStringInBrazil(), // CORRIGIDO: Mantém data original ao editar
        data_vencimento: formData.data_vencimento
          ? new Date(formData.data_vencimento + "T12:00:00-03:00").toISOString()
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
        pagamento_detalhes: {
          // NOVO: Popular pagamento_detalhes com forma única de pagamento
          [normalizePaymentKey(formData.forma_pagamento || "Dinheiro")]:
            total_liquido,
        },
        status_pagamento,
        data_pagamento:
          status_pagamento === "pago"
            ? formData.data_pagamento || new Date().toISOString()
            : null, // NOVO: salva data/hora do pagamento
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
            `[VENDAS] Aplicando crédito do cliente ${selectedCliente.id}: ${fmt(clienteCredito)} → ${fmt(novoCredito)}`
          );

          // Preferir RPC atômica que atualiza saldo e insere histórico com created_by
          // Assinatura esperada (ver migration): registrar_credito_cliente(p_cliente_id bigint, p_tipo text, p_valor numeric, p_observacao text, p_creator uuid)
          const currentUserId = user?.id ?? null;
          let rpcErr: any = null;

          try {
            const rpcPayload = {
              p_cliente_id: selectedCliente.id,
              p_tipo: "remove",
              p_valor: credito_usado,
              p_observacao: `Crédito usado na venda #${vendaId ?? ""}`,
              p_creator: currentUserId,
            };

            const { error } = await supabase.rpc(
              "registrar_credito_cliente",
              rpcPayload as any
            );
            rpcErr = error;
            if (error) {
              console.warn(
                "[VENDAS] RPC registrar_credito_cliente retornou erro:",
                error.message || error
              );
            } else {
              console.log(
                "[VENDAS] RPC registrar_credito_cliente executada com sucesso"
              );
            }
          } catch (errRpc) {
            rpcErr = errRpc;
            console.warn(
              "[VENDAS] Erro ao chamar RPC registrar_credito_cliente:",
              (errRpc as any).message || errRpc
            );
          }

          // Se RPC falhar (não existe ou sem permissão), fazer fallback para update direto
          if (rpcErr) {
            console.log(
              "[VENDAS] Fallback: atualizando crédito diretamente na tabela clientes"
            );
            const { error: updErr } = await supabase
              .from("clientes")
              .update({
                credito: novoCredito,
                updated_at: new Date().toISOString(),
              })
              .eq("id", selectedCliente.id);

            if (updErr) {
              console.warn(
                "[VENDAS] Erro ao atualizar crédito do cliente (fallback):",
                updErr.message || updErr
              );
              alert(
                `Venda salva, mas houve erro ao atualizar o crédito do cliente: ${updErr.message || updErr}`
              );
            } else {
              console.log(
                "[VENDAS] Crédito atualizado com fallback com sucesso"
              );
            }
          }

          // Atualiza o estado local para refletir o novo saldo
          setClienteCredito(novoCredito);

          // Se não há mais crédito, desativa o uso
          if (novoCredito === 0) {
            setUsarCredito(false);
            setCreditoAplicado(0);
            setCreditoInput(numberToCurrencyInput(0));
          }
        } catch (e) {
          console.error("[VENDAS] Erro ao aplicar crédito do cliente:", e);
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
    // reset single valor (we now use pagamentoRows)
    setPagamentoObs("");
    // inicializa forma(s) na pagamentoRows abaixo
    // Inicializa linhas de pagamento com uma linha pré-preenchida com o restante
    const restanteInicial = Number(v.valor_restante) || 0;
    setPagamentoRows([
      {
        forma: v.forma_pagamento || "Dinheiro",
        valorInput: numberToCurrencyInput(restanteInicial),
      },
    ]);
    setComprovanteFiles([]); // Limpar arquivos anteriores
    payModal.onOpen();
  }

  // Função para fazer upload dos comprovantes
  async function uploadComprovantes(
    vendaId: number,
    files: File[]
  ): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `venda_${vendaId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from("comprovantes-pagamento")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Erro ao fazer upload do comprovante:", error);
        throw error;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("comprovantes-pagamento")
        .getPublicUrl(filePath);

      urls.push(urlData.publicUrl);
    }

    return urls;
  }

  async function confirmarPagamento() {
    if (!targetVenda) return;

    if (!canProcessarPagamentos) {
      alert("Você não possui permissão para processar pagamentos.");
      return;
    }

    const valor = totalPagamento;
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
    let dataPagamento: string | null = targetVenda.data_pagamento || null;

    if (restante === 0) {
      novoStatus = "pago";
      dataPagamento = new Date().toISOString(); // Registra data/hora do pagamento
      console.log(
        "[VENDAS] ✅ Pagamento quitado! Status atualizado para 'pago'"
      );
    } else if (novoPago > 0 && restante > 0) {
      novoStatus = "pendente";
      dataPagamento = null; // Limpa data de pagamento se ainda está pendente
      console.log(
        `[VENDAS] 💰 Pagamento parcial registrado. Restante: ${fmt(restante)}`
      );
    }

    const breakdown = pagamentoRows
      .map((r) => `${r.forma}: ${fmt(currencyToNumber(r.valorInput))}`)
      .join("; ");

    const obsConcat = [
      targetVenda.observacoes || "",
      `${new Date().toLocaleDateString("pt-BR")} - ${user?.nome || user?.email || "Usuário"}: Pagamento ${fmt(valor)}${pagamentoObs ? " - " + pagamentoObs : ""}${breakdown ? ` (${breakdown})` : ""}`,
    ]
      .join("\n")
      .trim();

    setLoading(true);
    setUploadingComprovante(true);
    try {
      // Upload de comprovantes (se houver)
      let novosComprovantes: string[] = [];
      if (comprovanteFiles.length > 0) {
        toast.loading("Enviando comprovantes...", {
          id: "upload-comprovantes",
        });
        novosComprovantes = await uploadComprovantes(
          targetVenda.id,
          comprovanteFiles
        );
        toast.dismiss("upload-comprovantes");
      }

      // Combinar comprovantes existentes com novos
      const comprovantesAtualizados = [
        ...(targetVenda.comprovantes || []),
        ...novosComprovantes,
      ];

      // MODIFICADO: Agora inclui status_pagamento e comprovantes na atualização
      const updateData: any = {
        valor_pago: novoPago,
        valor_restante: restante,
        status_pagamento: novoStatus,
        data_pagamento: dataPagamento, // NOVO: salva data/hora do pagamento
        observacoes: obsConcat,
      };

      // Adicionar comprovantes apenas se houver (para compatibilidade com DBs sem a coluna)
      if (comprovantesAtualizados.length > 0) {
        updateData.comprovantes = comprovantesAtualizados;
      }

      // NOVO: Popular pagamento_detalhes baseado nas linhas de pagamento
      const pagamentoDetalhes: Record<string, number> = {};
      pagamentoRows.forEach((row) => {
        const valor = currencyToNumber(row.valorInput);
        const formaKey = normalizePaymentKey(row.forma || "Dinheiro");

        // Somar se já existir a forma (caso improvável)
        pagamentoDetalhes[formaKey] =
          (pagamentoDetalhes[formaKey] || 0) + valor;
      });

      updateData.pagamento_detalhes = pagamentoDetalhes;

      // Se a forma de pagamento foi alterada, atualiza também
      // Atualiza forma_pagamento: se houver apenas uma linha, usa ela, caso contrário marca como 'Múltiplo'
      if (pagamentoRows.length === 1 && pagamentoRows[0].forma) {
        updateData.forma_pagamento = pagamentoRows[0].forma;
      } else if (pagamentoRows.length > 1) {
        updateData.forma_pagamento = "misto"; // Mudado de "Múltiplo" para "misto"
      }

      try {
        await updateTable("vendas", targetVenda.id, updateData);
      } catch (updateError: any) {
        // Se o erro for sobre a coluna comprovantes não existir, tenta sem ela
        if (
          updateError?.message?.includes("comprovantes") ||
          updateError?.code === "PGRST204"
        ) {
          console.warn(
            "[VENDAS] Coluna 'comprovantes' não encontrada. Salvando sem comprovantes..."
          );
          toast.error(
            "⚠️ Aviso: Execute o script SQL 'add_comprovantes_column.sql' para habilitar comprovantes!",
            {
              duration: 5000,
            }
          );

          // Tentar novamente sem o campo comprovantes
          const { comprovantes, ...updateDataSemComprovantes } = updateData;
          await updateTable(
            "vendas",
            targetVenda.id,
            updateDataSemComprovantes
          );
        } else {
          throw updateError; // Re-lançar outros erros
        }
      }

      await loadAll();
      payModal.onClose();

      // NOVO: Toast de feedback
      if (restante === 0) {
        toast.success(
          `✅ Venda #${targetVenda.id} quitada com sucesso!${novosComprovantes.length > 0 ? ` ${novosComprovantes.length} comprovante(s) anexado(s).` : ""}`,
          {
            duration: 3000,
            icon: "💰",
          }
        );
      } else {
        toast.success(
          `Pagamento de ${fmt(valor)} registrado. Restante: ${fmt(restante)}${novosComprovantes.length > 0 ? ` | ${novosComprovantes.length} comprovante(s) anexado(s).` : ""}`,
          {
            duration: 2500,
            icon: "💵",
          }
        );
      }
    } catch (e: any) {
      console.error("Erro ao registrar pagamento:", e);
      toast.error(
        "Erro ao registrar pagamento: " +
          (e?.message || e?.details || JSON.stringify(e) || "desconhecido")
      );
    } finally {
      setLoading(false);
      setUploadingComprovante(false);
    }
  }

  // Gerenciamento de Comprovantes
  function openGerenciarComprovantes(v: Venda) {
    setTargetVenda(v);
    setNovosComprovantesFiles([]);
    setComprovantesParaDeletar([]);
    comprovantesModal.onOpen();
  }

  async function deletarComprovanteStorage(url: string) {
    try {
      // Extrair o caminho do arquivo da URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];

      const { error } = await supabase.storage
        .from("comprovantes-pagamento")
        .remove([fileName]);

      if (error) {
        console.error("Erro ao deletar do storage:", error);
        // Não vamos falhar se não conseguir deletar do storage
      }
    } catch (error) {
      console.error("Erro ao processar URL do comprovante:", error);
    }
  }

  async function salvarAlteracoesComprovantes() {
    if (!targetVenda) return;

    setUploadingComprovante(true);
    try {
      let comprovantesAtualizados = [...(targetVenda.comprovantes || [])];

      // 1. Remover comprovantes marcados para deletar
      if (comprovantesParaDeletar.length > 0) {
        toast.loading("Removendo comprovantes...", {
          id: "delete-comprovantes",
        });

        // Deletar do storage
        await Promise.all(
          comprovantesParaDeletar.map((url) => deletarComprovanteStorage(url))
        );

        // Remover da lista
        comprovantesAtualizados = comprovantesAtualizados.filter(
          (url) => !comprovantesParaDeletar.includes(url)
        );

        toast.dismiss("delete-comprovantes");
      }

      // 2. Adicionar novos comprovantes
      if (novosComprovantesFiles.length > 0) {
        toast.loading("Enviando novos comprovantes...", { id: "upload-novos" });
        const novosUrls = await uploadComprovantes(
          targetVenda.id,
          novosComprovantesFiles
        );
        comprovantesAtualizados = [...comprovantesAtualizados, ...novosUrls];
        toast.dismiss("upload-novos");
      }

      // 3. Atualizar no banco de dados
      const updateData: any = {
        comprovantes:
          comprovantesAtualizados.length > 0 ? comprovantesAtualizados : null,
      };

      try {
        await updateTable("vendas", targetVenda.id, updateData);
      } catch (updateError: any) {
        if (
          updateError?.message?.includes("comprovantes") ||
          updateError?.code === "PGRST204"
        ) {
          toast.error(
            "⚠️ Aviso: Execute o script SQL 'add_comprovantes_column.sql' para habilitar comprovantes!",
            { duration: 5000 }
          );
          throw new Error("Coluna comprovantes não existe no banco");
        } else {
          throw updateError;
        }
      }

      await loadAll();
      comprovantesModal.onClose();

      toast.success(
        `✅ Comprovantes atualizados! ${comprovantesParaDeletar.length > 0 ? `${comprovantesParaDeletar.length} removido(s).` : ""} ${novosComprovantesFiles.length > 0 ? `${novosComprovantesFiles.length} adicionado(s).` : ""}`,
        { duration: 3000, icon: "📎" }
      );
    } catch (e: any) {
      console.error("Erro ao gerenciar comprovantes:", e);
      toast.error(
        "Erro ao gerenciar comprovantes: " +
          (e?.message || e?.details || JSON.stringify(e) || "desconhecido")
      );
    } finally {
      setUploadingComprovante(false);
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
      console.log("[VENDAS] ═══════════════════════════════════════");
      console.log("[VENDAS] 🗑️ INICIANDO EXCLUSÃO DE VENDA");
      console.log("[VENDAS] ═══════════════════════════════════════");
      console.log(`[VENDAS] Venda ID: ${targetVenda.id}`);
      console.log(`[VENDAS] Loja ID: ${targetVenda.loja_id}`);
      console.log(`[VENDAS] Total de itens: ${targetVenda.itens?.length || 0}`);

      // 1. DEVOLVER ITENS AO ESTOQUE DA LOJA
      if (
        targetVenda.itens &&
        targetVenda.itens.length > 0 &&
        targetVenda.loja_id
      ) {
        console.log("[VENDAS] ───────────────────────────────────────");
        console.log("[VENDAS] 🔄 DEVOLVENDO ITENS AO ESTOQUE...");
        console.log("[VENDAS] ───────────────────────────────────────");

        await Promise.all(
          targetVenda.itens.map(async (item) => {
            if (!item.id_estoque || !item.quantidade) {
              console.log(
                `[VENDAS] ⚠️ Item sem id_estoque ou quantidade, pulando...`
              );
              return;
            }

            try {
              // Buscar estoque atual da loja
              const { data: estoqueAtual, error: fetchError } = await supabase
                .from("estoque_lojas")
                .select("quantidade")
                .eq("produto_id", item.id_estoque)
                .eq("loja_id", targetVenda.loja_id)
                .single();

              if (fetchError) {
                console.error(
                  `[VENDAS] ❌ Erro ao buscar estoque do produto ${item.id_estoque} (${item.descricao}):`,
                  fetchError
                );
                return;
              }

              const quantidadeAtual = Number(estoqueAtual?.quantidade) || 0;
              const novaQuantidade = quantidadeAtual + item.quantidade;

              console.log(
                `[VENDAS] 📦 Produto: ${item.descricao} (ID: ${item.id_estoque})`
              );
              console.log(`[VENDAS]    • Estoque atual: ${quantidadeAtual}`);
              console.log(`[VENDAS]    • Devolvendo: +${item.quantidade}`);
              console.log(`[VENDAS]    • Novo estoque: ${novaQuantidade}`);

              // Atualizar estoque
              const { error: updateError } = await supabase
                .from("estoque_lojas")
                .update({
                  quantidade: novaQuantidade,
                  updatedat: new Date().toISOString(),
                })
                .eq("produto_id", item.id_estoque)
                .eq("loja_id", targetVenda.loja_id);

              if (updateError) {
                console.error(
                  `[VENDAS] ❌ Erro ao atualizar estoque do produto ${item.id_estoque}:`,
                  updateError
                );
              } else {
                console.log(
                  `[VENDAS] ✅ Estoque atualizado: ${quantidadeAtual} → ${novaQuantidade}`
                );
              }
            } catch (itemError) {
              console.error(
                `[VENDAS] ❌ Erro ao processar item ${item.id_estoque}:`,
                itemError
              );
            }
          })
        );

        console.log("[VENDAS] ───────────────────────────────────────");
        console.log("[VENDAS] ✅ DEVOLUÇÃO AO ESTOQUE CONCLUÍDA");
        console.log("[VENDAS] ───────────────────────────────────────");
      }

      // 2. SE HOUVE CRÉDITO USADO, DEVOLVER AO CLIENTE ANTES DE EXCLUIR A VENDA
      if (
        targetVenda.credito_usado &&
        targetVenda.credito_usado > 0 &&
        targetVenda.id_cliente
      ) {
        try {
          const devolver = Number(targetVenda.credito_usado) || 0;
          console.log(
            `[VENDAS] Devolvendo crédito ao cliente ${targetVenda.id_cliente}: R$ ${fmt(devolver)}`
          );

          const currentUserId = user?.id ?? null;

          // Tentar RPC atômica para registrar crédito (adicionar)
          let rpcErr: any = null;
          try {
            const rpcPayload = {
              p_cliente_id: targetVenda.id_cliente,
              p_tipo: "add",
              p_valor: devolver,
              p_observacao: `Crédito devolvido por exclusão da venda #${targetVenda.id}`,
              p_creator: currentUserId,
            };
            const { error: rpcError } = await supabase.rpc(
              "registrar_credito_cliente",
              rpcPayload as any
            );
            rpcErr = rpcError;
            if (rpcError) {
              console.warn(
                "[VENDAS] RPC registrar_credito_cliente retornou erro:",
                rpcError.message || rpcError
              );
            } else {
              console.log(
                "[VENDAS] RPC registrar_credito_cliente executada com sucesso (crédito devolvido)"
              );
            }
          } catch (e) {
            rpcErr = e;
            console.warn(
              "[VENDAS] Erro ao chamar RPC registrar_credito_cliente:",
              (e as any).message || e
            );
          }

          // Fallback: atualizar diretamente clientes e tentar inserir histórico manualmente
          if (rpcErr) {
            console.log(
              "[VENDAS] Fallback: atualizando crédito diretamente na tabela clientes"
            );

            // Obter crédito atual
            try {
              const { data: cliData, error: cliErr } = await supabase
                .from("clientes")
                .select("credito")
                .eq("id", targetVenda.id_cliente)
                .single();

              if (cliErr) {
                console.warn(
                  "[VENDAS] Erro ao buscar crédito do cliente no fallback:",
                  cliErr.message || cliErr
                );
              } else {
                const atual = Number(cliData?.credito) || 0;
                const novo = atual + devolver;
                const { error: updErr } = await supabase
                  .from("clientes")
                  .update({
                    credito: novo,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", targetVenda.id_cliente);

                if (updErr) {
                  console.warn(
                    "[VENDAS] Erro ao atualizar crédito do cliente (fallback):",
                    updErr.message || updErr
                  );
                } else {
                  console.log(
                    `[VENDAS] Crédito do cliente atualizado (fallback): ${fmt(atual)} → ${fmt(novo)}`
                  );
                }

                // Tentar inserir histórico direto em tabelas candidatas
                const payload = {
                  cliente_id: targetVenda.id_cliente,
                  tipo: "add",
                  valor: devolver,
                  observacao: `Crédito devolvido por exclusão da venda #${targetVenda.id}`,
                  saldo_apos: novo,
                  created_by: currentUserId,
                };

                const tableCandidates = [
                  "clientes_creditos",
                  "clientes_credito",
                  "cliente_creditos",
                  "cliente_credito",
                ];

                for (const t of tableCandidates) {
                  try {
                    const { data: insData, error: insErr } = await supabase
                      .from(t)
                      .insert(payload)
                      .select();
                    if (insErr) {
                      console.warn(
                        `Inserção de histórico em ${t} falhou:`,
                        insErr.message || insErr
                      );
                      continue;
                    }
                    console.log(`Histórico inserido em ${t}:`, insData);
                    break;
                  } catch (ie) {
                    console.warn(
                      `Erro ao inserir histórico em ${t}:`,
                      (ie as any).message || ie
                    );
                    continue;
                  }
                }
              }
            } catch (e) {
              console.error(
                "[VENDAS] Erro no fallback de devolução de crédito:",
                e
              );
            }
          }
        } catch (err) {
          console.error("[VENDAS] Erro ao devolver crédito ao cliente:", err);
        }
      }

      // 3. EXCLUIR A VENDA DO BANCO
      console.log("[VENDAS] 🗑️ Excluindo venda do banco de dados...");
      await deleteTable("vendas", targetVenda.id);
      console.log("[VENDAS] ✅ Venda excluída com sucesso!");

      // 3. RECARREGAR DADOS
      await loadAll();
      deleteModal.onClose();

      console.log("[VENDAS] ═══════════════════════════════════════");
      console.log("[VENDAS] ✅ EXCLUSÃO CONCLUÍDA COM SUCESSO!");
      console.log("[VENDAS] ═══════════════════════════════════════");

      toast.success(
        `Venda #${targetVenda.id} excluída e ${targetVenda.itens?.length || 0} ${targetVenda.itens?.length === 1 ? "item devolvido" : "itens devolvidos"} ao estoque!`,
        {
          duration: 3000,
          icon: "✅",
        }
      );
    } catch (e: any) {
      console.error("[VENDAS] ❌ Erro ao excluir venda:", e);
      toast.error(
        "Erro ao excluir: " +
          (e?.message ||
            e?.details ||
            e?.hint ||
            JSON.stringify(e) ||
            "erro desconhecido"),
        {
          duration: 4000,
          icon: "❌",
        }
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

  // Função de normalização de texto para busca (igual ao estoque)
  function normalizeText(text?: string): string {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-z0-9]+/g, " ") // mantém letras/números e espaços
      .trim();
  }

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    if (!searchProduto) return estoque;

    // Busca multi-termos: cada termo precisa existir (parcial) em algum campo
    const tokens = normalizeText(searchProduto).split(" ").filter(Boolean);

    return estoque.filter((p) => {
      const composite = normalizeText(
        [p.id.toString(), p.descricao, p.marca, p.modelo, p.compativel].join(
          " "
        )
      );
      return tokens.length === 0 || tokens.every((t) => composite.includes(t));
    });
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

      {/* Aviso sobre diferença de datas */}
      {(filters.inicio || filters.fim) && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardBody className="py-3">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  📊 Sobre os valores exibidos
                </p>
                {filters.filtrarPorDataPagamento ? (
                  <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                    <strong>Modo: Filtrar por Data de Pagamento</strong> ✅
                    <br />
                    Exibindo <strong>
                      apenas vendas que já foram pagas
                    </strong>{" "}
                    (com data de pagamento registrada).
                    {filters.inicio || filters.fim ? (
                      <>
                        <br />
                        Período: vendas <strong>pagas</strong>{" "}
                        {filters.inicio &&
                          `de ${filters.inicio.split("-").reverse().join("/")}`}{" "}
                        {filters.fim &&
                          `até ${filters.fim.split("-").reverse().join("/")}`}
                        .
                      </>
                    ) : null}
                    <br />
                    💡{" "}
                    <em>
                      Neste modo, os valores devem coincidir com o Caixa, pois
                      ambos filtram por quando o pagamento foi recebido.
                      {!filters.inicio &&
                        !filters.fim &&
                        "Sem filtro de data, mostra todas as vendas já pagas (histórico completo)."}
                    </em>{" "}
                    <a
                      href="/DIFERENCA_CAIXA_VENDAS.md"
                      target="_blank"
                      className="underline hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      Ver documentação completa →
                    </a>
                  </p>
                ) : (
                  <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                    <strong>Modo: Filtrar por Data de Venda</strong> (padrão)
                    <br />
                    <strong>Faturamento</strong> = vendas{" "}
                    <strong>criadas</strong> no período filtrado e já pagas
                    (status: pago).
                    <br />
                    <strong>A Receber</strong> = vendas criadas no período mas
                    ainda pendentes de pagamento.
                    <br />
                    💡{" "}
                    <em>
                      O Caixa mostra valores por data de{" "}
                      <strong>pagamento</strong> (quando o dinheiro entrou),
                      enquanto este modo filtra por data de{" "}
                      <strong>criação da venda</strong>. Por isso, os totais
                      podem não coincidir. Use o filtro "Filtrar por Data de
                      Pagamento" para comparar com o Caixa.
                    </em>{" "}
                    <a
                      href="/DIFERENCA_CAIXA_VENDAS.md"
                      target="_blank"
                      className="underline hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      Ver documentação completa →
                    </a>
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

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
            filtrarPorDataPagamento: false,
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
          filters.valorMax !== "" ||
          filters.filtrarPorDataPagamento
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
              {lojasDisponiveis.map((l) => (
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
            <div className="flex items-center gap-2">
              <Switch
                size="sm"
                isSelected={filters.filtrarPorDataPagamento}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, filtrarPorDataPagamento: v }))
                }
              >
                Filtrar por Data de Pagamento
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
                <TableColumn>Hora</TableColumn>
                <TableColumn>Funcionário</TableColumn>
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
                      <TableCell>{fmtHora(v.data_venda)}</TableCell>
                      <TableCell className="text-xs">
                        {getNomeUsuario(v.id_usuario)}
                      </TableCell>
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
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            variant="flat"
                            startContent={<Icon className="w-3.5 h-3.5" />}
                          >
                            {v.status_pagamento}
                          </Chip>
                          {v.comprovantes && v.comprovantes.length > 0 && (
                            <Tooltip
                              content={`${v.comprovantes.length} comprovante(s) anexado(s)`}
                            >
                              <div className="flex items-center gap-1 text-success-600">
                                <PaperClipIcon className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  {v.comprovantes.length}
                                </span>
                              </div>
                            </Tooltip>
                          )}
                        </div>
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
                                computeStatus(v) === "pago" &&
                                !canEditVendasPagas
                                  ? "Venda paga - Sem permissão para editar"
                                  : "Editar"
                              }
                            >
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => safeOpenEditVenda(v)}
                                isDisabled={
                                  computeStatus(v) === "pago" &&
                                  !canEditVendasPagas
                                }
                              >
                                {computeStatus(v) === "pago" &&
                                !canEditVendasPagas ? (
                                  <LockClosedIcon className="w-4 h-4" />
                                ) : (
                                  <PencilIcon className="w-4 h-4" />
                                )}
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
          scrollBehavior="outside"
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

              {/* Aviso de devolução de crédito ao cliente (se aplicável) */}
              {Number(targetVenda?.credito_usado || 0) > 0 &&
                ((targetVenda as any)?.id_cliente ??
                  (targetVenda as any)?.cliente_id) && (
                  <div className="bg-info-50 dark:bg-info-100/10 border border-info-200 dark:border-info-200/20 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <CurrencyDollarIcon className="w-5 h-5 text-info-600 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-info-800 dark:text-info-600">
                          🔁 Crédito será devolvido
                        </p>
                        <p className="text-sm text-info-700 dark:text-info-500">
                          Esta venda utilizou{" "}
                          <strong>
                            R${" "}
                            {Number(
                              targetVenda?.credito_usado || 0
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </strong>{" "}
                          de crédito do cliente. Ao confirmar a exclusão, esse
                          valor será devolvido ao saldo do cliente
                          automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

                    // CORREÇÃO: Carregar estoque explicitamente ao selecionar loja
                    if (loja?.id) {
                      loadEstoquePorLoja(loja.id);
                    } else {
                      setEstoque([]);
                    }

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
                  {lojasDisponiveis.map((l) => (
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

                    {/* Card de Detalhes do Produto Selecionado - NOVO */}
                    {selectedProduto && (
                      <Card className="border-primary-200 bg-primary-50">
                        <CardBody className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            {selectedProduto.fotourl?.[0] ? (
                              <Avatar
                                src={selectedProduto.fotourl[0]}
                                size="lg"
                                radius="md"
                                className="shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-md bg-primary-200 flex items-center justify-center shrink-0">
                                <CubeIcon className="w-8 h-8 text-primary-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-primary-800 truncate">
                                {selectedProduto.descricao}
                              </p>
                              <p className="text-sm text-primary-600">
                                {[selectedProduto.marca, selectedProduto.modelo]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Chip size="sm" color="success" variant="flat">
                                  Disponível: {selectedProduto.quantidade || 0}{" "}
                                  un
                                </Chip>
                                <Chip size="sm" color="primary" variant="flat">
                                  Preço base:{" "}
                                  {fmt(
                                    Number(selectedProduto.preco_venda) || 0
                                  )}
                                </Chip>
                              </div>
                            </div>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setSelectedProduto(null);
                                setProdutoQtd(1);
                                setProdutoDesc(0);
                                setProdutoPreco(0);
                                setProdutoPrecoInput(numberToCurrencyInput(0));
                              }}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              label="Quantidade"
                              type="number"
                              min="1"
                              max={selectedProduto.quantidade || 0}
                              value={produtoQtd.toString()}
                              onChange={(e) =>
                                setProdutoQtd(Number(e.target.value) || 1)
                              }
                              startContent={
                                <ShoppingCartIcon className="w-4 h-4" />
                              }
                              size="sm"
                            />
                            <Input
                              label="Preço Unitário"
                              value={produtoPrecoInput}
                              onChange={(e) => {
                                const masked = currencyMask(e.target.value);
                                setProdutoPrecoInput(masked);
                              }}
                              onBlur={() => {
                                const num = currencyToNumber(produtoPrecoInput);
                                setProdutoPreco(num);
                                setProdutoPrecoInput(
                                  numberToCurrencyInput(num)
                                );
                              }}
                              startContent={
                                <CurrencyDollarIcon className="w-4 h-4" />
                              }
                              description="Pode aumentar ou diminuir"
                              size="sm"
                              classNames={{
                                description: "text-primary-600",
                              }}
                            />
                            <Input
                              label="Desconto"
                              value={numberToCurrencyInput(produtoDesc)}
                              onChange={(e) => {
                                const num = currencyToNumber(
                                  currencyMask(e.target.value)
                                );
                                setProdutoDesc(num);
                              }}
                              startContent={<TagIcon className="w-4 h-4" />}
                              isDisabled={!canAplicarDesconto}
                              size="sm"
                            />
                          </div>

                          <div className="mt-3 pt-3 border-t border-primary-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-primary-700">
                                Subtotal:
                              </span>
                              <span className="text-lg font-bold text-primary-900">
                                {fmt(
                                  (produtoPreco || 0) * produtoQtd - produtoDesc
                                )}
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}

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
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
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
                          className="rounded-md border border-default-200 p-4"
                        >
                          {/* Cabeçalho do Item */}
                          <div className="flex items-start gap-3 mb-3">
                            {it.foto ? (
                              <Avatar src={it.foto} size="sm" />
                            ) : (
                              <div className="w-10 h-10 bg-default-200 rounded-full flex items-center justify-center">
                                <CubeIcon className="w-5 h-5 text-default-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {it.descricao}
                              </p>
                              <p className="text-[11px] text-default-500 truncate">
                                {[it.marca, it.modelo]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            </div>
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

                          {/* Controles do Item */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* Quantidade */}
                            <div>
                              <label className="text-[10px] text-default-500 mb-1 block">
                                Quantidade
                              </label>
                              <div className="flex items-center gap-1">
                                <Button
                                  isIconOnly
                                  variant="flat"
                                  size="sm"
                                  onPress={() =>
                                    updateItemQty(idx, it.quantidade - 1)
                                  }
                                  className="h-8 w-8 min-w-0"
                                >
                                  <MinusIcon className="w-3 h-3" />
                                </Button>
                                <Input
                                  size="sm"
                                  className="w-14"
                                  type="number"
                                  value={it.quantidade.toString()}
                                  onChange={(e) =>
                                    updateItemQty(
                                      idx,
                                      Number(e.target.value) || 1
                                    )
                                  }
                                  min="1"
                                  classNames={{
                                    input: "text-center text-xs",
                                  }}
                                />
                                <Button
                                  isIconOnly
                                  variant="flat"
                                  size="sm"
                                  onPress={() =>
                                    updateItemQty(idx, it.quantidade + 1)
                                  }
                                  className="h-8 w-8 min-w-0"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Preço Unitário */}
                            <div>
                              <label className="text-[10px] text-default-500 mb-1 block">
                                Preço Unit.
                              </label>
                              <Input
                                size="sm"
                                value={numberToCurrencyInput(it.preco_unitario)}
                                onChange={(e) => {
                                  const masked = currencyMask(e.target.value);
                                  const num = currencyToNumber(masked);
                                  updateItemPrice(idx, num);
                                }}
                                startContent={
                                  <CurrencyDollarIcon className="w-3 h-3" />
                                }
                                classNames={{
                                  input: "text-xs",
                                }}
                              />
                            </div>

                            {/* Desconto */}
                            <div>
                              <label className="text-[10px] text-default-500 mb-1 block">
                                Desconto
                              </label>
                              <Input
                                size="sm"
                                value={numberToCurrencyInput(it.desconto || 0)}
                                onChange={(e) => {
                                  const masked = currencyMask(e.target.value);
                                  const num = currencyToNumber(masked);
                                  updateItemDesconto(idx, num);
                                }}
                                startContent={<TagIcon className="w-3 h-3" />}
                                isDisabled={!canAplicarDesconto}
                                classNames={{
                                  input: "text-xs",
                                }}
                              />
                            </div>

                            {/* Subtotal */}
                            <div>
                              <label className="text-[10px] text-default-500 mb-1 block">
                                Subtotal
                              </label>
                              <div className="h-8 flex items-center">
                                <p className="text-sm font-semibold text-primary">
                                  {fmt(it.subtotal)}
                                </p>
                              </div>
                            </div>
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
        scrollBehavior="outside"
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
                  {targetVenda.itens.map((i, idx) => {
                    // Verificar se este item foi devolvido
                    const devolucoesVenda = devolucoes.filter(
                      (d: any) => d.id_venda === targetVenda.id
                    );

                    let itemDevolvido = false;
                    let quantidadeDevolvida = 0;

                    devolucoesVenda.forEach((dev: any) => {
                      if (
                        dev.itens_devolvidos &&
                        Array.isArray(dev.itens_devolvidos)
                      ) {
                        dev.itens_devolvidos.forEach((itemDev: any) => {
                          // Comparar por id_estoque ou descricao
                          if (
                            (i.id_estoque &&
                              itemDev.id_estoque === i.id_estoque) ||
                            (!i.id_estoque && itemDev.descricao === i.descricao)
                          ) {
                            itemDevolvido = true;
                            quantidadeDevolvida += Number(
                              itemDev.quantidade || 0
                            );
                          }
                        });
                      }
                    });

                    return (
                      <div
                        key={idx}
                        className={`flex justify-between text-xs border-b pb-1 px-2 py-1.5 rounded ${
                          itemDevolvido
                            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                            : "border-default-100"
                        }`}
                      >
                        <span className="truncate flex items-center gap-2">
                          {itemDevolvido && (
                            <span className="text-red-600 dark:text-red-400 font-semibold">
                              ↩
                            </span>
                          )}
                          <span
                            className={
                              itemDevolvido
                                ? "text-red-700 dark:text-red-300"
                                : ""
                            }
                          >
                            {i.descricao} x{i.quantidade}
                            {itemDevolvido && quantidadeDevolvida > 0 && (
                              <span className="ml-1 text-red-600 dark:text-red-400 font-medium">
                                (
                                {quantidadeDevolvida === i.quantidade
                                  ? "total"
                                  : `${quantidadeDevolvida} devolvido${quantidadeDevolvida > 1 ? "s" : ""}`}
                                )
                              </span>
                            )}
                          </span>
                        </span>
                        <span
                          className={
                            itemDevolvido
                              ? "text-red-700 dark:text-red-300 font-medium"
                              : ""
                          }
                        >
                          {fmt(i.subtotal)}
                        </span>
                      </div>
                    );
                  })}
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
                              // Extrair usuário se houver (formato: "Alterações por NomeUsuario:")
                              const usuarioMatch = section.match(
                                /Alterações por (.+?):/
                              );
                              const nomeUsuarioLog = usuarioMatch
                                ? usuarioMatch[1]
                                : null;

                              return (
                                <div
                                  key={idx}
                                  className={
                                    isLog
                                      ? "border-l-3 border-primary pl-3 bg-primary-50/50 py-2 rounded"
                                      : ""
                                  }
                                >
                                  {nomeUsuarioLog && (
                                    <div className="flex items-center gap-2 mb-2 text-primary-700">
                                      <UserIcon className="w-3.5 h-3.5" />
                                      <span className="font-semibold">
                                        {nomeUsuarioLog}
                                      </span>
                                    </div>
                                  )}
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
                                        const isVencimento =
                                          line.includes("📅 Vencimento:");

                                        let lineClass = "";
                                        let icon = null;

                                        if (isVencimento) {
                                          lineClass =
                                            "text-blue-700 font-medium";
                                          icon = "📅";
                                        } else if (isAumento) {
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
                                            {icon && !isVencimento && (
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

                {/* Seção de Comprovantes */}
                {targetVenda.comprovantes &&
                  targetVenda.comprovantes.length > 0 && (
                    <>
                      <Divider />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold flex items-center gap-2">
                            <PaperClipIcon className="w-4 h-4" />
                            Comprovantes de Pagamento (
                            {targetVenda.comprovantes.length})
                          </p>
                          {canProcessarPagamentos && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={<CogIcon className="w-3 h-3" />}
                              onPress={() =>
                                openGerenciarComprovantes(targetVenda)
                              }
                            >
                              Gerenciar
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {targetVenda.comprovantes.map((url, idx) => {
                            const isPDF = url.toLowerCase().endsWith(".pdf");
                            const fileName =
                              url.split("/").pop() || `comprovante_${idx + 1}`;

                            return (
                              <Card
                                key={idx}
                                className="border-primary-200"
                                isPressable
                              >
                                <CardBody className="p-3">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:text-primary-600"
                                  >
                                    {isPDF ? (
                                      <DocumentTextIcon className="w-5 h-5" />
                                    ) : (
                                      <PhotoIcon className="w-5 h-5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        Comprovante {idx + 1}
                                      </p>
                                      <p className="text-xs text-default-500">
                                        {isPDF ? "PDF" : "Imagem"}
                                      </p>
                                    </div>
                                    <EyeIcon className="w-4 h-4" />
                                  </a>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                {/* Botão para adicionar comprovantes quando não há nenhum */}
                {canProcessarPagamentos &&
                  (!targetVenda.comprovantes ||
                    targetVenda.comprovantes.length === 0) && (
                    <>
                      <Divider />
                      <Card className="border-default-200">
                        <CardBody className="p-4 text-center">
                          <PaperClipIcon className="w-8 h-8 text-default-400 mx-auto mb-2" />
                          <p className="text-sm text-default-500 mb-3">
                            Nenhum comprovante anexado ainda
                          </p>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={() =>
                              openGerenciarComprovantes(targetVenda)
                            }
                          >
                            Adicionar Comprovantes
                          </Button>
                        </CardBody>
                      </Card>
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
          size="4xl"
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
                                setPagamentoRows((prev) => {
                                  if (prev.length === 0)
                                    return [
                                      {
                                        forma:
                                          targetVenda.forma_pagamento ||
                                          "Dinheiro",
                                        valorInput:
                                          numberToCurrencyInput(restante),
                                      },
                                    ];
                                  const copy = [...prev];
                                  copy[0] = {
                                    ...copy[0],
                                    valorInput: numberToCurrencyInput(restante),
                                  };
                                  return copy;
                                });
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
                                setPagamentoRows((prev) => {
                                  if (prev.length === 0)
                                    return [
                                      {
                                        forma:
                                          targetVenda.forma_pagamento ||
                                          "Dinheiro",
                                        valorInput:
                                          numberToCurrencyInput(restante),
                                      },
                                    ];
                                  const copy = [...prev];
                                  copy[0] = {
                                    ...copy[0],
                                    valorInput: numberToCurrencyInput(restante),
                                  };
                                  return copy;
                                });
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
                                setPagamentoRows((prev) => {
                                  if (prev.length === 0)
                                    return [
                                      {
                                        forma:
                                          targetVenda.forma_pagamento ||
                                          "Dinheiro",
                                        valorInput:
                                          numberToCurrencyInput(restante),
                                      },
                                    ];
                                  const copy = [...prev];
                                  copy[0] = {
                                    ...copy[0],
                                    valorInput: numberToCurrencyInput(restante),
                                  };
                                  return copy;
                                });
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

                        <div className="space-y-3">
                          {pagamentoRows.map((row, idx) => (
                            <div
                              key={idx}
                              className="grid md:grid-cols-4 gap-2 items-end"
                            >
                              <Select
                                label={`Forma ${idx + 1}`}
                                size="sm"
                                selectedKeys={row.forma ? [row.forma] : []}
                                onSelectionChange={(k) => {
                                  const selected = Array.from(k)[0] as string;
                                  setPagamentoRows((prev) => {
                                    const copy = [...prev];
                                    copy[idx] = {
                                      ...copy[idx],
                                      forma: selected,
                                    };
                                    return copy;
                                  });
                                }}
                              >
                                {PAGAMENTO_OPTIONS.map((option) => {
                                  const Icon = option.icon;
                                  return (
                                    <SelectItem
                                      key={option.key}
                                      startContent={
                                        <Icon className="w-4 h-4" />
                                      }
                                    >
                                      {option.label}
                                    </SelectItem>
                                  );
                                })}
                              </Select>

                              <Input
                                placeholder="R$ 0,00"
                                value={row.valorInput}
                                size="lg"
                                startContent={
                                  <CurrencyDollarIcon className="w-5 h-5" />
                                }
                                isDisabled={
                                  Number(targetVenda.valor_restante) === 0
                                }
                                onChange={(e) => {
                                  const masked = currencyMask(e.target.value);
                                  setPagamentoRows((prev) => {
                                    const copy = [...prev];
                                    copy[idx] = {
                                      ...copy[idx],
                                      valorInput: masked,
                                    };
                                    return copy;
                                  });
                                }}
                              />

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="danger"
                                  onPress={() => {
                                    setPagamentoRows((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    );
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() =>
                                setPagamentoRows((prev) => [
                                  ...prev,
                                  {
                                    forma: "Dinheiro",
                                    valorInput: numberToCurrencyInput(0),
                                  },
                                ])
                              }
                            >
                              + Adicionar Forma
                            </Button>

                            <Button
                              size="sm"
                              variant="flat"
                              color="success"
                              onPress={() => {
                                if (!targetVenda) return;
                                const restante =
                                  Number(targetVenda.valor_restante) || 0;
                                // se não houver linhas, adiciona uma
                                if (pagamentoRows.length === 0) {
                                  setPagamentoRows([
                                    {
                                      forma:
                                        targetVenda.forma_pagamento ||
                                        "Dinheiro",
                                      valorInput:
                                        numberToCurrencyInput(restante),
                                    },
                                  ]);
                                } else {
                                  // preenche a primeira linha com o restante
                                  setPagamentoRows((prev) => {
                                    const copy = [...prev];
                                    copy[0] = {
                                      ...copy[0],
                                      valorInput:
                                        numberToCurrencyInput(restante),
                                    };
                                    return copy;
                                  });
                                }
                              }}
                            >
                              Preencher com Total
                            </Button>

                            <div className="ml-auto text-sm">
                              Total: <strong>{fmt(totalPagamento)}</strong>
                            </div>
                          </div>

                          <div className="text-xs text-default-500">
                            {Number(targetVenda?.valor_restante) === 0
                              ? "Esta venda já foi totalmente paga"
                              : totalPagamento >
                                  Number(targetVenda?.valor_restante || 0)
                                ? "⚠️ Soma dos pagamentos excede o restante"
                                : totalPagamento ===
                                    Number(targetVenda?.valor_restante || 0)
                                  ? "✅ Pagamento quitará a venda"
                                  : totalPagamento > 0
                                    ? `Restará: ${fmt(Number(targetVenda?.valor_restante || 0) - totalPagamento)}`
                                    : `Máximo permitido: ${fmt(targetVenda?.valor_restante)}`}
                          </div>
                        </div>
                      </div>

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

                      {/* Upload de Comprovantes */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <PaperClipIcon className="w-5 h-5 text-primary" />
                          <label className="text-sm font-medium">
                            Comprovantes de Pagamento
                          </label>
                        </div>

                        <div className="border-2 border-dashed border-default-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
                          <input
                            type="file"
                            id="comprovante-upload"
                            multiple
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setComprovanteFiles((prev) => [
                                ...prev,
                                ...files,
                              ]);
                            }}
                            disabled={Number(targetVenda.valor_restante) === 0}
                          />
                          <label
                            htmlFor="comprovante-upload"
                            className={`flex flex-col items-center gap-2 ${Number(targetVenda.valor_restante) === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <CloudArrowUpIcon className="w-8 h-8 text-primary" />
                            <p className="text-sm text-center">
                              <span className="text-primary font-medium">
                                Clique para selecionar
                              </span>
                              <br />
                              ou arraste arquivos aqui
                            </p>
                            <p className="text-xs text-default-500">
                              PDF, PNG, JPG ou JPEG (máx. 10MB cada)
                            </p>
                          </label>
                        </div>

                        {/* Lista de arquivos selecionados */}
                        {comprovanteFiles.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Arquivos selecionados: {comprovanteFiles.length}
                            </p>
                            {comprovanteFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 bg-default-100 rounded-lg"
                              >
                                {file.type.startsWith("image/") ? (
                                  <PhotoIcon className="w-5 h-5 text-primary" />
                                ) : (
                                  <DocumentTextIcon className="w-5 h-5 text-danger" />
                                )}
                                <span className="text-sm flex-1 truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs text-default-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => {
                                    setComprovanteFiles((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    );
                                  }}
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comprovantes já anexados */}
                        {targetVenda?.comprovantes &&
                          targetVenda.comprovantes.length > 0 && (
                            <div className="space-y-2">
                              <Divider />
                              <p className="text-sm font-medium text-success-600">
                                Comprovantes anexados anteriormente:{" "}
                                {targetVenda.comprovantes.length}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {targetVenda.comprovantes.map((url, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    color="success"
                                    as="a"
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startContent={
                                      url.toLowerCase().endsWith(".pdf") ? (
                                        <DocumentTextIcon className="w-4 h-4" />
                                      ) : (
                                        <PhotoIcon className="w-4 h-4" />
                                      )
                                    }
                                  >
                                    Comprovante {idx + 1}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Preview do Resultado */}
                      {totalPagamento > 0 &&
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
                                    {fmt(totalPagamento)}
                                  </span>
                                </div>
                                <Divider className="my-1" />
                                <div className="flex justify-between font-semibold">
                                  <span>Total pago após:</span>
                                  <span className="text-success">
                                    {fmt(
                                      targetVenda.valor_pago + totalPagamento
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Restante:</span>
                                  <span
                                    className={
                                      targetVenda.valor_restante -
                                        totalPagamento ===
                                      0
                                        ? "text-success font-semibold"
                                        : "text-warning"
                                    }
                                  >
                                    {fmt(
                                      Math.max(
                                        0,
                                        targetVenda.valor_restante -
                                          totalPagamento
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
                isLoading={loading || uploadingComprovante}
                startContent={
                  uploadingComprovante ? (
                    <CloudArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )
                }
                isDisabled={
                  totalPagamento <= 0 ||
                  Number(targetVenda?.valor_restante || 0) === 0 ||
                  totalPagamento > Number(targetVenda?.valor_restante || 0)
                }
              >
                {uploadingComprovante
                  ? "Enviando comprovantes..."
                  : Number(targetVenda?.valor_restante || 0) === 0
                    ? "Venda Já Paga"
                    : totalPagamento ===
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
          size="lg"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2 text-danger">
              <ExclamationTriangleIcon className="w-6 h-6" />
              Excluir Venda
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-default-700">
                  Tem certeza que deseja excluir definitivamente a venda{" "}
                  <strong className="text-danger">#{targetVenda?.id}</strong>?
                </p>

                {targetVenda && (
                  <>
                    <Divider />

                    {/* Informações sobre devolução ao estoque */}
                    <div className="bg-warning-50 dark:bg-warning-100/10 border border-warning-200 dark:border-warning-200/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <ArrowPathIcon className="w-5 h-5 text-warning-600 mt-0.5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-semibold text-warning-800 dark:text-warning-600">
                            ⚠️ Atenção: Devolução ao Estoque
                          </p>
                          <p className="text-sm text-warning-700 dark:text-warning-500">
                            Os produtos desta venda serão devolvidos ao estoque
                            da loja:
                          </p>
                          <div className="bg-white dark:bg-default-100 rounded-md p-3 border border-warning-200 dark:border-warning-200/20">
                            <div className="flex items-center gap-2 mb-2">
                              <BuildingStorefrontIcon className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-sm">
                                {lojas.find((l) => l.id === targetVenda.loja_id)
                                  ?.nome || `Loja #${targetVenda.loja_id}`}
                              </span>
                            </div>
                            {targetVenda.itens &&
                              targetVenda.itens.length > 0 && (
                                <div className="space-y-1.5 mt-2">
                                  {targetVenda.itens.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-xs bg-default-50 dark:bg-default-200/50 rounded px-2 py-1.5"
                                    >
                                      <div className="flex items-center gap-2">
                                        <CubeIcon className="w-3.5 h-3.5 text-success" />
                                        <span className="text-default-700 dark:text-default-600">
                                          {item.descricao}
                                          {item.modelo && ` - ${item.modelo}`}
                                        </span>
                                      </div>
                                      <span className="font-semibold text-success">
                                        +{item.quantidade} un.
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    {/* Aviso: Devolução de crédito ao cliente (quando aplicável) */}
                    {Number(targetVenda?.credito_usado || 0) > 0 &&
                      ((targetVenda as any)?.id_cliente ??
                        (targetVenda as any)?.cliente_id) && (
                        <div className="bg-info-50 dark:bg-info-100/10 border border-info-200 dark:border-info-200/20 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <CurrencyDollarIcon className="w-5 h-5 text-info-600 mt-0.5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-info-800 dark:text-info-600">
                                Crédito será devolvido ao cliente
                              </p>
                              <p className="text-sm text-info-700 dark:text-info-500">
                                Ao excluir esta venda,{" "}
                                <strong>
                                  R${" "}
                                  {Number(
                                    targetVenda?.credito_usado || 0
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </strong>{" "}
                                será devolvido ao saldo do cliente.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Alerta de ação irreversível */}
                    <div className="bg-danger-50 dark:bg-danger-100/10 border border-danger-200 dark:border-danger-200/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger flex-shrink-0" />
                        <p className="text-sm text-danger-700 dark:text-danger-600">
                          <strong>Esta ação não pode ser desfeita!</strong> A
                          venda será permanentemente excluída do sistema.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={deleteModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="danger"
                onPress={confirmarDelete}
                isLoading={loading}
                startContent={<TrashIcon className="w-4 h-4" />}
              >
                Sim, Excluir Venda
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Gerenciar Comprovantes */}
      {canProcessarPagamentos && (
        <Modal
          isOpen={comprovantesModal.isOpen}
          onOpenChange={comprovantesModal.onOpenChange}
          size="2xl"
          scrollBehavior="outside"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2">
              <PaperClipIcon className="w-5 h-5" />
              Gerenciar Comprovantes - Venda #{targetVenda?.id}
            </ModalHeader>
            <ModalBody className="space-y-4">
              {targetVenda && (
                <>
                  {/* Informações da Venda */}
                  <Card className="border-primary-200 bg-primary-50">
                    <CardBody className="p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-primary-600 font-medium">
                            Cliente:
                          </p>
                          <p className="font-semibold">
                            {targetVenda.cliente_nome}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary-600 font-medium">Total:</p>
                          <p className="font-semibold">
                            {fmt(targetVenda.total_liquido)}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Comprovantes Existentes */}
                  {targetVenda.comprovantes &&
                    targetVenda.comprovantes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">
                          Comprovantes Atuais ({targetVenda.comprovantes.length}
                          )
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {targetVenda.comprovantes.map((url, idx) => {
                            const isPDF = url.toLowerCase().endsWith(".pdf");
                            const fileName =
                              url.split("/").pop() || `comprovante_${idx + 1}`;
                            const marcadoParaDeletar =
                              comprovantesParaDeletar.includes(url);

                            return (
                              <Card
                                key={idx}
                                className={`border-2 transition-all ${
                                  marcadoParaDeletar
                                    ? "border-danger-300 bg-danger-50 opacity-50"
                                    : "border-default-200"
                                }`}
                              >
                                <CardBody className="p-3">
                                  <div className="flex items-center gap-3">
                                    {isPDF ? (
                                      <DocumentTextIcon className="w-6 h-6 text-danger flex-shrink-0" />
                                    ) : (
                                      <PhotoIcon className="w-6 h-6 text-primary flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        Comprovante {idx + 1}
                                      </p>
                                      <p className="text-xs text-default-500">
                                        {isPDF ? "PDF" : "Imagem"}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        isIconOnly
                                        as="a"
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <EyeIcon className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="flat"
                                        color={
                                          marcadoParaDeletar
                                            ? "default"
                                            : "danger"
                                        }
                                        isIconOnly
                                        onPress={() => {
                                          if (marcadoParaDeletar) {
                                            setComprovantesParaDeletar((prev) =>
                                              prev.filter((u) => u !== url)
                                            );
                                          } else {
                                            setComprovantesParaDeletar(
                                              (prev) => [...prev, url]
                                            );
                                          }
                                        }}
                                      >
                                        {marcadoParaDeletar ? (
                                          <ArrowPathIcon className="w-4 h-4" />
                                        ) : (
                                          <TrashIcon className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  {marcadoParaDeletar && (
                                    <p className="text-xs text-danger-600 mt-2">
                                      ⚠️ Será removido ao salvar
                                    </p>
                                  )}
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  <Divider />

                  {/* Adicionar Novos Comprovantes */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">
                      Adicionar Novos Comprovantes
                    </p>

                    <div className="border-2 border-dashed border-default-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
                      <input
                        type="file"
                        id="novos-comprovantes-upload"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setNovosComprovantesFiles((prev) => [
                            ...prev,
                            ...files,
                          ]);
                        }}
                      />
                      <label
                        htmlFor="novos-comprovantes-upload"
                        className="flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <CloudArrowUpIcon className="w-8 h-8 text-primary" />
                        <p className="text-sm text-center">
                          <span className="text-primary font-medium">
                            Clique para selecionar
                          </span>
                          <br />
                          ou arraste arquivos aqui
                        </p>
                        <p className="text-xs text-default-500">
                          PDF, PNG, JPG ou JPEG (máx. 10MB cada)
                        </p>
                      </label>
                    </div>

                    {/* Lista de novos arquivos selecionados */}
                    {novosComprovantesFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-success-600">
                          Novos arquivos: {novosComprovantesFiles.length}
                        </p>
                        {novosComprovantesFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-success-50 border border-success-200 rounded-lg"
                          >
                            {file.type.startsWith("image/") ? (
                              <PhotoIcon className="w-5 h-5 text-success flex-shrink-0" />
                            ) : (
                              <DocumentTextIcon className="w-5 h-5 text-danger flex-shrink-0" />
                            )}
                            <span className="text-sm flex-1 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-default-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => {
                                setNovosComprovantesFiles((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                              }}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumo das Alterações */}
                  {(comprovantesParaDeletar.length > 0 ||
                    novosComprovantesFiles.length > 0) && (
                    <>
                      <Divider />
                      <Card className="border-warning-200 bg-warning-50">
                        <CardBody className="p-3">
                          <p className="text-warning-700 font-medium text-sm mb-2">
                            📋 Resumo das Alterações
                          </p>
                          <div className="space-y-1 text-sm">
                            {comprovantesParaDeletar.length > 0 && (
                              <div className="flex justify-between">
                                <span>Serão removidos:</span>
                                <span className="font-medium text-danger-600">
                                  {comprovantesParaDeletar.length} arquivo(s)
                                </span>
                              </div>
                            )}
                            {novosComprovantesFiles.length > 0 && (
                              <div className="flex justify-between">
                                <span>Serão adicionados:</span>
                                <span className="font-medium text-success-600">
                                  {novosComprovantesFiles.length} arquivo(s)
                                </span>
                              </div>
                            )}
                            <Divider className="my-2" />
                            <div className="flex justify-between font-semibold">
                              <span>Total final:</span>
                              <span className="text-primary">
                                {(targetVenda.comprovantes?.length || 0) -
                                  comprovantesParaDeletar.length +
                                  novosComprovantesFiles.length}{" "}
                                comprovante(s)
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={() => {
                  comprovantesModal.onClose();
                  setNovosComprovantesFiles([]);
                  setComprovantesParaDeletar([]);
                }}
                startContent={<XMarkIcon className="w-4 h-4" />}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={salvarAlteracoesComprovantes}
                isLoading={uploadingComprovante}
                isDisabled={
                  comprovantesParaDeletar.length === 0 &&
                  novosComprovantesFiles.length === 0
                }
                startContent={
                  uploadingComprovante ? (
                    <CloudArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )
                }
              >
                {uploadingComprovante ? "Salvando..." : "Salvar Alterações"}
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
