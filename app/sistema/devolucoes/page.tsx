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
import { DevolucaoStats } from "@/components/devolucoes";
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
  Listbox,
  ListboxItem,
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
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CreditCardIcon,
  UserIcon,
  CubeIcon,
  MinusIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  PrinterIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";

// Tipos baseados no schema
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
  data_venda: string;
  id_cliente?: number;
  cliente_nome?: string;
  loja_id?: number;
  id_usuario?: string;
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
  credito_usado: number;
  total_liquido: number;
  forma_pagamento: string;
  status_pagamento: string;
  fiado: boolean;
  data_vencimento?: string | null;
  valor_pago: number;
  valor_restante: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ItemDevolucao {
  id_estoque: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  quantidade_original: number;
  quantidade_devolver: number;
  preco_unitario: number;
  desconto: number;
  subtotal_original: number;
  subtotal_devolucao: number;
  foto?: string;
  motivo_devolucao?: string;
}

interface Loja {
  id: number;
  nome: string;
  endereco?: string | null;
  telefone?: string | null;
  fotourl?: string[] | null;
  descricao?: string | null;
}

interface Devolucao {
  id: number;
  id_venda: number;
  data_devolucao: string;
  id_cliente?: number;
  cliente_nome?: string;
  id_usuario: string;
  itens_devolvidos: ItemDevolucao[];
  valor_total_devolvido: number;
  tipo_devolucao: "total" | "parcial";
  motivo_devolucao?: string;
  valor_credito_gerado: number;
  credito_aplicado: boolean;
  status?: "pendente" | "concluida" | "concluida_com_credito";
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

interface Usuario {
  uuid: string;
  nome: string | null;
  email?: string | null;
  cargo?: string | null;
  fotourl?: string[] | null;
}

interface Cliente {
  id: number;
  nome: string | null;
  email?: string | null;
  telefone?: string | null;
  doc?: string | null;
  endereco?: string | null;
  instagram?: string | null;
  whatsapp?: boolean;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[] | null;
  credito?: number | null;
}

// Interface para sugestões de vendas
interface VendaSugestao {
  id: number;
  cliente_nome?: string;
  data_venda: string;
  total_liquido: number;
  status_pagamento: string;
  forma_pagamento: string;
}

const MOTIVOS_DEVOLUCAO = [
  { key: "produto_defeituoso", label: "Produto Defeituoso" },
  { key: "produto_errado", label: "Produto Errado" },
  { key: "nao_atendeu_expectativa", label: "Não Atendeu Expectativa" },
  { key: "arrependimento", label: "Arrependimento da Compra" },
  { key: "entrega_atrasada", label: "Entrega Atrasada" },
  { key: "duplicidade", label: "Duplicidade de Compra" },
  { key: "outro", label: "Outro" },
];

const STATUS_CREDITO = [
  {
    key: true,
    label: "Aplicado",
    color: "success" as const,
    icon: CheckCircleIcon,
  },
  { key: false, label: "Pendente", color: "warning" as const, icon: ClockIcon },
];

const STATUS_DEVOLUCAO = [
  {
    key: "pendente",
    label: "Pendente",
    color: "warning" as const,
    icon: ClockIcon,
  },
  {
    key: "concluida",
    label: "Concluída",
    color: "success" as const,
    icon: CheckCircleIcon,
  },
  {
    key: "concluida_com_credito",
    label: "Concluída c/ Crédito",
    color: "primary" as const,
    icon: CheckCircleIcon,
  },
];

const TIPO_DEVOLUCAO = [
  { key: "total", label: "Total", color: "danger" as const },
  { key: "parcial", label: "Parcial", color: "warning" as const },
];

const ORDER_FIELDS = [
  { key: "data_devolucao", label: "Data" },
  { key: "cliente_nome", label: "Cliente" },
  { key: "valor_total_devolvido", label: "Valor" },
  { key: "tipo_devolucao", label: "Tipo" },
  { key: "motivo_devolucao", label: "Motivo" },
  { key: "id_venda", label: "Venda" },
];

interface FilterState {
  search: string;
  tipo: string;
  motivo: string;
  creditoAplicado: string;
  cliente: string;
  orderBy: string;
  direction: "asc" | "desc";
  inicio: string;
  fim: string;
  valorMin: string;
  valorMax: string;
}

const PAGE_SIZE = 15;

export default function DevolucoesPagina() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaDevolucao, setLojaDevolucao] = useState<number | null>(null);

  // Auth
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permDevolucoes = acessos?.devolucoes;
  const canViewDevolucoes = !!permDevolucoes?.ver_devolucoes;
  const canCreateDevolucoes = !!permDevolucoes?.criar_devolucoes;
  const canEditDevolucoes = !!permDevolucoes?.editar_devolucoes;
  const canDeleteDevolucoes = !!permDevolucoes?.deletar_devolucoes;
  const canProcessarCreditos = !!permDevolucoes?.processar_creditos;
  const canDeleteSemRestricao = !!permDevolucoes?.deletar_sem_restricao; // Permite deletar devoluções concluídas

  // Filtrar lojas com base nas permissões do usuário
  const lojasDisponiveis = useMemo(() => {
    const lojaIdUsuario = user?.permissoes?.loja_id;

    // Se loja_id é null ou undefined, usuário tem acesso a todas as lojas
    if (lojaIdUsuario === null || lojaIdUsuario === undefined) {
      return lojas;
    }

    // Caso contrário, filtra apenas a loja do usuário
    return lojas.filter((loja) => loja.id === lojaIdUsuario);
  }, [lojas, user?.permissoes?.loja_id]);

  // Dados
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para busca de vendas com sugestões
  const [buscarVendaId, setBuscarVendaId] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [loadingSugestoes, setLoadingSugestoes] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tipo: "",
    motivo: "",
    creditoAplicado: "",
    cliente: "",
    orderBy: "data_devolucao",
    direction: "desc",
    inicio: "",
    fim: "",
    valorMin: "",
    valorMax: "",
  });

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const devolucaoModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteModal = useDisclosure();
  const creditoModal = useDisclosure();
  const deleteConcluidaModal = useDisclosure(); // Novo modal para confirmação de exclusão de devoluções concluídas

  // Estado de formulário
  const [editingDevolucao, setEditingDevolucao] = useState<Devolucao | null>(
    null
  );
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [itensParaDevolucao, setItensParaDevolucao] = useState<ItemDevolucao[]>(
    []
  );
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [observacoesDevolucao, setObservacoesDevolucao] = useState("");

  // Estados auxiliares
  const [targetDevolucao, setTargetDevolucao] = useState<Devolucao | null>(
    null
  );

  // Sugestões de vendas filtradas
  const vendasSugeridas = useMemo(() => {
    if (!buscarVendaId.trim() || buscarVendaId.length < 1) return [];

    const termo = buscarVendaId.toLowerCase();

    return vendas
      .filter((venda) => {
        // Buscar por ID da venda
        if (venda.id.toString().includes(termo)) return true;

        // Buscar por nome do cliente
        if (venda.cliente_nome?.toLowerCase().includes(termo)) return true;

        // Buscar por data (formato dd/mm/yyyy)
        const dataFormatada = new Date(venda.data_venda).toLocaleDateString(
          "pt-BR"
        );
        if (dataFormatada.includes(termo)) return true;

        return false;
      })
      .filter(
        (venda) =>
          venda.status_pagamento !== "cancelado" &&
          venda.status_pagamento !== "devolvido" // Excluir vendas já devolvidas
      )
      .sort((a, b) => {
        // Priorizar correspondência exata do ID
        const aIdMatch = a.id.toString() === termo;
        const bIdMatch = b.id.toString() === termo;

        if (aIdMatch && !bIdMatch) return -1;
        if (!aIdMatch && bIdMatch) return 1;

        // Depois ordenar por data mais recente
        return (
          new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()
        );
      })
      .slice(0, 10); // Limitar a 10 sugestões
  }, [buscarVendaId, vendas]);

  // Handlers com verificação de permissão
  function safeOpenNewDevolucao() {
    if (!canCreateDevolucoes) {
      toast.error("Você não possui permissão para criar devoluções.");
      return;
    }
    openNewDevolucao();
  }

  function safeOpenEditDevolucao(d: Devolucao) {
    if (!canEditDevolucoes) {
      toast.error("Você não possui permissão para editar devoluções.");
      return;
    }
    if (d.status === "concluida" || d.status === "concluida_com_credito") {
      toast.error("Não é possível editar uma devolução já concluída.");
      return;
    }
    openEditDevolucao(d);
  }

  function safeOpenDelete(d: Devolucao) {
    if (!canDeleteDevolucoes) {
      toast.error("Você não possui permissão para deletar devoluções.");
      return;
    }

    setTargetDevolucao(d);

    // VALIDAÇÃO: Apenas usuários com permissão especial podem deletar devoluções concluídas
    if (d.status === "concluida" || d.status === "concluida_com_credito") {
      if (!canDeleteSemRestricao) {
        toast.error(
          "⚠️ Não é possível excluir devoluções já concluídas.\n\n" +
            "Você precisa da permissão 'Deletar Sem Restrição' para realizar esta ação.\n" +
            "Entre em contato com um administrador do sistema.",
          { duration: 5000 }
        );
        return;
      }

      // Abrir modal especial para devoluções concluídas
      deleteConcluidaModal.onOpen();
    } else {
      // Para devoluções pendentes, abrir o modal normal
      deleteModal.onOpen();
    }
  }

  function safeOpenCredito(d: Devolucao) {
    if (!canProcessarCreditos) {
      toast.error("Você não possui permissão para processar créditos.");
      return;
    }
    openCredito(d);
  }

  // Carregar dados iniciais
  async function loadAll() {
    setLoading(true);
    try {
      const [
        devolucoesData,
        vendasData,
        usuariosData,
        clientesData,
        lojasData,
      ] = await Promise.all([
        fetchTable("devolucoes"),
        fetchTable("vendas"),
        fetchTable("usuarios"),
        fetchTable("clientes"),
        fetchTable("lojas"),
      ]);

      setDevolucoes(
        (devolucoesData || []).map((d: any) => ({
          ...d,
          itens_devolvidos: Array.isArray(d.itens_devolvidos)
            ? d.itens_devolvidos
            : [],
        }))
      );

      setVendas(
        (vendasData || []).map((v: any) => ({
          ...v,
          itens: Array.isArray(v.itens) ? v.itens : [],
        }))
      );

      setUsuarios(usuariosData || []);
      setClientes(clientesData || []);
      setLojas(lojasData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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

  function motivoLabel(motivo: string) {
    return MOTIVOS_DEVOLUCAO.find((m) => m.key === motivo)?.label || motivo;
  }

  function statusCreditoInfo(aplicado: boolean) {
    return STATUS_CREDITO.find((s) => s.key === aplicado) || STATUS_CREDITO[1];
  }

  function statusDevolucaoInfo(status?: string) {
    const statusNormalizado = status || "pendente";
    return (
      STATUS_DEVOLUCAO.find((s) => s.key === statusNormalizado) ||
      STATUS_DEVOLUCAO[0]
    );
  }

  function tipoInfo(tipo: string) {
    return TIPO_DEVOLUCAO.find((t) => t.key === tipo) || TIPO_DEVOLUCAO[1];
  }

  // Filtros / ordenação
  const filtered = useMemo(() => {
    return devolucoes
      .filter((d) => {
        if (
          filters.search &&
          !(
            d.cliente_nome
              ?.toLowerCase()
              .includes(filters.search.toLowerCase()) ||
            d.id.toString() === filters.search ||
            d.id_venda.toString() === filters.search ||
            motivoLabel(d.motivo_devolucao || "")
              .toLowerCase()
              .includes(filters.search.toLowerCase())
          )
        )
          return false;

        if (filters.tipo && d.tipo_devolucao !== filters.tipo) return false;
        if (filters.motivo && d.motivo_devolucao !== filters.motivo)
          return false;
        if (
          filters.creditoAplicado !== "" &&
          d.credito_aplicado.toString() !== filters.creditoAplicado
        )
          return false;
        if (filters.cliente && d.cliente_nome !== filters.cliente) return false;
        if (filters.inicio && d.data_devolucao < filters.inicio) return false;
        if (filters.fim && d.data_devolucao > filters.fim + "T23:59:59")
          return false;

        const minVal =
          filters.valorMin && currencyToNumber(filters.valorMin) > 0
            ? currencyToNumber(filters.valorMin)
            : null;
        const maxVal =
          filters.valorMax && currencyToNumber(filters.valorMax) > 0
            ? currencyToNumber(filters.valorMax)
            : null;

        if (minVal !== null && (d.valor_total_devolvido || 0) < minVal)
          return false;
        if (maxVal !== null && (d.valor_total_devolvido || 0) > maxVal)
          return false;

        return true;
      })
      .sort((a, b) => {
        const dir = filters.direction === "asc" ? 1 : -1;
        let av: any = a[filters.orderBy as keyof Devolucao];
        let bv: any = b[filters.orderBy as keyof Devolucao];

        if (filters.orderBy === "data_venda") {
          av = av ? new Date(av).getTime() : 0;
          bv = bv ? new Date(bv).getTime() : 0;
        }

        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();

        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
  }, [devolucoes, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Estatísticas
  const stats = useMemo(() => {
    const count = devolucoes.length;
    const valorTotal = devolucoes.reduce(
      (acc, d) => acc + (Number(d.valor_total_devolvido) || 0),
      0
    );
    const creditoPendente = devolucoes
      .filter((d) => !d.credito_aplicado)
      .reduce((acc, d) => acc + (Number(d.valor_credito_gerado) || 0), 0);
    const totalParciais = devolucoes.filter(
      (d) => d.tipo_devolucao === "parcial"
    ).length;
    const totalCompletas = devolucoes.filter(
      (d) => d.tipo_devolucao === "total"
    ).length;

    return {
      count,
      valorTotal,
      creditoPendente,
      totalParciais,
      totalCompletas,
    };
  }, [devolucoes]);

  // Buscar venda específica por ID
  async function buscarVendaPorId(vendaId: string) {
    if (!vendaId) return;

    try {
      setLoadingSugestoes(true);

      const venda = vendas.find((v) => v.id.toString() === vendaId);

      if (!venda) {
        await loadAll();
        const vendaRecarregada = vendas.find(
          (v) => v.id.toString() === vendaId
        );

        if (!vendaRecarregada) {
          toast.error("Venda não encontrada");
          return;
        }

        selecionarVenda(vendaRecarregada);
        return;
      }

      selecionarVenda(venda);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      toast.error("Erro ao buscar venda");
    } finally {
      setLoadingSugestoes(false);
    }
  }

  // Selecionar uma venda das sugestões ou busca
  // Selecionar uma venda das sugestões ou busca
  function selecionarVenda(venda: Venda) {
    if (venda.status_pagamento === "cancelado") {
      toast.error("Não é possível devolver itens de uma venda cancelada");
      return;
    }

    if (venda.status_pagamento === "devolvido") {
      toast.error(
        "Esta venda já foi devolvida. Não é possível fazer nova devolução."
      );
      return;
    }

    console.log("[DEVOLUCAO] Venda selecionada:", venda);
    setVendaSelecionada(venda);
    prepararItensDevolucao(venda.itens, venda); // CORREÇÃO: Passar a venda como parâmetro
    setBuscarVendaId(venda.id.toString());
    setShowSugestoes(false);
    toast.success(`Venda #${venda.id} selecionada com sucesso!`);
  }

  function prepararItensDevolucao(itens: VendaItem[], venda?: Venda) {
    console.log("Itens da venda para devolução:", itens);
    console.log("Venda recebida:", venda);

    const itensDevolucao = itens.map((item) => {
      // Calcular o subtotal real considerando desconto e crédito usado
      let subtotalReal = item.subtotal;

      // Usar a venda passada como parâmetro
      const vendaAtual = venda || vendaSelecionada;

      // Se há desconto ou crédito usado na venda
      if (
        vendaAtual &&
        vendaAtual.total_bruto !== undefined &&
        vendaAtual.total_bruto > 0
      ) {
        const desconto = vendaAtual.desconto || 0;
        const creditoUsado = vendaAtual.credito_usado || 0;
        const totalDescontoECredito = desconto + creditoUsado;

        // Se há desconto ou crédito aplicado
        if (totalDescontoECredito > 0) {
          // Calcular a proporção do desconto+crédito para este item
          const proporcaoItem = item.subtotal / vendaAtual.total_bruto;
          const descontoECreditoItem = totalDescontoECredito * proporcaoItem;
          subtotalReal = item.subtotal - descontoECreditoItem;

          console.log(`Item ${item.descricao}:`, {
            subtotalOriginal: item.subtotal,
            proporcaoItem,
            desconto,
            creditoUsado,
            totalDescontoECredito,
            descontoECreditoItem,
            subtotalReal,
          });
        }
      }

      const itemDevolucao = {
        id_estoque: item.id_estoque,
        descricao: item.descricao,
        modelo: item.modelo,
        marca: item.marca,
        quantidade_original: item.quantidade,
        quantidade_devolver: 0,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        subtotal_original: subtotalReal, // Usar o subtotal com desconto e crédito aplicados
        subtotal_devolucao: 0,
        foto: item.foto,
      };

      console.log("Item preparado:", itemDevolucao);
      return itemDevolucao;
    });

    setItensParaDevolucao(itensDevolucao);
  }

  function atualizarQuantidadeDevolucao(index: number, quantidade: number) {
    setItensParaDevolucao((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const qtdDevolver = Math.max(
          0,
          Math.min(quantidade, item.quantidade_original)
        );

        // CORREÇÃO: Calcular o valor unitário já com desconto aplicado
        const valorUnitarioComDesconto =
          item.subtotal_original / item.quantidade_original;
        const subtotalDevolucao = qtdDevolver * valorUnitarioComDesconto;

        return {
          ...item,
          quantidade_devolver: qtdDevolver,
          subtotal_devolucao: Math.max(0, subtotalDevolucao),
        };
      })
    );
  }

  function calcularTotalDevolucao() {
    return itensParaDevolucao.reduce(
      (total, item) => total + item.subtotal_devolucao,
      0
    );
  }

  // Form handlers
  function openNewDevolucao() {
    resetForm();
    devolucaoModal.onOpen();
  }

  function openEditDevolucao(d: Devolucao) {
    resetForm();
    setEditingDevolucao(d);
    const venda = vendas.find((v) => v.id === d.id_venda);
    if (venda) {
      setVendaSelecionada(venda);
      // Para edição, usar os itens já salvos na devolução, não recalcular
      setItensParaDevolucao(d.itens_devolvidos);
    }
    setMotivoDevolucao(d.motivo_devolucao || "");
    setObservacoesDevolucao(d.observacoes || "");
    setBuscarVendaId(d.id_venda.toString());
    devolucaoModal.onOpen();
  }

  async function salvarDevolucao() {
    if (!vendaSelecionada) {
      toast.error("Selecione uma venda");
      return;
    }

    const itensComDevolucao = itensParaDevolucao.filter(
      (item) => item.quantidade_devolver > 0
    );

    if (itensComDevolucao.length === 0) {
      toast.error("Selecione pelo menos um item para devolução");
      return;
    }

    if (!motivoDevolucao) {
      toast.error("Selecione o motivo da devolução");
      return;
    }

    const valorTotalDevolvido = calcularTotalDevolucao();
    const creditoUsadoOriginal = vendaSelecionada.credito_usado || 0;
    const valorCreditoGerado = valorTotalDevolvido + creditoUsadoOriginal;

    const tipoDevolucao =
      itensComDevolucao.length === vendaSelecionada.itens.length &&
      itensComDevolucao.every(
        (item) => item.quantidade_devolver === item.quantidade_original
      )
        ? "total"
        : "parcial";

    const dadosDevolucao = {
      id_venda: vendaSelecionada.id,
      id_cliente: vendaSelecionada.id_cliente,
      cliente_nome: vendaSelecionada.cliente_nome,
      id_usuario: user?.id || "",
      itens_devolvidos: itensComDevolucao,
      valor_total_devolvido: valorTotalDevolvido,
      tipo_devolucao: tipoDevolucao,
      motivo_devolucao: motivoDevolucao,
      valor_credito_gerado: valorCreditoGerado,
      credito_aplicado: false,
      status: "pendente" as const,
      observacoes: observacoesDevolucao,
      updated_at: new Date().toISOString(),
    };

    try {
      setLoading(true);

      let devolucaoId;
      if (editingDevolucao) {
        await updateTable("devolucoes", editingDevolucao.id, dadosDevolucao);
        devolucaoId = editingDevolucao.id;
      } else {
        const resultado: any = await insertTable("devolucoes", dadosDevolucao);
        if (Array.isArray(resultado)) devolucaoId = resultado[0]?.id;
        else devolucaoId = resultado?.id;
        if (!devolucaoId) {
          console.warn("[DEVOLUCAO] ID da devolução não retornado:", resultado);
        }
      }

      const lojaId =
        lojaDevolucao || (vendaSelecionada.loja_id as number) || null;

      if (!lojaId) {
        console.warn(
          "[DEVOLUCAO] Loja não informada; pular atualização de estoque."
        );
      } else {
        for (const item of itensComDevolucao) {
          try {
            const { data: estoqueAtual, error: estoqueError } = await supabase
              .from("estoque_lojas")
              .select("quantidade")
              .eq("produto_id", item.id_estoque)
              .eq("loja_id", lojaId)
              .single();

            if (estoqueError && estoqueError.code !== "PGRST116") {
              console.warn(
                `[DEVOLUCAO] Erro ao buscar estoque (produto ${item.id_estoque}):`,
                estoqueError.message || estoqueError
              );
            }

            if (!estoqueAtual) {
              await supabase.from("estoque_lojas").insert({
                produto_id: item.id_estoque,
                loja_id: lojaId,
                quantidade: item.quantidade_devolver,
                updatedat: new Date().toISOString(),
              });
              console.log(
                `[DEVOLUCAO] Inserido estoque para produto ${item.id_estoque}: +${item.quantidade_devolver}`
              );
            } else {
              const novaQuantidade =
                (Number(estoqueAtual.quantidade) || 0) +
                item.quantidade_devolver;
              await supabase
                .from("estoque_lojas")
                .update({
                  quantidade: novaQuantidade,
                  updatedat: new Date().toISOString(),
                })
                .eq("produto_id", item.id_estoque)
                .eq("loja_id", lojaId);
              console.log(
                `[DEVOLUCAO] Atualizado estoque produto ${item.id_estoque}: ${estoqueAtual.quantidade} -> ${novaQuantidade}`
              );
            }
          } catch (err) {
            console.error(
              `[DEVOLUCAO] Falha ao devolver produto ${item.id_estoque} ao estoque:`,
              err
            );
          }
        }
      }

      try {
        if (vendaSelecionada?.id) {
          try {
            await updateTable("vendas", vendaSelecionada.id, {
              status_pagamento: "devolvido",
              updated_at: new Date().toISOString(),
            });
            console.log(
              "[DEVOLUCAO] Venda marcada como 'devolvido' via updateTable:",
              vendaSelecionada.id
            );
          } catch (helperErr) {
            console.warn(
              "[DEVOLUCAO] updateTable falhou, tentando supabase direto:",
              helperErr
            );
            const { error: vendaError } = await supabase
              .from("vendas")
              .update({
                status_pagamento: "devolvido",
                updated_at: new Date().toISOString(),
              })
              .eq("id", vendaSelecionada.id);

            if (vendaError) {
              console.warn(
                "[DEVOLUCAO] Falha ao atualizar status_pagamento para 'devolvido':",
                vendaError.message || vendaError
              );

              const vendaAtual = vendas.find(
                (v) => v.id === vendaSelecionada.id
              );
              const marca = `[[devolucao_aplicada:id=${devolucaoId};ts=${new Date().toISOString()}]]`;
              const novaObservacao = (vendaAtual?.observacoes || "").trim()
                ? `${vendaAtual?.observacoes}\n${marca}`
                : marca;

              const { error: obsError } = await supabase
                .from("vendas")
                .update({
                  observacoes: novaObservacao,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", vendaSelecionada.id);

              if (obsError) {
                console.error(
                  "[DEVOLUCAO] Falha ao aplicar fallback nas observacoes da venda:",
                  obsError
                );
              } else {
                console.log(
                  "[DEVOLUCAO] Fallback: observacoes da venda atualizadas com marca de devolucao."
                );
              }
            } else {
              console.log(
                "[DEVOLUCAO] Venda marcada como 'devolvido' via supabase:",
                vendaSelecionada.id
              );
            }
          }
        }
      } catch (err) {
        console.error("[DEVOLUCAO] Erro ao marcar venda como devolvido:", err);
      }

      await loadAll();
      devolucaoModal.onClose();

      toast.success(
        `Devolução processada com sucesso!\n` +
          `${itensComDevolucao.length} itens devolvidos${lojaId ? ` para a loja ${lojaId}` : ""}.`
      );
    } catch (e: any) {
      console.error("Erro ao salvar devolução:", e);
      toast.error(
        "Erro ao salvar devolução: " + (e?.message || "erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setEditingDevolucao(null);
    setVendaSelecionada(null);
    setItensParaDevolucao([]);
    setMotivoDevolucao("");
    setObservacoesDevolucao("");
    setBuscarVendaId("");
    setLojaDevolucao(null);
    setShowSugestoes(false);
  }

  // Aplicar crédito
  function openCredito(d: Devolucao) {
    setTargetDevolucao(d);
    creditoModal.onOpen();
  }

  async function aplicarCredito() {
    if (!targetDevolucao) return;

    try {
      setLoading(true);

      if (targetDevolucao.id_cliente) {
        const cliente = clientes.find(
          (c) => c.id === targetDevolucao.id_cliente
        );

        if (cliente) {
          const novoCredito =
            (Number(cliente.credito) || 0) +
            Number(targetDevolucao.valor_credito_gerado);

          await updateTable("clientes", cliente.id, {
            credito: novoCredito,
            updatedat: new Date().toISOString(),
          });
        } else {
          toast.error("Cliente não encontrado");
          return;
        }
      } else {
        toast.error("ID do cliente não encontrado na devolução");
        return;
      }

      await updateTable("devolucoes", targetDevolucao.id, {
        credito_aplicado: true,
        status: "concluida_com_credito",
        updated_at: new Date().toISOString(),
      });

      const vendaId = targetDevolucao.id_venda;
      const { error: vendaError } = await supabase
        .from("vendas")
        .update({
          status_pagamento: "devolvido",
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendaId);

      if (vendaError) {
        console.warn(
          "[DEVOLUCAO] Falha ao atualizar status_pagamento para 'devolvido' (provável CHECK constraint):",
          vendaError.message
        );

        const vendaAtual = vendas.find((v) => v.id === vendaId);
        const marca = `[[devolucao_aplicada:id=${targetDevolucao.id};ts=${new Date().toISOString()}]]`;
        const novaObservacao = (vendaAtual?.observacoes || "").trim()
          ? `${vendaAtual?.observacoes}\n${marca}`
          : marca;

        const { error: obsError } = await supabase
          .from("vendas")
          .update({
            observacoes: novaObservacao,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vendaId);

        if (obsError) {
          console.error(
            "[DEVOLUCAO] Falha ao aplicar fallback nas observacoes da venda:",
            obsError
          );
          throw obsError;
        }
      }

      await loadAll();
      creditoModal.onClose();
    } catch (e: any) {
      console.error("Erro ao aplicar crédito:", e);
      toast.error(
        "Erro ao aplicar crédito: " + (e?.message || "erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // View
  function openView(d: Devolucao) {
    setTargetDevolucao(d);
    viewModal.onOpen();
  }

  // Concluir sem crédito
  const concluirModal = useDisclosure();

  function openConcluir(d: Devolucao) {
    setTargetDevolucao(d);
    concluirModal.onOpen();
  }

  async function concluirSemCredito() {
    if (!targetDevolucao) return;

    try {
      setLoading(true);

      await updateTable("devolucoes", targetDevolucao.id, {
        status: "concluida",
        updated_at: new Date().toISOString(),
      });

      await loadAll();
      concluirModal.onClose();
      toast.success("Devolução concluída sem gerar crédito!");
    } catch (e: any) {
      console.error("Erro ao concluir devolução:", e);
      toast.error(
        "Erro ao concluir devolução: " + (e?.message || "erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // Delete
  async function confirmarDelete() {
    if (!targetDevolucao) return;

    try {
      setLoading(true);
      await deleteTable("devolucoes", targetDevolucao.id);
      await loadAll();
      deleteModal.onClose();
      deleteConcluidaModal.onClose();
      toast.success("Devolução excluída com sucesso!");
    } catch (e: any) {
      console.error("Erro ao excluir devolução:", e);
      toast.error(
        "Erro ao excluir devolução: " + (e?.message || "erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // Verificação de loading
  if (
    loading &&
    !devolucaoModal.isOpen &&
    !creditoModal.isOpen &&
    !deleteModal.isOpen
  ) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando devoluções..." />
      </div>
    );
  }

  // Verificação de permissão
  if (!canViewDevolucoes) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ArrowPathIcon className="w-6 h-6" />
              Devoluções
            </h1>
            <p className="text-sm text-default-500">
              Gestão de devoluções e créditos
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
              Você não possui permissão para visualizar devoluções.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // UI
  return (
    <div className="container mx-auto p-6 gap-6 flex flex-col">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ArrowPathIcon className="w-6 h-6" />
            Devoluções
          </h1>
          <p className="text-sm text-default-500">
            Gestão de devoluções e créditos de clientes
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
          {canCreateDevolucoes && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={safeOpenNewDevolucao}
            >
              Nova Devolução
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <DevolucaoStats devolucoes={devolucoes} />

      {/* Barra de busca */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
          placeholder="Buscar por cliente, ID da venda/devolução ou motivo"
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
            setFilters((p) => ({ ...p, orderBy: Array.from(k)[0] as string }))
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
              tipo: "",
              motivo: "",
              creditoAplicado: "",
              cliente: "",
              orderBy: "data_devolucao",
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
              label="Tipo"
              size="sm"
              selectedKeys={filters.tipo ? [filters.tipo] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  tipo: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              {TIPO_DEVOLUCAO.map((t) => (
                <SelectItem key={t.key}>{t.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Motivo"
              size="sm"
              selectedKeys={filters.motivo ? [filters.motivo] : []}
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  motivo: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              {MOTIVOS_DEVOLUCAO.map((m) => (
                <SelectItem key={m.key}>{m.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="Status Crédito"
              size="sm"
              selectedKeys={
                filters.creditoAplicado ? [filters.creditoAplicado] : []
              }
              onSelectionChange={(k) =>
                setFilters((p) => ({
                  ...p,
                  creditoAplicado: (Array.from(k)[0] as string) || "",
                }))
              }
              placeholder="Todos"
            >
              <SelectItem key="true">Aplicado</SelectItem>
              <SelectItem key="false">Pendente</SelectItem>
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
            <Table removeWrapper aria-label="Tabela de devoluções">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Data</TableColumn>
                <TableColumn>ID Venda</TableColumn>
                <TableColumn>Cliente</TableColumn>
                <TableColumn>Tipo</TableColumn>
                <TableColumn>Valor</TableColumn>
                <TableColumn>Crédito</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Motivo</TableColumn>
                <TableColumn>Ações</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Sem registros">
                {pageItems.map((d) => {
                  const tipoInfo_ = tipoInfo(d.tipo_devolucao);
                  const statusInfo = statusDevolucaoInfo(d.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={d.id}>
                      <TableCell>#{d.id}</TableCell>
                      <TableCell>{fmtDate(d.data_devolucao)}</TableCell>
                      <TableCell>#{d.id_venda}</TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {d.cliente_nome || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={tipoInfo_.color} variant="flat">
                          {tipoInfo_.label}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {fmt(Number(d.valor_total_devolvido))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CreditCardIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            {fmt(Number(d.valor_credito_gerado))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={statusInfo.color}
                          variant="flat"
                          startContent={<StatusIcon className="w-3.5 h-3.5" />}
                        >
                          {statusInfo.label}
                        </Chip>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {motivoLabel(d.motivo_devolucao || "")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip content="Ver">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => openView(d)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                          </Tooltip>

                          {canEditDevolucoes && (
                            <Tooltip
                              content={
                                d.status !== "pendente"
                                  ? "Devolução concluída — edição não permitida"
                                  : "Editar"
                              }
                            >
                              <span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => safeOpenEditDevolucao(d)}
                                  isDisabled={d.status !== "pendente"}
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </Button>
                              </span>
                            </Tooltip>
                          )}

                          {/* Botão para concluir SEM crédito */}
                          {canProcessarCreditos && d.status === "pendente" && (
                            <Tooltip content="Concluir sem Crédito">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onPress={() => openConcluir(d)}
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}

                          {/* Botão para gerar crédito */}
                          {canProcessarCreditos && d.status === "pendente" && (
                            <Tooltip content="Gerar Crédito">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="primary"
                                onPress={() => safeOpenCredito(d)}
                              >
                                <CreditCardIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}

                          {canDeleteDevolucoes && (
                            <Tooltip
                              content={
                                d.status !== "pendente" &&
                                !canDeleteSemRestricao
                                  ? "Você precisa da permissão 'Deletar Sem Restrição'"
                                  : d.status !== "pendente"
                                    ? "Excluir devolução concluída (com confirmação)"
                                    : "Excluir"
                              }
                              color={
                                d.status !== "pendente" &&
                                !canDeleteSemRestricao
                                  ? "warning"
                                  : "danger"
                              }
                            >
                              <span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => safeOpenDelete(d)}
                                  isDisabled={
                                    d.status !== "pendente" &&
                                    !canDeleteSemRestricao
                                  }
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </span>
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

      {/* Modal Devolução */}
      {(canCreateDevolucoes || canEditDevolucoes) && (
        <Modal
          isOpen={devolucaoModal.isOpen}
          onOpenChange={devolucaoModal.onOpenChange}
          size="5xl"
          scrollBehavior="inside"
          isDismissable={false}
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2">
              {editingDevolucao ? "Editar Devolução" : "Nova Devolução"}
            </ModalHeader>
            <ModalBody className="space-y-6">
              {/* Buscar Venda com Sugestões */}
              <div className="space-y-4 ">
                <h3 className="text-lg font-semibold">Buscar Venda</h3>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Digite o ID, nome do cliente ou data da venda"
                        value={buscarVendaId}
                        onChange={(e) => {
                          setBuscarVendaId(e.target.value);
                          setShowSugestoes(e.target.value.length > 0);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            // Se há sugestões, selecionar a primeira
                            if (vendasSugeridas.length > 0) {
                              selecionarVenda(vendasSugeridas[0]);
                            } else {
                              buscarVendaPorId(buscarVendaId);
                            }
                          }
                        }}
                        onFocus={() =>
                          setShowSugestoes(buscarVendaId.length > 0)
                        }
                        startContent={
                          <MagnifyingGlassIcon className="w-4 h-4" />
                        }
                        endContent={loadingSugestoes && <Spinner size="sm" />}
                      />

                      {/* Lista de Sugestões */}
                      {showSugestoes && vendasSugeridas.length > 0 && (
                        <Card className="">
                          <CardBody className="p-0">
                            <Listbox
                              aria-label="Sugestões de vendas"
                              onAction={(key) => {
                                const venda = vendasSugeridas.find(
                                  (v) => v.id.toString() === key
                                );
                                if (venda) {
                                  selecionarVenda(venda);
                                }
                              }}
                            >
                              {vendasSugeridas.map((venda) => (
                                <ListboxItem
                                  key={venda.id.toString()}
                                  className="px-3 py-2 hover:bg-default-100"
                                  startContent={
                                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                                      <ShoppingCartIcon className="w-4 h-4 text-primary" />
                                    </div>
                                  }
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        Venda #{venda.id}
                                      </span>
                                      <Chip
                                        size="sm"
                                        variant="flat"
                                        color={
                                          venda.status_pagamento === "pago"
                                            ? "success"
                                            : venda.status_pagamento ===
                                                "pendente"
                                              ? "warning"
                                              : "default"
                                        }
                                      >
                                        {venda.status_pagamento}
                                      </Chip>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-default-500">
                                      <span className="flex items-center gap-1">
                                        <UserIcon className="w-3 h-3" />
                                        {venda.cliente_nome ||
                                          "Cliente não informado"}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" />
                                        {fmtDate(venda.data_venda)}
                                      </span>
                                      <span className="font-medium text-primary">
                                        {fmt(venda.total_liquido)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-default-400">
                                      {venda.forma_pagamento}
                                    </div>
                                  </div>
                                </ListboxItem>
                              ))}
                            </Listbox>
                          </CardBody>
                        </Card>
                      )}

                      {/* Mensagem quando não há sugestões */}
                      {showSugestoes &&
                        buscarVendaId.length > 0 &&
                        vendasSugeridas.length === 0 && (
                          <Card className="">
                            <CardBody className="p-3 text-center text-sm text-default-500">
                              Nenhuma venda encontrada para "{buscarVendaId}"
                            </CardBody>
                          </Card>
                        )}
                    </div>

                    <Button
                      onPress={() => buscarVendaPorId(buscarVendaId)}
                      isLoading={loadingSugestoes}
                      color="primary"
                    >
                      Buscar
                    </Button>

                    {/* Botão para fechar sugestões */}
                    {showSugestoes && (
                      <Button
                        isIconOnly
                        variant="flat"
                        onPress={() => setShowSugestoes(false)}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Dica de uso */}
                  <p className="text-xs text-default-400 mt-2">
                    💡 Digite o ID da venda, nome do cliente ou data para ver
                    sugestões
                  </p>
                </div>
              </div>

              {/* Informações da Venda */}
              {vendaSelecionada && (
                <Card>
                  <CardBody>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-success" />
                      Venda #{vendaSelecionada.id} Selecionada
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-default-500">Cliente</p>
                        <p className="font-medium">
                          {vendaSelecionada.cliente_nome || "Não informado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-default-500">Data da Venda</p>
                        <p>{fmtDate(vendaSelecionada.data_venda)}</p>
                      </div>
                      <div>
                        <p className="text-default-500">Total</p>
                        <p className="font-medium">
                          {fmt(vendaSelecionada.total_liquido)}
                        </p>
                      </div>
                      <div>
                        <p className="text-default-500">Pagamento</p>
                        <div className="flex items-center gap-1">
                          <span>{vendaSelecionada.forma_pagamento}</span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              vendaSelecionada.status_pagamento === "pago"
                                ? "success"
                                : vendaSelecionada.status_pagamento ===
                                    "pendente"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {vendaSelecionada.status_pagamento}
                          </Chip>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Itens para Devolução */}
              {itensParaDevolucao.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Itens para Devolução</h4>
                  <div className="space-y-3">
                    {itensParaDevolucao.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border rounded-md"
                      >
                        {item.foto ? (
                          <Avatar src={item.foto} size="sm" />
                        ) : (
                          <div className="w-10 h-10 bg-default-200 rounded-full flex items-center justify-center">
                            <CubeIcon className="w-5 h-5 text-default-500" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.descricao}
                          </p>
                          <p className="text-xs text-default-500">
                            {[item.marca, item.modelo]
                              .filter(Boolean)
                              .join(" • ")}{" "}
                            •{" "}
                            {fmt(
                              item.subtotal_original / item.quantidade_original
                            )}
                          </p>
                          <p className="text-xs text-default-400">
                            Qtd. original: {item.quantidade_original}
                            {/* Mostrar detalhes do desconto e crédito se houver */}
                            {vendaSelecionada &&
                              vendaSelecionada.total_bruto !== undefined &&
                              vendaSelecionada.total_bruto > 0 &&
                              ((vendaSelecionada.desconto !== undefined &&
                                vendaSelecionada.desconto > 0) ||
                                (vendaSelecionada.credito_usado !== undefined &&
                                  vendaSelecionada.credito_usado > 0)) && (
                                <span className="ml-2 text-default-500">
                                  (Preço original: {fmt(item.preco_unitario)}
                                  {vendaSelecionada.desconto > 0 && (
                                    <span>
                                      {" "}
                                      - Desconto:{" "}
                                      {fmt(
                                        (vendaSelecionada.desconto *
                                          ((item.preco_unitario *
                                            item.quantidade_original) /
                                            vendaSelecionada.total_bruto)) /
                                          item.quantidade_original
                                      )}
                                    </span>
                                  )}
                                  {vendaSelecionada.credito_usado > 0 && (
                                    <span>
                                      {" "}
                                      - Crédito:{" "}
                                      {fmt(
                                        (vendaSelecionada.credito_usado *
                                          ((item.preco_unitario *
                                            item.quantidade_original) /
                                            vendaSelecionada.total_bruto)) /
                                          item.quantidade_original
                                      )}
                                    </span>
                                  )}
                                  )
                                </span>
                              )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() =>
                              atualizarQuantidadeDevolucao(
                                index,
                                item.quantidade_devolver - 1
                              )
                            }
                            isDisabled={item.quantidade_devolver <= 0}
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>

                          <Input
                            size="sm"
                            type="number"
                            value={item.quantidade_devolver.toString()}
                            onChange={(e) =>
                              atualizarQuantidadeDevolucao(
                                index,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20"
                            min="0"
                            max={item.quantidade_original}
                          />

                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() =>
                              atualizarQuantidadeDevolucao(
                                index,
                                item.quantidade_devolver + 1
                              )
                            }
                            isDisabled={
                              item.quantidade_devolver >=
                              item.quantidade_original
                            }
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right w-24">
                          <p className="text-sm font-semibold">
                            {fmt(item.subtotal_devolucao)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right border-t pt-3">
                    <p className="text-lg font-semibold">
                      Total da Devolução: {fmt(calcularTotalDevolucao())}
                    </p>
                  </div>
                  {vendaSelecionada && vendaSelecionada.credito_usado > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-default-600">
                        + Crédito usado na compra:
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {fmt(vendaSelecionada.credito_usado)}
                      </p>
                    </div>
                  )}
                  {vendaSelecionada && vendaSelecionada.credito_usado > 0 && (
                    <div className="flex justify-between items-center border-t pt-2">
                      <p className="text-lg font-semibold text-success">
                        Total de Crédito a Gerar:
                      </p>
                      <p className="text-lg font-semibold text-success">
                        {fmt(
                          calcularTotalDevolucao() +
                            (vendaSelecionada.credito_usado || 0)
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Motivo e Observações */}
              {vendaSelecionada && (
                <div className="space-y-4">
                  <Select
                    label="Loja para Devolução"
                    placeholder="Selecione a loja onde devolver os produtos"
                    selectedKeys={
                      lojaDevolucao ? [lojaDevolucao.toString()] : []
                    }
                    onSelectionChange={(k) =>
                      setLojaDevolucao(
                        Array.from(k).length > 0
                          ? Number(Array.from(k)[0])
                          : null
                      )
                    }
                    isRequired
                  >
                    {lojasDisponiveis.map((loja) => (
                      <SelectItem key={loja.id.toString()}>
                        {loja.nome}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Motivo da Devolução"
                    placeholder="Selecione o motivo"
                    selectedKeys={motivoDevolucao ? [motivoDevolucao] : []}
                    onSelectionChange={(k) =>
                      setMotivoDevolucao(Array.from(k)[0] as string)
                    }
                    isRequired
                  >
                    {MOTIVOS_DEVOLUCAO.map((motivo) => (
                      <SelectItem key={motivo.key}>{motivo.label}</SelectItem>
                    ))}
                  </Select>

                  <Textarea
                    label="Observações"
                    placeholder="Observações adicionais sobre a devolução..."
                    value={observacoesDevolucao}
                    onChange={(e) => setObservacoesDevolucao(e.target.value)}
                    minRows={3}
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={devolucaoModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={salvarDevolucao}
                isLoading={loading}
                isDisabled={
                  !vendaSelecionada ||
                  !motivoDevolucao ||
                  itensParaDevolucao.filter((i) => i.quantidade_devolver > 0)
                    .length === 0 ||
                  (editingDevolucao?.credito_aplicado ?? false)
                }
              >
                {editingDevolucao ? "Atualizar" : "Processar Devolução"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Visualizar */}
      {/* Modal Visualizar */}
      <Modal
        isOpen={viewModal.isOpen}
        onOpenChange={viewModal.onOpenChange}
        size="lg"
        scrollBehavior="outside"
      >
        <ModalContent>
          <ModalHeader>
            Detalhes da Devolução #{targetDevolucao?.id}
          </ModalHeader>
          <ModalBody className="space-y-4">
            {targetDevolucao && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-default-500">Data</p>
                    <p>{fmtDate(targetDevolucao.data_devolucao)}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Venda</p>
                    <p>#{targetDevolucao.id_venda}</p>
                  </div>
                  <div>
                    <p className="text-default-500">Cliente</p>
                    <p>{targetDevolucao.cliente_nome}</p>
                  </div>

                  <div>
                    <p className="text-default-500">Tipo</p>
                    <p>{tipoInfo(targetDevolucao.tipo_devolucao).label}</p>
                  </div>

                  {/* Usuário que criou a devolução - ocupa linha completa */}
                  <div className="col-span-2">
                    <p className="text-default-500 mb-2">Criado por</p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const usuario = usuarios.find(
                          (u) => u.uuid === targetDevolucao.id_usuario
                        );
                        return usuario ? (
                          <>
                            {usuario.fotourl && usuario.fotourl.length > 0 ? (
                              <Avatar
                                src={usuario.fotourl[0]}
                                size="sm"
                                className="w-8 h-8"
                              />
                            ) : (
                              <Avatar
                                name={usuario.nome?.[0] || "?"}
                                size="sm"
                                className="w-8 h-8"
                                classNames={{
                                  base: "bg-primary-100",
                                  name: "text-primary-600 font-semibold",
                                }}
                              />
                            )}
                            <div>
                              <p className="font-medium">
                                {usuario.nome || "Usuário"}
                              </p>
                              {usuario.cargo && (
                                <p className="text-xs text-default-400">
                                  {usuario.cargo}
                                </p>
                              )}
                              {usuario.email && (
                                <p className="text-xs text-default-400">
                                  {usuario.email}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar
                              icon={<UserIcon className="w-4 h-4" />}
                              size="sm"
                              className="w-8 h-8 bg-default-100"
                            />
                            <p className="text-sm text-default-400">
                              Usuário não encontrado
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <p className="text-default-500">Valor Devolvido</p>
                    <p className="font-medium">
                      {fmt(targetDevolucao.valor_total_devolvido)}
                    </p>
                  </div>

                  {/* ADICIONADO: Crédito usado na compra original */}
                  {(() => {
                    const vendaOriginal = vendas.find(
                      (v) => v.id === targetDevolucao.id_venda
                    );
                    const creditoUsado = vendaOriginal?.credito_usado || 0;

                    return creditoUsado > 0 ? (
                      <div>
                        <p className="text-default-500">
                          Crédito Usado na Compra
                        </p>
                        <p className="font-medium text-primary">
                          {fmt(creditoUsado)}
                        </p>
                      </div>
                    ) : null;
                  })()}

                  <div>
                    <p className="text-default-500">Crédito Gerado</p>
                    <p className="font-medium text-success">
                      {fmt(targetDevolucao.valor_credito_gerado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500">Status</p>
                    <Chip
                      size="sm"
                      color={statusDevolucaoInfo(targetDevolucao.status).color}
                      variant="flat"
                    >
                      {statusDevolucaoInfo(targetDevolucao.status).label}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-default-500">Motivo</p>
                    <p>{motivoLabel(targetDevolucao.motivo_devolucao || "")}</p>
                  </div>
                </div>

                {/* ADICIONADO: Resumo financeiro se houver crédito usado */}
                {(() => {
                  const vendaOriginal = vendas.find(
                    (v) => v.id === targetDevolucao.id_venda
                  );
                  const creditoUsado = vendaOriginal?.credito_usado || 0;

                  return creditoUsado > 0 ? (
                    <>
                      <Divider />
                      <Card className=" rounded-md p-3">
                        <p className="font-semibold  mb-2">Resumo Financeiro</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="">
                              Valor devolvido (pago em dinheiro):
                            </span>
                            <span className="font-medium">
                              {fmt(targetDevolucao.valor_total_devolvido)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="">+ Crédito usado na compra:</span>
                            <span className="font-medium">
                              {fmt(creditoUsado)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-blue-200 pt-1">
                            <span className="font-semibold">
                              Total de crédito gerado:
                            </span>
                            <span className="font-bold text-success">
                              {fmt(targetDevolucao.valor_credito_gerado)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </>
                  ) : null;
                })()}

                <Divider />

                <div className="space-y-2">
                  <p className="font-semibold">
                    Itens Devolvidos ({targetDevolucao.itens_devolvidos.length})
                  </p>
                  {targetDevolucao.itens_devolvidos.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm border-b border-default-100 pb-1"
                    >
                      <span className="truncate">
                        {item.descricao} x{item.quantidade_devolver}
                      </span>
                      <span>{fmt(item.subtotal_devolucao)}</span>
                    </div>
                  ))}
                </div>

                {targetDevolucao.observacoes && (
                  <>
                    <Divider />
                    <div>
                      <p className="text-default-500 text-sm mb-1">
                        Observações
                      </p>
                      <p className="text-sm">{targetDevolucao.observacoes}</p>
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

      {/* Modal Aplicar Crédito */}
      {canProcessarCreditos && (
        <Modal
          isOpen={creditoModal.isOpen}
          onOpenChange={creditoModal.onOpenChange}
        >
          <ModalContent>
            <ModalHeader>Aplicar Crédito</ModalHeader>
            <ModalBody className="space-y-4">
              {targetDevolucao && (
                <>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-default-500">Cliente:</span>{" "}
                      <strong>{targetDevolucao.cliente_nome}</strong>
                    </p>
                    <p>
                      <span className="text-default-500">ID do Cliente:</span>{" "}
                      <strong>#{targetDevolucao.id_cliente}</strong>
                    </p>
                    <p>
                      <span className="text-default-500">
                        Valor do crédito:
                      </span>{" "}
                      <strong>
                        {fmt(targetDevolucao.valor_credito_gerado)}
                      </strong>
                    </p>
                    <p>
                      <span className="text-default-500">Devolução:</span> #
                      {targetDevolucao.id} (Venda #{targetDevolucao.id_venda})
                    </p>
                    {targetDevolucao.id_cliente && (
                      <p>
                        <span className="text-default-500">
                          Crédito atual do cliente:
                        </span>{" "}
                        <strong>
                          {fmt(
                            clientes.find(
                              (c) => c.id === targetDevolucao.id_cliente
                            )?.credito || 0
                          )}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div className="bg-warning-50 border border-warning-200 rounded-md p-3">
                    <p className="text-warning-700 text-sm">
                      ⚠️ Esta ação irá adicionar{" "}
                      <strong>
                        {fmt(targetDevolucao.valor_credito_gerado)}
                      </strong>{" "}
                      ao crédito do cliente e não poderá ser desfeita.
                    </p>
                  </div>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={creditoModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="success"
                onPress={aplicarCredito}
                isLoading={loading}
              >
                Confirmar Aplicação
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Concluir sem Crédito */}
      {canProcessarCreditos && (
        <Modal
          isOpen={concluirModal.isOpen}
          onOpenChange={concluirModal.onOpenChange}
        >
          <ModalContent>
            <ModalHeader>Concluir sem Gerar Crédito</ModalHeader>
            <ModalBody className="space-y-4">
              {targetDevolucao && (
                <>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-default-500">Cliente:</span>{" "}
                      <strong>{targetDevolucao.cliente_nome}</strong>
                    </p>
                    <p>
                      <span className="text-default-500">Devolução:</span> #
                      {targetDevolucao.id} (Venda #{targetDevolucao.id_venda})
                    </p>
                    <p>
                      <span className="text-default-500">Valor devolvido:</span>{" "}
                      <strong>
                        {fmt(targetDevolucao.valor_total_devolvido)}
                      </strong>
                    </p>
                  </div>

                  <div className="bg-info-50 border border-info-200 rounded-md p-3">
                    <p className="text-info-700 text-sm">
                      ℹ️ Esta devolução será marcada como concluída{" "}
                      <strong>SEM gerar crédito</strong> para o cliente. Use
                      esta opção quando o reembolso foi feito de outra forma
                      (dinheiro, PIX, etc).
                    </p>
                  </div>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={concluirModal.onClose}>
                Cancelar
              </Button>
              <Button
                color="success"
                onPress={concluirSemCredito}
                isLoading={loading}
              >
                Concluir sem Crédito
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Exclusão */}
      {canDeleteDevolucoes && (
        <Modal
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
          size="lg"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              Excluir Devolução #{targetDevolucao?.id}
            </ModalHeader>
            <ModalBody className="space-y-4">
              {targetDevolucao && (
                <>
                  {/* Informações da devolução */}
                  <Card className="border-default-200">
                    <CardBody className="space-y-2">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-default-500">Cliente</p>
                          <p className="font-medium">
                            {targetDevolucao.cliente_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500">Valor</p>
                          <p className="font-medium">
                            {fmt(targetDevolucao.valor_total_devolvido)}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500">Status</p>
                          <Chip
                            size="sm"
                            color={
                              statusDevolucaoInfo(targetDevolucao.status).color
                            }
                            variant="flat"
                          >
                            {statusDevolucaoInfo(targetDevolucao.status).label}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-default-500">Data</p>
                          <p className="font-medium">
                            {fmtDate(targetDevolucao.data_devolucao)}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Aviso padrão */}
                  <p className="text-default-700">
                    Tem certeza que deseja excluir definitivamente esta
                    devolução?
                  </p>

                  {/* Aviso especial para devoluções concluídas */}
                  {(targetDevolucao.status === "concluida" ||
                    targetDevolucao.status === "concluida_com_credito") && (
                    <Card className="bg-danger-50 border-2 border-danger-300">
                      <CardBody className="space-y-3">
                        <div className="flex items-start gap-3">
                          <ExclamationTriangleIcon className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="font-bold text-danger-800">
                              ⚠️ ATENÇÃO: DEVOLUÇÃO CONCLUÍDA
                            </p>
                            <p className="text-sm text-danger-700">
                              Esta devolução já foi processada e pode ter
                              afetado:
                            </p>
                            <ul className="text-sm text-danger-700 list-disc list-inside space-y-1">
                              <li>
                                Crédito de{" "}
                                <strong>
                                  {fmt(targetDevolucao.valor_credito_gerado)}
                                </strong>{" "}
                                {targetDevolucao.credito_aplicado
                                  ? "já aplicado"
                                  : "gerado"}{" "}
                                ao cliente
                              </li>
                              <li>
                                Estoque atualizado com{" "}
                                {targetDevolucao.itens_devolvidos.length}{" "}
                                produto(s)
                              </li>
                              <li>Status da venda original alterado</li>
                            </ul>
                            {canDeleteSemRestricao && (
                              <div className="mt-3 p-2 bg-warning-100 rounded border border-warning-300">
                                <p className="text-xs text-warning-800">
                                  <strong>Permissão Especial:</strong> Você tem
                                  a permissão "Deletar Sem Restrição" ativa.
                                  Considere as consequências nos dados do
                                  sistema antes de excluir.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
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
                {targetDevolucao?.status === "pendente"
                  ? "Excluir"
                  : "Excluir Definitivamente"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Exclusão de Devolução Concluída (com permissão especial) */}
      {canDeleteSemRestricao && (
        <Modal
          isOpen={deleteConcluidaModal.isOpen}
          onOpenChange={deleteConcluidaModal.onOpenChange}
          size="2xl"
          backdrop="blur"
        >
          <ModalContent>
            <ModalHeader className="flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20">
              <ExclamationTriangleIcon className="w-7 h-7 text-danger-600" />
              <div>
                <h3 className="text-danger-800 dark:text-danger-400 text-xl font-bold">
                  ⚠️ Exclusão de Devolução Concluída
                </h3>
                <p className="text-sm text-danger-600 dark:text-danger-500 font-normal">
                  Esta ação requer permissão especial
                </p>
              </div>
            </ModalHeader>
            <ModalBody className="space-y-4 py-6">
              {targetDevolucao && (
                <>
                  {/* Badge de Permissão Especial */}
                  <Card className="bg-warning-50 border-2 border-warning-300">
                    <CardBody className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning-200 rounded-full">
                          <ShoppingCartIcon className="w-5 h-5 text-warning-800" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-warning-900">
                            Permissão "Deletar Sem Restrição" Ativa
                          </p>
                          <p className="text-xs text-warning-700">
                            Você pode excluir devoluções concluídas
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Informações da devolução */}
                  <Card className="border-default-200">
                    <CardBody className="space-y-3">
                      <h4 className="font-semibold text-default-700">
                        Informações da Devolução #{targetDevolucao.id}
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-default-500">Cliente</p>
                          <p className="font-medium">
                            {targetDevolucao.cliente_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500">Valor Devolvido</p>
                          <p className="font-medium">
                            {fmt(targetDevolucao.valor_total_devolvido)}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500">Status</p>
                          <Chip
                            size="sm"
                            color={
                              statusDevolucaoInfo(targetDevolucao.status).color
                            }
                            variant="flat"
                          >
                            {statusDevolucaoInfo(targetDevolucao.status).label}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-default-500">Data</p>
                          <p className="font-medium">
                            {fmtDate(targetDevolucao.data_devolucao)}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500">Crédito Gerado</p>
                          <p className="font-medium text-success">
                            {fmt(targetDevolucao.valor_credito_gerado)}
                          </p>
                        </div>
                        <div>
                          <p className="text-default-500">Crédito Aplicado</p>
                          <Chip
                            size="sm"
                            color={
                              targetDevolucao.credito_aplicado
                                ? "success"
                                : "warning"
                            }
                            variant="flat"
                          >
                            {targetDevolucao.credito_aplicado ? "Sim" : "Não"}
                          </Chip>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Aviso de impactos */}
                  <Card className="bg-danger-50 dark:bg-danger-900/20 border-2 border-danger-300">
                    <CardBody className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-danger-600 flex-shrink-0 mt-1" />
                        <div className="space-y-3 flex-1">
                          <div>
                            <p className="font-bold text-danger-800 dark:text-danger-400 text-base">
                              Esta ação é irreversível!
                            </p>
                            <p className="text-sm text-danger-700 dark:text-danger-500 mt-1">
                              Ao excluir esta devolução concluída, os seguintes
                              dados serão afetados:
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-danger-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-danger-800 text-xs font-bold">
                                  1
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-danger-800 dark:text-danger-400">
                                  Crédito do Cliente
                                </p>
                                <p className="text-danger-700 dark:text-danger-500">
                                  {targetDevolucao.credito_aplicado
                                    ? `Crédito de ${fmt(targetDevolucao.valor_credito_gerado)} já foi aplicado ao cliente. A exclusão NÃO removerá automaticamente este crédito.`
                                    : `Crédito de ${fmt(targetDevolucao.valor_credito_gerado)} foi gerado mas ainda não aplicado.`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-danger-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-danger-800 text-xs font-bold">
                                  2
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-danger-800 dark:text-danger-400">
                                  Estoque
                                </p>
                                <p className="text-danger-700 dark:text-danger-500">
                                  {targetDevolucao.itens_devolvidos.length}{" "}
                                  produto(s) foram devolvidos ao estoque. A
                                  exclusão NÃO reverterá estas alterações.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-danger-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-danger-800 text-xs font-bold">
                                  3
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-danger-800 dark:text-danger-400">
                                  Histórico
                                </p>
                                <p className="text-danger-700 dark:text-danger-500">
                                  O registro completo desta devolução será
                                  permanentemente excluído do sistema.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-danger-100 dark:bg-danger-900/30 rounded-lg border border-danger-300">
                            <p className="text-xs text-danger-800 dark:text-danger-400 font-semibold">
                              ⚠️ IMPORTANTE: Você precisará ajustar manualmente
                              o crédito do cliente e o estoque se necessário
                              após a exclusão.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </>
              )}
            </ModalBody>
            <ModalFooter className="border-t border-divider">
              <Button
                variant="flat"
                onPress={deleteConcluidaModal.onClose}
                isDisabled={loading}
              >
                Cancelar
              </Button>
              <Button
                color="danger"
                onPress={confirmarDelete}
                isLoading={loading}
                startContent={<TrashIcon className="w-5 h-5" />}
                className="font-semibold"
              >
                {loading ? "Excluindo..." : "Sim, Excluir Definitivamente"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
