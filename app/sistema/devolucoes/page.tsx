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
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

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
  loja_id?: number; // ADICIONAR ESTA LINHA
  id_usuario?: string;
  itens: VendaItem[];
  total_bruto: number;
  desconto: number;
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
}

// 2. Adicionar interface para Loja
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

// Interface para clientes
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
  // 3. Adicionar estado para lojas
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

  // Dados
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

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
  const [buscarVendaId, setBuscarVendaId] = useState("");

  // Estados auxiliares
  const [targetDevolucao, setTargetDevolucao] = useState<Devolucao | null>(
    null
  );

  // Handlers com verificação de permissão
  function safeOpenNewDevolucao() {
    if (!canCreateDevolucoes) {
      alert("Você não possui permissão para criar devoluções.");
      return;
    }
    openNewDevolucao();
  }

  function safeOpenEditDevolucao(d: Devolucao) {
    if (!canEditDevolucoes) {
      alert("Você não possui permissão para editar devoluções.");
      return;
    }
    openEditDevolucao(d);
  }

  function safeOpenDelete(d: Devolucao) {
    if (!canDeleteDevolucoes) {
      alert("Você não possui permissão para deletar devoluções.");
      return;
    }
    openDelete(d);
  }

  function safeOpenCredito(d: Devolucao) {
    if (!canProcessarCreditos) {
      alert("Você não possui permissão para processar créditos.");
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
        fetchTable("lojas"), // ADICIONAR ESTA LINHA
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
      setLojas(lojasData || []); // ADICIONAR ESTA LINHA
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

        if (filters.orderBy === "data_devolucao") {
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

  // Buscar venda para devolução
  async function buscarVenda() {
    if (!buscarVendaId) return;

    try {
      setLoading(true);

      console.log("[DEVOLUCAO] Buscando venda ID:", buscarVendaId);
      console.log(
        "[DEVOLUCAO] Vendas disponíveis:",
        vendas.map((v) => ({ id: v.id, cliente: v.cliente_nome }))
      );

      const venda = vendas.find((v) => v.id.toString() === buscarVendaId);

      if (!venda) {
        // Se não encontrou nas vendas carregadas, tentar recarregar
        console.log(
          "[DEVOLUCAO] Venda não encontrada no cache, recarregando..."
        );
        await loadAll();

        // Tentar novamente após recarregar
        const vendaRecarregada = vendas.find(
          (v) => v.id.toString() === buscarVendaId
        );

        if (!vendaRecarregada) {
          alert("Venda não encontrada");
          return;
        }

        setVendaSelecionada(vendaRecarregada);
        prepararItensDevolucao(vendaRecarregada.itens);
        console.log(
          "[DEVOLUCAO] Venda encontrada após recarregar:",
          vendaRecarregada
        );
        return;
      }

      if (venda.status_pagamento === "cancelado") {
        alert("Não é possível devolver itens de uma venda cancelada");
        return;
      }

      console.log("[DEVOLUCAO] Venda encontrada:", venda);
      setVendaSelecionada(venda);
      prepararItensDevolucao(venda.itens);
    } catch (error) {
      console.error("Erro ao buscar venda:", error);
      alert("Erro ao buscar venda");
    } finally {
      setLoading(false);
    }
  }

  function prepararItensDevolucao(itens: VendaItem[]) {
    const itensDevolucao = itens.map((item) => ({
      id_estoque: item.id_estoque,
      descricao: item.descricao,
      modelo: item.modelo,
      marca: item.marca,
      quantidade_original: item.quantidade,
      quantidade_devolver: 0,
      preco_unitario: item.preco_unitario,
      desconto: item.desconto,
      subtotal_original: item.subtotal,
      subtotal_devolucao: 0,
      foto: item.foto,
    }));
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
        const subtotalDevolucao =
          qtdDevolver * item.preco_unitario -
          (item.desconto / item.quantidade_original) * qtdDevolver;

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
      setItensParaDevolucao(d.itens_devolvidos);
    }
    setMotivoDevolucao(d.motivo_devolucao || "");
    setObservacoesDevolucao(d.observacoes || "");
    setBuscarVendaId(d.id_venda.toString());
    devolucaoModal.onOpen();
  }

  async function salvarDevolucao() {
    if (!vendaSelecionada) {
      alert("Selecione uma venda");
      return;
    }

    const itensComDevolucao = itensParaDevolucao.filter(
      (item) => item.quantidade_devolver > 0
    );

    if (itensComDevolucao.length === 0) {
      alert("Selecione pelo menos um item para devolução");
      return;
    }

    if (!motivoDevolucao) {
      alert("Selecione o motivo da devolução");
      return;
    }

    const valorTotalDevolvido = calcularTotalDevolucao();
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
      valor_credito_gerado: valorTotalDevolvido,
      credito_aplicado: false,
      observacoes: observacoesDevolucao,
      updated_at: new Date().toISOString(),
    };

    try {
      setLoading(true);

      // 1. Salvar a devolução
      // Corrigir esta parte no salvarDevolucao:
      let devolucaoId;
      if (editingDevolucao) {
        await updateTable("devolucoes", editingDevolucao.id, dadosDevolucao);
        devolucaoId = editingDevolucao.id;
      } else {
        try {
          const resultado: any = await insertTable(
            "devolucoes",
            dadosDevolucao
          );
          console.log("[DEVOLUCAO] Resultado do insert:", resultado);

          // Tratar diferentes formatos de retorno
          if (Array.isArray(resultado)) {
            devolucaoId = resultado[0]?.id;
          } else {
            devolucaoId = resultado?.id;
          }

          if (!devolucaoId) {
            console.warn(
              "[DEVOLUCAO] ID não encontrado no resultado:",
              resultado
            );
          }
        } catch (error) {
          console.error("[DEVOLUCAO] Erro no insert:", error);
          throw error;
        }
      }

      // 2. NOVO: Devolver produtos para o estoque da loja
      // Primeiro, precisamos descobrir qual loja foi usada na venda
      const lojaId = lojaDevolucao || 1; // Usar loja selecionada ou padrão

      if (!lojaId) {
        console.warn(
          "Venda não possui loja_id, não será possível devolver ao estoque"
        );
        alert(
          "Aviso: Venda não possui loja associada. Estoque não será atualizado."
        );
      } else {
        console.log(
          `[DEVOLUCAO] Devolvendo itens para loja ${lojaId}:`,
          itensComDevolucao
        );

        for (const item of itensComDevolucao) {
          try {
            // Buscar o registro atual do estoque_lojas
            const { data: estoqueAtual, error: estoqueError } = await supabase
              .from("estoque_lojas")
              .select("quantidade")
              .eq("produto_id", item.id_estoque)
              .eq("loja_id", lojaId)
              .single();

            if (estoqueError) {
              console.error(
                `Erro ao buscar estoque do produto ${item.id_estoque}:`,
                estoqueError
              );
              // Se não existe, criar um novo registro
              await supabase.from("estoque_lojas").insert({
                produto_id: item.id_estoque,
                loja_id: lojaId,
                quantidade: item.quantidade_devolver,
                updatedat: new Date().toISOString(),
              });

              console.log(
                `[DEVOLUCAO] Criado novo registro de estoque para produto ${item.id_estoque}: +${item.quantidade_devolver}`
              );
            } else {
              // Atualizar quantidade existente
              const novaQuantidade =
                (estoqueAtual.quantidade || 0) + item.quantidade_devolver;

              await supabase
                .from("estoque_lojas")
                .update({
                  quantidade: novaQuantidade,
                  updatedat: new Date().toISOString(),
                })
                .eq("produto_id", item.id_estoque)
                .eq("loja_id", lojaId);

              console.log(
                `[DEVOLUCAO] Produto ${item.id_estoque}: ${estoqueAtual.quantidade} + ${item.quantidade_devolver} = ${novaQuantidade}`
              );
            }
          } catch (error) {
            console.error(
              `Erro ao devolver produto ${item.id_estoque} ao estoque:`,
              error
            );
            // Continua com os outros produtos mesmo se um falhar
          }
        }
      }

      await loadAll();
      devolucaoModal.onClose();

      // Mostrar mensagem de sucesso
      alert(
        `Devolução processada com sucesso!\n` +
          `${itensComDevolucao.length} itens foram devolvidos ao estoque.`
      );
    } catch (e: any) {
      console.error("Erro ao salvar devolução:", e);
      alert("Erro ao salvar devolução: " + (e?.message || "erro desconhecido"));
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
    setLojaDevolucao(null); // ADICIONAR ESTA LINHA
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

      // Atualizar crédito do cliente (não do usuário)
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
          alert("Cliente não encontrado");
          return;
        }
      } else {
        alert("ID do cliente não encontrado na devolução");
        return;
      }

      // Marcar crédito como aplicado
      await updateTable("devolucoes", targetDevolucao.id, {
        credito_aplicado: true,
        updated_at: new Date().toISOString(),
      });

      await loadAll();
      creditoModal.onClose();
    } catch (e: any) {
      console.error("Erro ao aplicar crédito:", e);
      alert("Erro ao aplicar crédito: " + (e?.message || "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  // View
  function openView(d: Devolucao) {
    setTargetDevolucao(d);
    viewModal.onOpen();
  }

  // Delete
  function openDelete(d: Devolucao) {
    setTargetDevolucao(d);
    deleteModal.onOpen();
  }

  async function confirmarDelete() {
    if (!targetDevolucao) return;

    try {
      setLoading(true);
      await deleteTable("devolucoes", targetDevolucao.id);
      await loadAll();
      deleteModal.onClose();
    } catch (e: any) {
      console.error("Erro ao excluir devolução:", e);
      alert(
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Total de Devoluções</p>
            <p className="text-2xl font-semibold">{stats.count}</p>
            <p className="text-xs text-default-400">
              {stats.totalCompletas} total, {stats.totalParciais} parcial
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Valor Devolvido</p>
            <p className="text-xl font-semibold">{fmt(stats.valorTotal)}</p>
            <p className="text-xs text-default-400">Total acumulado</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Crédito Pendente</p>
            <p className="text-xl font-semibold text-orange-600">
              {fmt(stats.creditoPendente)}
            </p>
            <p className="text-xs text-default-400">
              {devolucoes.filter((d) => !d.credito_aplicado).length} pendentes
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-xs text-default-500">Média por Devolução</p>
            <p className="text-xl font-semibold">
              {fmt(stats.count > 0 ? stats.valorTotal / stats.count : 0)}
            </p>
            <p className="text-xs text-default-400">Ticket médio</p>
          </CardBody>
        </Card>
      </div>

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
                  const creditoInfo = statusCreditoInfo(d.credito_aplicado);
                  const CreditoIcon = creditoInfo.icon;

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
                          color={creditoInfo.color}
                          variant="flat"
                          startContent={<CreditoIcon className="w-3.5 h-3.5" />}
                        >
                          {creditoInfo.label}
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
                            <Tooltip content="Editar">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => safeOpenEditDevolucao(d)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}

                          {canProcessarCreditos && !d.credito_aplicado && (
                            <Tooltip content="Aplicar Crédito">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onPress={() => safeOpenCredito(d)}
                              >
                                <CreditCardIcon className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          )}

                          {canDeleteDevolucoes && (
                            <Tooltip content="Excluir" color="danger">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => safeOpenDelete(d)}
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
              {/* Buscar Venda */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Buscar Venda</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o ID da venda"
                    value={buscarVendaId}
                    onChange={(e) => setBuscarVendaId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && buscarVenda()}
                    className="flex-1"
                  />
                  <Button onPress={buscarVenda} isLoading={loading}>
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Informações da Venda */}
              {vendaSelecionada && (
                <Card>
                  <CardBody>
                    <h4 className="font-semibold mb-3">
                      Venda #{vendaSelecionada.id}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-default-500">Cliente</p>
                        <p className="font-medium">
                          {vendaSelecionada.cliente_nome}
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
                        <p>{vendaSelecionada.forma_pagamento}</p>
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
                            • {fmt(item.preco_unitario)}
                          </p>
                          <p className="text-xs text-default-400">
                            Qtd. original: {item.quantidade_original}
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
                    {lojas.map((loja) => (
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
                    .length === 0
                }
              >
                {editingDevolucao ? "Atualizar" : "Processar Devolução"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Visualizar */}
      <Modal
        isOpen={viewModal.isOpen}
        onOpenChange={viewModal.onOpenChange}
        size="lg"
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
                  <div>
                    <p className="text-default-500">Valor Devolvido</p>
                    <p className="font-medium">
                      {fmt(targetDevolucao.valor_total_devolvido)}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500">Crédito Gerado</p>
                    <p className="font-medium">
                      {fmt(targetDevolucao.valor_credito_gerado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500">Status Crédito</p>
                    <p>
                      {
                        statusCreditoInfo(targetDevolucao.credito_aplicado)
                          .label
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-default-500">Motivo</p>
                    <p>{motivoLabel(targetDevolucao.motivo_devolucao || "")}</p>
                  </div>
                </div>

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

      {/* Modal Exclusão */}
      {canDeleteDevolucoes && (
        <Modal
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
        >
          <ModalContent>
            <ModalHeader>Excluir Devolução</ModalHeader>
            <ModalBody>
              <p>
                Tem certeza que deseja excluir definitivamente a devolução #
                {targetDevolucao?.id}?
              </p>
              {targetDevolucao?.credito_aplicado && (
                <div className="bg-danger-50 border border-danger-200 rounded-md p-3">
                  <p className="text-danger-700 text-sm">
                    ⚠️ Esta devolução já teve o crédito aplicado ao cliente. A
                    exclusão não reverterá o crédito automaticamente.
                  </p>
                </div>
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
