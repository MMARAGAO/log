"use client";

import { useEffect, useState } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { useAuthStore } from "@/store/authZustand";
import {
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
  Spinner,
  Textarea,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  PlusIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/solid";

// Interfaces
interface Transferencia {
  id: number;
  loja_origem_id: number;
  loja_destino_id: number;
  usuario_id: number;
  data_transferencia: string;
  observacoes?: string;
  status: "pendente" | "concluida" | "cancelada";
  createdat: string;
  updatedat: string;

  // Relacionamentos
  loja_origem?: Loja;
  loja_destino?: Loja;
  itens?: TransferenciaItem[];
}

interface TransferenciaItem {
  id: number;
  transferencia_id: number;
  produto_id: number;
  quantidade: number;
  createdat: string;

  // Relacionamento
  produto?: EstoqueItem;
}

interface EstoqueItem {
  id: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  compativel?: string;
  minimo?: number;
  preco_compra?: number;
  preco_venda?: number;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  observacoes?: string;
  estoque_lojas?: EstoqueLoja[];
  quantidade_total?: number;
}

interface EstoqueLoja {
  id: number;
  produto_id: number;
  loja_id: number;
  quantidade: number;
  updatedat: string;
}

interface Loja {
  id: number;
  nome: string;
  endereco?: string;
  telefone?: string;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  descricao?: string;
}

interface FormDataTransferencia {
  loja_origem_id?: number;
  loja_destino_id?: number;
  observacoes?: string;
  itens?: {
    produto_id: number;
    quantidade: number;
  }[];
}

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG = {
  pendente: {
    color: "warning" as const,
    icon: ClockIcon,
    label: "Pendente",
  },
  concluida: {
    color: "success" as const,
    icon: CheckCircleIcon,
    label: "Concluída",
  },
  cancelada: {
    color: "danger" as const,
    icon: XCircleIcon,
    label: "Cancelada",
  },
};

export default function TransferenciasPage() {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [produtosOrigem, setProdutosOrigem] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransferencia, setSelectedTransferencia] =
    useState<Transferencia | null>(null);
  const [formData, setFormData] = useState<FormDataTransferencia>({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [lojaFilter, setLojaFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "create" | "view">("list");
  const [orderDirection, setOrderDirection] = useState<"desc" | "asc">("desc");

  // Estado dos filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "",
    lojaOrigem: "",
    lojaDestino: "",
    dataInicio: "",
    dataFim: "",
    search: "",
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuthStore();

  // Controle de permissões atualizado
  const acessos = user?.permissoes?.acessos;
  const permTransferencias = acessos?.transferencias;

  const canViewTransferencias = permTransferencias?.ver_transferencias ?? false;
  const canCreateTransferencias =
    permTransferencias?.criar_transferencias ?? false;
  const canEditTransferencias =
    permTransferencias?.editar_transferencias ?? false;
  const canDeleteTransferencias =
    permTransferencias?.deletar_transferencias ?? false;
  const canConfirmTransferencias =
    permTransferencias?.confirmar_transferencias ?? false;

  // Carregar dados iniciais apenas se tem permissão
  useEffect(() => {
    if (canViewTransferencias) {
      loadData();
    }
  }, [canViewTransferencias]);

  // Função para carregar todos os dados em sequência
  async function loadData() {
    setLoading(true);
    try {
      // Carregar lojas primeiro
      await loadLojas();

      // Carregar estoque
      await loadEstoque();

      // Aguardar um pouco para garantir que os estados foram atualizados
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Carregar transferências por último
      await loadTransferencias();
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  // Carregar lojas
  async function loadLojas() {
    try {
      const data = await fetchTable("lojas");
      setLojas(data || []);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    }
  }

  // Carregar estoque completo
  async function loadEstoque() {
    try {
      const data = await fetchTable("estoque");
      if (data) {
        // Carregar dados de estoque por loja
        const todosEstoqueLojas = await fetchTable("estoque_lojas");

        const produtosComEstoque = data.map((produto) => {
          const estoqueLojas =
            todosEstoqueLojas?.filter(
              (item) => item.produto_id === produto.id
            ) || [];

          const quantidadeTotal = estoqueLojas.reduce(
            (total, item) => total + (Number(item.quantidade) || 0),
            0
          );

          return {
            ...produto,
            estoque_lojas: estoqueLojas,
            quantidade_total: quantidadeTotal,
          };
        });

        setEstoque(produtosComEstoque);
      }
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    }
  }

  // Carregar transferências (modificar para usar os dados já carregados)
  async function loadTransferencias() {
    try {
      const data = await fetchTable("transferencias");
      if (data) {
        // Buscar lojas e estoque atualizados
        const lojasAtualizadas = await fetchTable("lojas");
        const estoqueAtualizado = await fetchTable("estoque");

        // Para cada transferência, carregar os itens
        const transferenciasComItens = await Promise.all(
          data.map(async (transferencia) => {
            try {
              // Carregar itens da transferência
              const itens = await fetchTable("transferencia_itens");
              const itensTransferencia =
                itens?.filter(
                  (item) => item.transferencia_id === transferencia.id
                ) || [];

              // Enriquecer itens com dados do produto
              const itensComProdutos = itensTransferencia.map((item) => {
                const produto = estoqueAtualizado?.find(
                  (p) => p.id === item.produto_id
                );
                return {
                  ...item,
                  produto,
                };
              });

              // Encontrar lojas usando os dados atualizados
              const lojaOrigem = lojasAtualizadas?.find(
                (l) => l.id === transferencia.loja_origem_id
              );
              const lojaDestino = lojasAtualizadas?.find(
                (l) => l.id === transferencia.loja_destino_id
              );

              return {
                ...transferencia,
                itens: itensComProdutos,
                loja_origem: lojaOrigem,
                loja_destino: lojaDestino,
              };
            } catch (error) {
              console.error(
                `Erro ao carregar dados da transferência ${transferencia.id}:`,
                error
              );
              return transferencia;
            }
          })
        );

        setTransferencias(transferenciasComItens);
      }
    } catch (error) {
      console.error("Erro ao carregar transferências:", error);
    }
  }

  // Função para obter quantidade de um produto em uma loja específica
  function getQuantidadeLoja(produtoId: number, lojaId: number): number {
    const produto = estoque.find((p) => p.id === produtoId);
    if (!produto || !produto.estoque_lojas) return 0;

    const estoqueLoja = produto.estoque_lojas.find(
      (el) => el.loja_id === lojaId
    );
    return Number(estoqueLoja?.quantidade) || 0;
  }

  // Filtrar produtos por loja origem quando selecionada
  useEffect(() => {
    if (formData.loja_origem_id) {
      const produtosDaLoja = estoque.filter((produto) => {
        const quantidade = getQuantidadeLoja(
          produto.id,
          formData.loja_origem_id!
        );
        return quantidade > 0;
      });
      setProdutosOrigem(produtosDaLoja);
    } else {
      setProdutosOrigem([]);
    }
  }, [formData.loja_origem_id, estoque]);

  // Função para adicionar item à transferência
  function adicionarItem() {
    const novosItens = formData.itens || [];
    novosItens.push({ produto_id: 0, quantidade: 0 });
    setFormData({ ...formData, itens: novosItens });
  }

  // Função para remover item da transferência
  function removerItem(index: number) {
    const novosItens = formData.itens?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, itens: novosItens });
  }

  // Função para atualizar item da transferência
  function atualizarItem(
    index: number,
    campo: keyof TransferenciaItem,
    valor: any
  ) {
    const novosItens = [...(formData.itens || [])];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    setFormData({ ...formData, itens: novosItens });
  }

  // Salvar transferência
  async function handleSave() {
    if (!formData.loja_origem_id || !formData.loja_destino_id) {
      alert("Selecione as lojas de origem e destino!");
      return;
    }

    if (formData.loja_origem_id === formData.loja_destino_id) {
      alert("A loja de origem deve ser diferente da loja de destino!");
      return;
    }

    if (!formData.itens || formData.itens.length === 0) {
      alert("Adicione pelo menos um item à transferência!");
      return;
    }

    // Validar quantidades
    for (const item of formData.itens) {
      if (!item.produto_id || item.quantidade <= 0) {
        alert("Todos os itens devem ter produto e quantidade válidos!");
        return;
      }

      const quantidadeDisponivel = getQuantidadeLoja(
        item.produto_id,
        formData.loja_origem_id
      );
      if (item.quantidade > quantidadeDisponivel) {
        const produto = estoque.find((p) => p.id === item.produto_id);
        alert(
          `Quantidade insuficiente para ${produto?.descricao}. Disponível: ${quantidadeDisponivel}`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Criar transferência
      const transferenciaData = {
        loja_origem_id: formData.loja_origem_id,
        loja_destino_id: formData.loja_destino_id,
        usuario_id: user?.id || 1,
        observacoes: formData.observacoes || null,
        status: "pendente",
      };

      console.log("Criando transferência:", transferenciaData);
      await insertTable("transferencias", transferenciaData);

      // Buscar a transferência recém-criada
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const transferenciasAtualizadas = await fetchTable("transferencias");
      const novaTransferencia = transferenciasAtualizadas
        ?.filter(
          (t) =>
            t.loja_origem_id === formData.loja_origem_id &&
            t.loja_destino_id === formData.loja_destino_id &&
            t.usuario_id === (user?.id || 1)
        )
        .sort(
          (a, b) =>
            new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime()
        )[0];

      if (novaTransferencia) {
        // Criar itens da transferência
        for (const item of formData.itens) {
          const itemData = {
            transferencia_id: novaTransferencia.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
          };
          console.log("Criando item:", itemData);
          await insertTable("transferencia_itens", itemData);
        }

        alert("Transferência criada com sucesso!");
        await loadTransferencias();
        setViewMode("list");
        clearForm();
      } else {
        throw new Error("Não foi possível encontrar a transferência criada");
      }
    } catch (error) {
      console.error("Erro ao salvar transferência:", error);
      alert(`Erro ao salvar transferência: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Confirmar transferência (executar a movimentação de estoque)
  async function confirmarTransferencia(transferencia: Transferencia) {
    if (
      !confirm(
        "Tem certeza que deseja confirmar esta transferência? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Para cada item, atualizar o estoque das lojas
      for (const item of transferencia.itens || []) {
        const produto = item.produto;
        if (!produto) continue;

        // Diminuir quantidade da loja origem
        const quantidadeOrigem = getQuantidadeLoja(
          produto.id,
          transferencia.loja_origem_id
        );
        await updateEstoqueLoja(
          produto.id,
          transferencia.loja_origem_id,
          quantidadeOrigem - item.quantidade
        );

        // Aumentar quantidade da loja destino
        const quantidadeDestino = getQuantidadeLoja(
          produto.id,
          transferencia.loja_destino_id
        );
        await updateEstoqueLoja(
          produto.id,
          transferencia.loja_destino_id,
          quantidadeDestino + item.quantidade
        );
      }

      // Atualizar status da transferência
      await updateTable("transferencias", transferencia.id, {
        status: "concluida",
        updatedat: new Date().toISOString(),
      });

      alert("Transferência confirmada com sucesso!");
      await loadTransferencias();
      await loadEstoque();
    } catch (error) {
      console.error("Erro ao confirmar transferência:", error);
      alert(`Erro ao confirmar transferência: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Cancelar transferência
  async function cancelarTransferencia(transferencia: Transferencia) {
    if (!confirm("Tem certeza que deseja cancelar esta transferência?")) {
      return;
    }

    setLoading(true);
    try {
      await updateTable("transferencias", transferencia.id, {
        status: "cancelada",
        updatedat: new Date().toISOString(),
      });

      alert("Transferência cancelada!");
      await loadTransferencias();
    } catch (error) {
      console.error("Erro ao cancelar transferência:", error);
      alert(`Erro ao cancelar transferência: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  // Função auxiliar para atualizar estoque de loja
  async function updateEstoqueLoja(
    produtoId: number,
    lojaId: number,
    quantidade: number
  ) {
    try {
      const todosEstoqueLojas = await fetchTable("estoque_lojas");
      const estoqueExistente = todosEstoqueLojas?.filter(
        (item) => item.produto_id === produtoId && item.loja_id === lojaId
      );

      if (estoqueExistente && estoqueExistente.length > 0) {
        await updateTable("estoque_lojas", estoqueExistente[0].id, {
          quantidade: quantidade,
          updatedat: new Date().toISOString(),
        });
      } else if (quantidade > 0) {
        await insertTable("estoque_lojas", {
          produto_id: produtoId,
          loja_id: lojaId,
          quantidade: quantidade,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar estoque da loja:", error);
      throw error;
    }
  }

  // Limpar formulário
  function clearForm() {
    setFormData({});
    setSelectedTransferencia(null);
    setIsEditing(false);
  }

  // Função utilitária para extrair mensagem de erro
  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error && typeof error === "object")
      return JSON.stringify(error, null, 2);
    return "Erro desconhecido";
  }

  // Filtrar transferências
  const filteredTransferencias = transferencias
    .filter((transferencia) => {
      // Busca texto
      const searchMatch =
        !advancedFilters.search ||
        transferencia.loja_origem?.nome
          ?.toLowerCase()
          .includes(advancedFilters.search.toLowerCase()) ||
        transferencia.loja_destino?.nome
          ?.toLowerCase()
          .includes(advancedFilters.search.toLowerCase()) ||
        transferencia.observacoes
          ?.toLowerCase()
          .includes(advancedFilters.search.toLowerCase());

      // Status
      const statusMatch =
        !advancedFilters.status ||
        transferencia.status === advancedFilters.status;

      // Loja de origem
      const lojaOrigemMatch =
        !advancedFilters.lojaOrigem ||
        transferencia.loja_origem_id.toString() === advancedFilters.lojaOrigem;

      // Loja de destino
      const lojaDestinoMatch =
        !advancedFilters.lojaDestino ||
        transferencia.loja_destino_id.toString() ===
          advancedFilters.lojaDestino;

      // Data
      const dataTransferencia = new Date(transferencia.data_transferencia);
      const dataInicioMatch =
        !advancedFilters.dataInicio ||
        dataTransferencia >= new Date(advancedFilters.dataInicio);
      const dataFimMatch =
        !advancedFilters.dataFim ||
        dataTransferencia <= new Date(advancedFilters.dataFim);

      return (
        searchMatch &&
        statusMatch &&
        lojaOrigemMatch &&
        lojaDestinoMatch &&
        dataInicioMatch &&
        dataFimMatch
      );
    })
    // Ordenar por updatedat conforme o estado
    .sort((a, b) =>
      orderDirection === "desc"
        ? new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime()
        : new Date(a.updatedat).getTime() - new Date(b.updatedat).getTime()
    );

  // Paginação
  const totalPages = Math.ceil(filteredTransferencias.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredTransferencias.slice(startIndex, endIndex);

  // Verificação de loading inicial
  if (loading && transferencias.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" label="Carregando transferências..." />
        </div>
      </div>
    );
  }

  // Verificação de permissão
  if (!canViewTransferencias) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar transferências.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador do sistema para solicitar
              acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="container mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Transferências entre Lojas</h1>
          <p className="text-default-500 mt-1">
            Gerencie movimentações de produtos entre lojas
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="flat"
            onPress={() =>
              setOrderDirection((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            startContent={
              orderDirection === "desc" ? (
                <ArrowPathIcon className="w-4 h-4 rotate-180" />
              ) : (
                <ArrowPathIcon className="w-4 h-4" />
              )
            }
          >
            {orderDirection === "desc"
              ? "Mais recente primeiro"
              : "Mais antigo primeiro"}
          </Button> */}
          {/* {viewMode !== "list" && (
            <Button variant="flat" onPress={() => setViewMode("list")}>
              Voltar à Lista
            </Button>
          )} */}
        </div>
      </div>

      {/* Modo Lista */}
      {viewMode === "list" && (
        <>
          {/* Filtros */}
          <div className="mb-6 space-y-4">
            <div className="grid lg:grid-cols-3 grid-cols-1 gap-2">
              <div className="lg:col-span-3 col-span-1 flex gap-2">
                <Input
                  placeholder="Buscar por loja ou observação..."
                  value={advancedFilters.search}
                  className=""
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                />
                {canCreateTransferencias && viewMode === "list" && (
                  <div>
                    <Button
                      color="primary"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={() => setViewMode("create")}
                      className="min-w-0 w-10 p-0 lg:w-auto lg:min-w-[9rem] lg:px-4 lg:py-3"
                    >
                      <h1 className="hidden lg:block">Nova Transferência</h1>
                    </Button>
                  </div>
                )}
              </div>

              <Select
                placeholder="Status"
                selectedKeys={
                  advancedFilters.status ? [advancedFilters.status] : []
                }
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setAdvancedFilters((prev) => ({
                    ...prev,
                    status: key || "",
                  }));
                }}
              >
                <SelectItem key="pendente">Pendente</SelectItem>
                <SelectItem key="concluida">Concluída</SelectItem>
                <SelectItem key="cancelada">Cancelada</SelectItem>
              </Select>
              <Select
                placeholder="Loja de Origem"
                selectedKeys={
                  advancedFilters.lojaOrigem ? [advancedFilters.lojaOrigem] : []
                }
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setAdvancedFilters((prev) => ({
                    ...prev,
                    lojaOrigem: key || "",
                  }));
                }}
              >
                {lojas.map((loja) => (
                  <SelectItem key={loja.id.toString()}>{loja.nome}</SelectItem>
                ))}
              </Select>
              <Select
                placeholder="Loja de Destino"
                selectedKeys={
                  advancedFilters.lojaDestino
                    ? [advancedFilters.lojaDestino]
                    : []
                }
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setAdvancedFilters((prev) => ({
                    ...prev,
                    lojaDestino: key || "",
                  }));
                }}
              >
                {lojas.map((loja) => (
                  <SelectItem key={loja.id.toString()}>{loja.nome}</SelectItem>
                ))}
              </Select>
              <div className="flex gap-2">
                <Input
                  type="date"
                  label="De"
                  value={advancedFilters.dataInicio}
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      dataInicio: e.target.value,
                    }))
                  }
                />
                <Input
                  type="date"
                  label="Até"
                  value={advancedFilters.dataFim}
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      dataFim: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            {(advancedFilters.search ||
              advancedFilters.status ||
              advancedFilters.lojaOrigem ||
              advancedFilters.lojaDestino ||
              advancedFilters.dataInicio ||
              advancedFilters.dataFim) && (
              <Button
                variant="flat"
                color="warning"
                onPress={() =>
                  setAdvancedFilters({
                    status: "",
                    lojaOrigem: "",
                    lojaDestino: "",
                    dataInicio: "",
                    dataFim: "",
                    search: "",
                  })
                }
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Lista de Transferências */}
          <div className="space-y-4">
            {currentItems.map((transferencia) => {
              const statusConfig = STATUS_CONFIG[transferencia.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={transferencia.id}>
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-5 h-5" />
                          <Chip
                            color={statusConfig.color}
                            variant="flat"
                            size="sm"
                          >
                            {statusConfig.label}
                          </Chip>
                        </div>
                        <span className="text-sm text-default-500">
                          #{transferencia.id}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {/* Botão Visualizar - sempre disponível para quem pode ver transferências */}
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setSelectedTransferencia(transferencia);
                            setViewMode("view");
                          }}
                          title="Visualizar detalhes"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>

                        {/* Botões de ação apenas para transferências pendentes */}
                        {transferencia.status === "pendente" && (
                          <>
                            {/* Botão Confirmar - apenas se tem permissão */}
                            {canConfirmTransferencias && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                color="success"
                                onPress={() =>
                                  confirmarTransferencia(transferencia)
                                }
                                title="Confirmar transferência"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Botão Cancelar - se tem permissão de deletar ou editar */}
                            {(canDeleteTransferencias ||
                              canEditTransferencias) && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() =>
                                  cancelarTransferencia(transferencia)
                                }
                                title="Cancelar transferência"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {transferencia.loja_origem?.nome ||
                              "Loja não encontrada"}
                          </span>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-default-400" />
                        <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            {transferencia.loja_destino?.nome ||
                              "Loja não encontrada"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-default-500">Data</p>
                        <p className="font-medium">
                          {new Date(
                            transferencia.data_transferencia
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-default-500">Itens</p>
                        <p className="font-medium">
                          {transferencia.itens?.length || 0} produto(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-default-500">Criado em</p>
                        <p className="font-medium">
                          {new Date(transferencia.createdat).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-default-500">Atualizado em</p>
                        <p className="font-medium">
                          {new Date(transferencia.updatedat).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>

                    {transferencia.observacoes && (
                      <div className="mt-3 p-3 bg-default-100 rounded-lg">
                        <p className="text-sm">{transferencia.observacoes}</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}

            {filteredTransferencias.length === 0 && !loading && (
              <div className="text-center py-8 text-default-500">
                {searchTerm || statusFilter || lojaFilter
                  ? "Nenhuma transferência encontrada com os filtros aplicados"
                  : canCreateTransferencias
                    ? "Nenhuma transferência cadastrada. Clique em 'Nova Transferência' para começar."
                    : "Nenhuma transferência cadastrada"}
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </>
      )}

      {/* Modo Criação - só renderiza se tem permissão */}
      {viewMode === "create" && canCreateTransferencias && (
        <Card>
          <CardBody className="p-6">
            <h2 className="text-xl font-semibold mb-6">Nova Transferência</h2>
            <div className="space-y-6">
              {/* Seleção de Lojas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Loja de Origem"
                  placeholder="Selecione a loja de origem"
                  selectedKeys={
                    formData.loja_origem_id
                      ? [formData.loja_origem_id.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as string;
                    setFormData({
                      ...formData,
                      loja_origem_id: key ? Number(key) : undefined,
                      itens: [], // Limpar itens quando mudar loja origem
                    });
                  }}
                >
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id.toString()}>
                      {loja.nome}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Loja de Destino"
                  placeholder="Selecione a loja de destino"
                  selectedKeys={
                    formData.loja_destino_id
                      ? [formData.loja_destino_id.toString()]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as string;
                    setFormData({
                      ...formData,
                      loja_destino_id: key ? Number(key) : undefined,
                    });
                  }}
                >
                  {lojas
                    .filter((loja) => loja.id !== formData.loja_origem_id)
                    .map((loja) => (
                      <SelectItem key={loja.id.toString()}>
                        {loja.nome}
                      </SelectItem>
                    ))}
                </Select>
              </div>

              {/* Observações */}
              <Textarea
                label="Observações"
                placeholder="Informações adicionais sobre a transferência..."
                value={formData.observacoes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
              />

              {/* Itens da Transferência - MELHORADO */}
              {formData.loja_origem_id && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Itens da Transferência
                    </h3>
                    <Button
                      color="primary"
                      variant="flat"
                      size="sm"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      onPress={adicionarItem}
                      isDisabled={produtosOrigem.length === 0}
                    >
                      Adicionar Item
                    </Button>
                  </div>

                  {produtosOrigem.length === 0 ? (
                    <Card className="border border-warning-200 bg-warning-50">
                      <CardBody className="p-4 text-center">
                        <ExclamationTriangleIcon className="w-8 h-8 text-warning mx-auto mb-2" />
                        <p className="text-warning-700 font-medium">
                          Nenhum produto disponível nesta loja
                        </p>
                        <p className="text-warning-600 text-sm">
                          Selecione uma loja que possua produtos em estoque
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {formData.itens?.map((item, index) => {
                        const produto = estoque.find(
                          (p) => p.id === item.produto_id
                        );
                        const quantidadeDisponivel = item.produto_id
                          ? getQuantidadeLoja(
                              item.produto_id,
                              formData.loja_origem_id!
                            )
                          : 0;

                        return (
                          <Card
                            key={index}
                            className="border-2 border-default-200 hover:border-primary-300 transition-colors"
                          >
                            <CardBody className="p-4">
                              <div className="flex gap-4 items-start">
                                {/* Seleção de Produto MELHORADA */}
                                <div className="flex-1">
                                  <Autocomplete
                                    label="Produto"
                                    placeholder="Digite para buscar o produto..."
                                    selectedKey={
                                      item.produto_id
                                        ? item.produto_id.toString()
                                        : null
                                    }
                                    onSelectionChange={(key) => {
                                      atualizarItem(
                                        index,
                                        "produto_id",
                                        key ? Number(key) : 0
                                      );
                                    }}
                                    variant="bordered"
                                    classNames={{
                                      base: "min-h-12",
                                    }}
                                    allowsCustomValue={false}
                                    menuTrigger="input"
                                  >
                                    {produtosOrigem.map((produto) => {
                                      const quantidade = getQuantidadeLoja(
                                        produto.id,
                                        formData.loja_origem_id!
                                      );
                                      return (
                                        <AutocompleteItem
                                          key={produto.id.toString()}
                                          textValue={`${produto.descricao} ${
                                            produto.modelo
                                              ? `- ${produto.modelo}`
                                              : ""
                                          }`}
                                        >
                                          <div className="flex flex-col py-1">
                                            <div className="flex justify-between items-center">
                                              <span className="font-medium text-sm">
                                                {produto.descricao}
                                              </span>
                                              <Chip
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                              >
                                                {quantidade} un.
                                              </Chip>
                                            </div>
                                            <div className="flex gap-4 text-xs text-default-500 mt-1">
                                              {produto.marca && (
                                                <span>
                                                  <strong>Marca:</strong>{" "}
                                                  {produto.marca}
                                                </span>
                                              )}
                                              {produto.modelo && (
                                                <span>
                                                  <strong>Modelo:</strong>{" "}
                                                  {produto.modelo}
                                                </span>
                                              )}
                                              {produto.compativel && (
                                                <span>
                                                  <strong>Compatível:</strong>{" "}
                                                  {produto.compativel}
                                                </span>
                                              )}
                                            </div>
                                            {produto.preco_venda && (
                                              <div className="text-xs text-success-600 mt-1">
                                                <strong>Preço:</strong> R${" "}
                                                {produto.preco_venda.toFixed(2)}
                                              </div>
                                            )}
                                          </div>
                                        </AutocompleteItem>
                                      );
                                    })}
                                  </Autocomplete>
                                </div>

                                {/* Input de Quantidade MELHORADO */}
                                <div className="w-40">
                                  <Input
                                    label="Quantidade"
                                    type="number"
                                    placeholder="0"
                                    value={item.quantidade?.toString() || ""}
                                    onChange={(e) => {
                                      const valor = Number(e.target.value) || 0;
                                      atualizarItem(index, "quantidade", valor);
                                    }}
                                    variant="bordered"
                                    min="1"
                                    max={quantidadeDisponivel}
                                    classNames={{
                                      input: "text-center",
                                      label: "text-sm font-medium",
                                    }}
                                    description={
                                      item.produto_id &&
                                      quantidadeDisponivel > 0
                                        ? `Máx: ${quantidadeDisponivel}`
                                        : undefined
                                    }
                                    color={
                                      item.quantidade > quantidadeDisponivel
                                        ? "danger"
                                        : "default"
                                    }
                                    errorMessage={
                                      item.quantidade > quantidadeDisponivel
                                        ? "Quantidade excede o disponível"
                                        : undefined
                                    }
                                  />
                                </div>

                                {/* Botão Remover */}
                                <Button
                                  isIconOnly
                                  color="danger"
                                  variant="flat"
                                  onPress={() => removerItem(index)}
                                  className="mt-6"
                                  title="Remover item"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Informações do Produto Selecionado MELHORADAS */}
                              {produto && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <div>
                                        <p className="text-default-600 font-medium">
                                          Marca
                                        </p>
                                        <p className="text-default-800">
                                          {produto.marca || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <div>
                                        <p className="text-default-600 font-medium">
                                          Modelo
                                        </p>
                                        <p className="text-default-800">
                                          {produto.modelo || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <div>
                                        <p className="text-default-600 font-medium">
                                          Disponível
                                        </p>
                                        <p className="text-default-800 font-semibold">
                                          {quantidadeDisponivel} un.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                      <div>
                                        <p className="text-default-600 font-medium">
                                          Transferir
                                        </p>
                                        <p className="text-primary-600 font-bold">
                                          {item.quantidade || 0} un.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Informações adicionais */}
                                  <div className="mt-3 pt-3 border-t border-primary-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                      {produto.compativel && (
                                        <div>
                                          <p className="text-default-600 font-medium">
                                            Compatibilidade
                                          </p>
                                          <p className="text-default-700">
                                            {produto.compativel}
                                          </p>
                                        </div>
                                      )}
                                      {produto.preco_venda && (
                                        <div>
                                          <p className="text-default-600 font-medium">
                                            Preço Unitário
                                          </p>
                                          <p className="text-success-600 font-semibold">
                                            R$ {produto.preco_venda.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                      {produto.observacoes && (
                                        <div>
                                          <p className="text-default-600 font-medium">
                                            Observações
                                          </p>
                                          <p className="text-default-700 truncate">
                                            {produto.observacoes}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Valor total do item */}
                                    {produto.preco_venda &&
                                      item.quantidade > 0 && (
                                        <div className="mt-3 p-2 bg-success-100 rounded-md">
                                          <p className="text-success-700 font-semibold text-sm">
                                            Valor total deste item: R${" "}
                                            {(
                                              produto.preco_venda *
                                              item.quantidade
                                            ).toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                            </CardBody>
                          </Card>
                        );
                      })}

                      {/* Resumo da Transferência */}
                      {formData.itens && formData.itens.length > 0 && (
                        <Card className="border-2 border-primary-200 bg-primary-50">
                          <CardBody className="p-4">
                            <h4 className="font-semibold text-primary-800 mb-3">
                              Resumo da Transferência
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary-600">
                                  {formData.itens.length}
                                </p>
                                <p className="text-sm text-primary-700">
                                  Tipo(s) de produto
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary-600">
                                  {formData.itens.reduce(
                                    (total, item) =>
                                      total + (item.quantidade || 0),
                                    0
                                  )}
                                </p>
                                <p className="text-sm text-primary-700">
                                  Total de unidades
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-success-600">
                                  R${" "}
                                  {formData.itens
                                    .reduce((total, item) => {
                                      const produto = estoque.find(
                                        (p) => p.id === item.produto_id
                                      );
                                      return (
                                        total +
                                        (produto?.preco_venda || 0) *
                                          (item.quantidade || 0)
                                      );
                                    }, 0)
                                    .toFixed(2)}
                                </p>
                                <p className="text-sm text-success-700">
                                  Valor estimado
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      {/* Nenhum item adicionado */}
                      {(!formData.itens || formData.itens.length === 0) && (
                        <div className="text-center py-12 text-default-500">
                          <PlusIcon className="w-12 h-12 mx-auto mb-4 text-default-300" />
                          <p className="font-medium">Nenhum item adicionado</p>
                          <p className="text-sm">
                            Clique em "Adicionar Item" para começar a
                            transferência
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button variant="flat" onPress={() => setViewMode("list")}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={loading}
                  isDisabled={
                    !formData.loja_origem_id ||
                    !formData.loja_destino_id ||
                    !formData.itens ||
                    formData.itens.length === 0
                  }
                >
                  Criar Transferência
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modo Criação sem permissão */}
      {viewMode === "create" && !canCreateTransferencias && (
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para criar transferências.
            </p>
            <Button variant="flat" onPress={() => setViewMode("list")}>
              Voltar à Lista
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Modo Visualização */}
      {viewMode === "view" && selectedTransferencia && (
        <Card>
          <CardBody className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Transferência #{selectedTransferencia.id}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Chip
                    color={STATUS_CONFIG[selectedTransferencia.status].color}
                    variant="flat"
                  >
                    {STATUS_CONFIG[selectedTransferencia.status].label}
                  </Chip>
                  <span className="text-sm text-default-500">
                    Criado em{" "}
                    {new Date(
                      selectedTransferencia.createdat
                    ).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              {/* Botões de ação apenas se tem permissão e status é pendente */}
              {selectedTransferencia.status === "pendente" && (
                <div className="flex gap-2">
                  {canConfirmTransferencias && (
                    <Button
                      color="success"
                      variant="flat"
                      startContent={<CheckCircleIcon className="w-4 h-4" />}
                      onPress={() =>
                        confirmarTransferencia(selectedTransferencia)
                      }
                    >
                      Confirmar
                    </Button>
                  )}
                  {(canDeleteTransferencias || canEditTransferencias) && (
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<XCircleIcon className="w-4 h-4" />}
                      onPress={() =>
                        cancelarTransferencia(selectedTransferencia)
                      }
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Informações da Transferência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-3">Loja de Origem</h3>
                <Card className="border">
                  <CardBody className="p-4">
                    <h4 className="font-medium">
                      {selectedTransferencia.loja_origem?.nome}
                    </h4>
                    {selectedTransferencia.loja_origem?.endereco && (
                      <p className="text-sm text-default-500">
                        {selectedTransferencia.loja_origem.endereco}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </div>

              <div>
                <h3 className="font-medium mb-3">Loja de Destino</h3>
                <Card className="border">
                  <CardBody className="p-4">
                    <h4 className="font-medium">
                      {selectedTransferencia.loja_destino?.nome}
                    </h4>
                    {selectedTransferencia.loja_destino?.endereco && (
                      <p className="text-sm text-default-500">
                        {selectedTransferencia.loja_destino.endereco}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Observações */}
            {selectedTransferencia.observacoes && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Observações</h3>
                <Card className="border">
                  <CardBody className="p-4">
                    <p className="text-sm">
                      {selectedTransferencia.observacoes}
                    </p>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* Itens da Transferência */}
            <div>
              <h3 className="font-medium mb-3">Itens da Transferência</h3>
              <Table aria-label="Itens da transferência">
                <TableHeader>
                  <TableColumn>PRODUTO</TableColumn>
                  <TableColumn>MARCA/MODELO</TableColumn>
                  <TableColumn>QUANTIDADE</TableColumn>
                </TableHeader>
                <TableBody>
                  {selectedTransferencia.itens?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.produto?.descricao || "Produto não encontrado"}
                      </TableCell>
                      <TableCell>
                        {item.produto?.marca}{" "}
                        {item.produto?.modelo && `- ${item.produto.modelo}`}
                      </TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
