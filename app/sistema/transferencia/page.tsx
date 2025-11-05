"use client";

import { useEffect, useState } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { useAuthStore } from "@/store/authZustand";
import { supabase } from "@/lib/supabaseClient";
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
  Alert,
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
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import {
  BuildingStorefrontIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

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

  // Estado para busca de produtos por item
  const [productSearchTerms, setProductSearchTerms] = useState<{
    [key: number]: string;
  }>({});

  // Estado para paginação de produtos na busca
  const [productPages, setProductPages] = useState<{
    [key: number]: number;
  }>({});

  const PRODUCTS_PER_PAGE = 10;

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

  // Sistema de alertas e confirmações personalizados
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "primary";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    setAlertDialog({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertDialog({ ...alertDialog, isOpen: false });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: "danger" | "warning" | "primary";
    }
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText || "Confirmar",
      cancelText: options?.cancelText || "Cancelar",
      type: options?.type || "primary",
    });
  };

  const closeConfirm = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    closeConfirm();
  };

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

    // Limpar termos de busca quando mudar loja de origem
    setProductSearchTerms({});
  }, [formData.loja_origem_id, estoque]);

  // Normalização de texto para busca (case/acentos/pontuação)
  function normalizeText(text?: string): string {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-z0-9]+/g, " ") // mantém letras/números e espaços
      .trim();
  }

  // Função para atualizar termo de busca de produto por item
  function updateProductSearchTerm(itemIndex: number, searchTerm: string) {
    setProductSearchTerms((prev) => ({
      ...prev,
      [itemIndex]: searchTerm,
    }));
    // Resetar para primeira página quando buscar
    setProductPages((prev) => ({
      ...prev,
      [itemIndex]: 1,
    }));
  }

  // Função para atualizar página de produtos
  function updateProductPage(itemIndex: number, page: number) {
    setProductPages((prev) => ({
      ...prev,
      [itemIndex]: page,
    }));
  }

  // Função para filtrar produtos baseado na busca (multi-termos)
  function getFilteredProducts(itemIndex: number): EstoqueItem[] {
    const searchTerm = productSearchTerms[itemIndex] || "";
    if (!searchTerm.trim()) {
      return produtosOrigem;
    }

    // Busca multi-termos: cada termo precisa existir (parcial) em algum campo
    const tokens = normalizeText(searchTerm).split(" ").filter(Boolean);

    return produtosOrigem.filter((produto) => {
      const composite = normalizeText(
        [
          produto.id.toString(),
          produto.descricao,
          produto.modelo,
          produto.marca,
          produto.compativel,
        ].join(" ")
      );

      // Todos os termos precisam estar presentes
      return tokens.every((token) => composite.includes(token));
    });
  }

  // Função para pegar produtos paginados
  function getPaginatedProducts(itemIndex: number): {
    products: EstoqueItem[];
    totalPages: number;
    currentPage: number;
  } {
    const filtered = getFilteredProducts(itemIndex);
    const currentPage = productPages[itemIndex] || 1;
    const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const products = filtered.slice(startIndex, endIndex);

    return {
      products,
      totalPages,
      currentPage,
    };
  }

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

    // Limpar o termo de busca para este item
    setProductSearchTerms((prev) => {
      const newTerms = { ...prev };
      delete newTerms[index];
      // Reindexar os termos restantes
      const reindexedTerms: { [key: number]: string } = {};
      Object.keys(newTerms).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexedTerms[keyNum - 1] = newTerms[keyNum];
        } else {
          reindexedTerms[keyNum] = newTerms[keyNum];
        }
      });
      return reindexedTerms;
    });
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
      showAlert(
        "warning",
        "Atenção",
        "Selecione as lojas de origem e destino!"
      );
      return;
    }

    if (formData.loja_origem_id === formData.loja_destino_id) {
      showAlert(
        "warning",
        "Atenção",
        "A loja de origem deve ser diferente da loja de destino!"
      );
      return;
    }

    if (!formData.itens || formData.itens.length === 0) {
      showAlert(
        "warning",
        "Atenção",
        "Adicione pelo menos um item à transferência!"
      );
      return;
    }

    // Validar quantidades
    for (const item of formData.itens) {
      if (!item.produto_id || item.quantidade <= 0) {
        showAlert(
          "warning",
          "Atenção",
          "Todos os itens devem ter produto e quantidade válidos!"
        );
        return;
      }

      const quantidadeDisponivel = getQuantidadeLoja(
        item.produto_id,
        formData.loja_origem_id
      );
      if (item.quantidade > quantidadeDisponivel) {
        const produto = estoque.find((p) => p.id === item.produto_id);
        showAlert(
          "error",
          "Quantidade Insuficiente",
          `Não há estoque suficiente para ${produto?.descricao}. Disponível: ${quantidadeDisponivel} unidades`
        );
        return;
      }
    }

    setLoading(true);
    try {
      console.log("🔄 Iniciando criação de transferência...");
      console.log("📋 Dados do formulário:", formData);

      // Registrar quantidade ANTES de criar a transferência
      console.log("\n📊 QUANTIDADE ANTES DA CRIAÇÃO:");
      for (const item of formData.itens || []) {
        const quantidadeAtual = getQuantidadeLoja(
          item.produto_id,
          formData.loja_origem_id!
        );
        const produto = estoque.find((p) => p.id === item.produto_id);
        console.log(
          `   ${produto?.descricao}: ${quantidadeAtual} (será transferido: ${item.quantidade})`
        );
      }

      // Criar transferência
      const transferenciaData = {
        loja_origem_id: formData.loja_origem_id,
        loja_destino_id: formData.loja_destino_id,
        usuario_id: user?.id || 1,
        observacoes: formData.observacoes || null,
        status: "pendente",
      };

      console.log(
        "\n➕ Criando transferência com status PENDENTE:",
        transferenciaData
      );
      console.log(
        "⚠️ IMPORTANTE: O estoque NÃO deve ser alterado nesta etapa!"
      );

      await insertTable("transferencias", transferenciaData);
      console.log("✅ Transferência criada!");

      // Buscar a transferência recém-criada
      console.log("\n🔍 Buscando transferência recém-criada...");
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
        console.log(
          "✅ Transferência encontrada (ID:",
          novaTransferencia.id,
          ")"
        );

        // Criar itens da transferência
        console.log("\n📦 Criando itens da transferência...");
        for (const item of formData.itens) {
          const itemData = {
            transferencia_id: novaTransferencia.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
          };
          console.log("   Criando item:", itemData);
          await insertTable("transferencia_itens", itemData);
        }
        console.log("✅ Todos os itens criados!");

        console.log("\n🔄 Recarregando estoque...");
        await loadEstoque();

        // Verificar quantidade DEPOIS de recarregar
        console.log("\n📊 QUANTIDADE DEPOIS DE RECARREGAR:");
        for (const item of formData.itens || []) {
          const quantidadeDepois = getQuantidadeLoja(
            item.produto_id,
            formData.loja_origem_id!
          );
          const produto = estoque.find((p) => p.id === item.produto_id);
          console.log(`   ${produto?.descricao}: ${quantidadeDepois}`);
        }

        console.log("\n✅ Transferência criada com sucesso!");
        showAlert(
          "success",
          "Transferência Criada!",
          "Transferência criada com sucesso! Status: PENDENTE (o estoque não foi alterado ainda)"
        );
        await loadTransferencias();
        setViewMode("list");
        clearForm();
      } else {
        throw new Error("Não foi possível encontrar a transferência criada");
      }
    } catch (error) {
      console.error("Erro ao salvar transferência:", error);
      showAlert(
        "error",
        "Erro ao Salvar",
        `Erro ao salvar transferência: ${getErrorMessage(error)}`
      );
    } finally {
      setLoading(false);
    }
  }

  // Confirmar transferência (executar a movimentação de estoque)
  async function confirmarTransferenciaWrapper(transferencia: Transferencia) {
    showConfirm(
      "Confirmar Transferência",
      "Tem certeza que deseja confirmar esta transferência? O estoque será movimentado da loja de origem para a loja de destino. Esta ação não pode ser desfeita.",
      () => confirmarTransferencia(transferencia),
      {
        confirmText: "Sim, Confirmar",
        cancelText: "Cancelar",
        type: "primary",
      }
    );
  }

  async function confirmarTransferencia(transferencia: Transferencia) {
    setLoading(true);
    try {
      console.log(
        "🔄 Iniciando confirmação da transferência:",
        transferencia.id
      );
      console.log("📦 Total de itens:", transferencia.itens?.length || 0);

      // Validar itens antes de processar
      if (!transferencia.itens || transferencia.itens.length === 0) {
        throw new Error("Transferência não possui itens para processar");
      }

      // Para cada item, atualizar o estoque das lojas
      for (let i = 0; i < transferencia.itens.length; i++) {
        const item = transferencia.itens[i];
        const produto = item.produto;

        console.log(
          `\n📦 Processando item ${i + 1}/${transferencia.itens.length}`
        );

        if (!produto) {
          console.warn(`⚠️ Item ${i + 1} sem produto, pulando...`);
          continue;
        }

        console.log(`   Produto: ${produto.descricao} (ID: ${produto.id})`);
        console.log(`   Quantidade a transferir: ${item.quantidade}`);

        // Diminuir quantidade da loja origem
        const quantidadeOrigem = getQuantidadeLoja(
          produto.id,
          transferencia.loja_origem_id
        );
        console.log(`   Quantidade na origem: ${quantidadeOrigem}`);

        if (quantidadeOrigem < item.quantidade) {
          throw new Error(
            `Quantidade insuficiente de ${produto.descricao} na loja origem. Disponível: ${quantidadeOrigem}, Necessário: ${item.quantidade}`
          );
        }

        const novaQuantidadeOrigem = quantidadeOrigem - item.quantidade;
        console.log(`   Nova quantidade origem: ${novaQuantidadeOrigem}`);

        await updateEstoqueLoja(
          produto.id,
          transferencia.loja_origem_id,
          novaQuantidadeOrigem
        );

        // Recarregar estoque para obter valores atualizados
        console.log("🔄 Recarregando estoque após atualizar origem...");
        await loadEstoque();

        // Aumentar quantidade da loja destino
        const quantidadeDestino = getQuantidadeLoja(
          produto.id,
          transferencia.loja_destino_id
        );
        console.log(`   Quantidade no destino: ${quantidadeDestino}`);

        const novaQuantidadeDestino = quantidadeDestino + item.quantidade;
        console.log(`   Nova quantidade destino: ${novaQuantidadeDestino}`);

        await updateEstoqueLoja(
          produto.id,
          transferencia.loja_destino_id,
          novaQuantidadeDestino
        );

        // Recarregar estoque após atualizar destino
        console.log("🔄 Recarregando estoque após atualizar destino...");
        await loadEstoque();

        console.log(`✅ Item ${i + 1} processado com sucesso!`);
      }

      // Atualizar status da transferência
      console.log("\n🔄 Atualizando status da transferência...");
      const { error: updateError } = await supabase
        .from("transferencias")
        .update({
          status: "concluida",
          updatedat: new Date().toISOString(),
        })
        .eq("id", transferencia.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar status:", updateError);
        throw updateError;
      }

      console.log("✅ Transferência confirmada com sucesso!");
      showAlert(
        "success",
        "Sucesso!",
        "Transferência confirmada e estoque atualizado com sucesso!"
      );

      // Recarregar dados
      console.log("🔄 Recarregando dados...");
      await loadTransferencias();
      await loadEstoque();
      console.log("✅ Dados recarregados!");
    } catch (error) {
      console.error("❌ Erro ao confirmar transferência:", error);
      showAlert(
        "error",
        "Erro ao Confirmar",
        `Erro ao confirmar transferência: ${getErrorMessage(error)}`
      );
    } finally {
      setLoading(false);
    }
  }

  // Cancelar transferência
  async function cancelarTransferenciaWrapper(transferencia: Transferencia) {
    // Verificar se a transferência foi concluída
    const foiConcluida = transferencia.status === "concluida";

    const title = foiConcluida
      ? "ATENÇÃO: Reverter Transferência"
      : "Cancelar Transferência";
    const message = foiConcluida
      ? `Esta transferência já foi CONCLUÍDA!\n\nAo cancelar, o estoque será REVERTIDO:\n• ${transferencia.loja_destino?.nome}: -${transferencia.itens?.reduce((sum, item) => sum + item.quantidade, 0) || 0} unidades\n• ${transferencia.loja_origem?.nome}: +${transferencia.itens?.reduce((sum, item) => sum + item.quantidade, 0) || 0} unidades\n\nDeseja continuar?`
      : "Tem certeza que deseja cancelar esta transferência?";

    showConfirm(title, message, () => cancelarTransferencia(transferencia), {
      confirmText: foiConcluida ? "Sim, Reverter" : "Sim, Cancelar",
      cancelText: "Não",
      type: "danger",
    });
  }

  async function cancelarTransferencia(transferencia: Transferencia) {
    // Verificar se a transferência foi concluída
    const foiConcluida = transferencia.status === "concluida";

    setLoading(true);
    try {
      console.log("🔄 Cancelando transferência:", transferencia.id);
      console.log("📊 Status atual:", transferencia.status);

      // Se a transferência foi concluída, reverter o estoque primeiro
      if (foiConcluida) {
        console.log("\n⚠️ Transferência CONCLUÍDA detectada!");
        console.log("🔄 Revertendo movimentação de estoque...");

        // Validar itens antes de processar
        if (!transferencia.itens || transferencia.itens.length === 0) {
          throw new Error("Transferência não possui itens para reverter");
        }

        // Para cada item, reverter a movimentação
        for (let i = 0; i < transferencia.itens.length; i++) {
          const item = transferencia.itens[i];
          const produto = item.produto;

          console.log(
            `\n📦 Revertendo item ${i + 1}/${transferencia.itens.length}`
          );

          if (!produto) {
            console.warn(`⚠️ Item ${i + 1} sem produto, pulando...`);
            continue;
          }

          console.log(`   Produto: ${produto.descricao} (ID: ${produto.id})`);
          console.log(`   Quantidade a reverter: ${item.quantidade}`);

          // Devolver quantidade para a loja ORIGEM
          const quantidadeOrigem = getQuantidadeLoja(
            produto.id,
            transferencia.loja_origem_id
          );
          console.log(`   Quantidade atual na origem: ${quantidadeOrigem}`);

          const novaQuantidadeOrigem = quantidadeOrigem + item.quantidade;
          console.log(`   Nova quantidade origem: ${novaQuantidadeOrigem}`);

          await updateEstoqueLoja(
            produto.id,
            transferencia.loja_origem_id,
            novaQuantidadeOrigem
          );

          // Recarregar estoque para obter valores atualizados
          console.log("🔄 Recarregando estoque após devolver para origem...");
          await loadEstoque();

          // Retirar quantidade da loja DESTINO
          const quantidadeDestino = getQuantidadeLoja(
            produto.id,
            transferencia.loja_destino_id
          );
          console.log(`   Quantidade atual no destino: ${quantidadeDestino}`);

          if (quantidadeDestino < item.quantidade) {
            console.warn(
              `⚠️ AVISO: Quantidade no destino (${quantidadeDestino}) é menor que a quantidade transferida (${item.quantidade})`
            );
            console.warn("   Continuando mesmo assim...");
          }

          const novaQuantidadeDestino = quantidadeDestino - item.quantidade;
          console.log(`   Nova quantidade destino: ${novaQuantidadeDestino}`);

          await updateEstoqueLoja(
            produto.id,
            transferencia.loja_destino_id,
            novaQuantidadeDestino
          );

          // Recarregar estoque após retirar do destino
          console.log("🔄 Recarregando estoque após retirar do destino...");
          await loadEstoque();

          console.log(`✅ Item ${i + 1} revertido com sucesso!`);
        }

        console.log("\n✅ Estoque revertido com sucesso!");
      } else {
        console.log("ℹ️ Transferência PENDENTE - não há estoque para reverter");
      }

      // Atualizar status da transferência para cancelada
      console.log("\n🔄 Atualizando status para CANCELADA...");
      const { error: updateError } = await supabase
        .from("transferencias")
        .update({
          status: "cancelada",
          updatedat: new Date().toISOString(),
        })
        .eq("id", transferencia.id);

      if (updateError) {
        console.error("❌ Erro ao cancelar:", updateError);
        throw updateError;
      }

      console.log("✅ Transferência cancelada!");
      showAlert(
        "success",
        "Transferência Cancelada!",
        foiConcluida
          ? "Transferência cancelada e estoque revertido com sucesso!"
          : "Transferência cancelada!"
      );

      // Recarregar dados
      console.log("🔄 Recarregando dados...");
      await loadTransferencias();
      await loadEstoque();
      console.log("✅ Dados recarregados!");
    } catch (error) {
      console.error("❌ Erro ao cancelar transferência:", error);
      showAlert(
        "error",
        "Erro ao Cancelar",
        `Erro ao cancelar transferência: ${getErrorMessage(error)}`
      );
    } finally {
      setLoading(false);
    }
  }

  // Função auxiliar para atualizar estoque de loja (otimizada)
  async function updateEstoqueLoja(
    produtoId: number,
    lojaId: number,
    quantidade: number
  ) {
    try {
      console.log(
        `🔄 Atualizando estoque - Produto: ${produtoId}, Loja: ${lojaId}, Quantidade: ${quantidade}`
      );

      // VALIDAÇÃO: Quantidade não pode ser negativa
      if (quantidade < 0) {
        const produto = estoque.find((p) => p.id === produtoId);
        const loja = lojas.find((l) => l.id === lojaId);
        throw new Error(
          `⛔ ERRO CRÍTICO: Tentativa de definir quantidade NEGATIVA!\n` +
            `Produto: ${produto?.descricao || produtoId}\n` +
            `Loja: ${loja?.nome || lojaId}\n` +
            `Quantidade tentada: ${quantidade}\n\n` +
            `Esta operação foi BLOQUEADA para evitar inconsistência no estoque.`
        );
      }

      // Buscar registro específico com query otimizada
      const { data: estoqueExistente, error: fetchError } = await supabase
        .from("estoque_lojas")
        .select("*")
        .eq("produto_id", produtoId)
        .eq("loja_id", lojaId)
        .maybeSingle();

      if (fetchError) {
        console.error("❌ Erro ao buscar estoque:", fetchError);
        throw fetchError;
      }

      if (estoqueExistente) {
        // Atualizar registro existente
        console.log(
          `✏️ Atualizando registro existente (ID: ${estoqueExistente.id})`
        );

        const { error: updateError } = await supabase
          .from("estoque_lojas")
          .update({
            quantidade: quantidade,
            updatedat: new Date().toISOString(),
          })
          .eq("id", estoqueExistente.id);

        if (updateError) {
          console.error("❌ Erro ao atualizar:", updateError);
          throw updateError;
        }

        console.log("✅ Estoque atualizado com sucesso!");
      } else if (quantidade > 0) {
        // Criar novo registro
        console.log("➕ Criando novo registro de estoque");

        const { error: insertError } = await supabase
          .from("estoque_lojas")
          .insert({
            produto_id: produtoId,
            loja_id: lojaId,
            quantidade: quantidade,
          });

        if (insertError) {
          console.error("❌ Erro ao inserir:", insertError);
          throw insertError;
        }

        console.log("✅ Novo registro criado com sucesso!");
      } else {
        console.log("⚠️ Quantidade zero e registro não existe - nada a fazer");
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar estoque da loja:", error);
      throw error;
    }
  }

  // Limpar formulário
  function clearForm() {
    setFormData({});
    setSelectedTransferencia(null);
    setIsEditing(false);
    setProductSearchTerms({});
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
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Cabeçalho Moderno */}
        <div className="mb-8">
          <Card className="shadow-sm p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-900 dark:bg-gray-100 rounded-xl flex items-center justify-center hidden sm:flex">
                    <ArrowRightIcon className="w-6 h-6 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      Transferências entre Lojas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Gerencie movimentações de produtos de forma inteligente e
                      eficiente
                    </p>
                  </div>
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="flex gap-4">
                <div className="text-center bg-gray-600 text-white px-4 py-3 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold">
                    {
                      transferencias.filter((t) => t.status === "pendente")
                        .length
                    }
                  </div>
                  <div className="text-xs opacity-90">Pendentes</div>
                </div>
                <div className="text-center bg-gray-800 text-white px-4 py-3 rounded-xl shadow-sm">
                  <div className="text-2xl font-bold">
                    {
                      transferencias.filter((t) => t.status === "concluida")
                        .length
                    }
                  </div>
                  <div className="text-xs opacity-90">Concluídas</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Modo Lista */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {/* Filtros Modernos */}
            <Card className="shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Filtros e Busca
                </h2>
                {canCreateTransferencias && (
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="w-5 h-5" />}
                    onPress={() => setViewMode("create")}
                    className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 transition-colors"
                    size="lg"
                  >
                    <span className="hidden sm:inline">Nova Transferência</span>
                    <span className="sm:hidden">Nova</span>
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid lg:grid-cols-1 grid-cols-1 gap-4">
                  <Input
                    placeholder=" Buscar por loja, observação ou ID..."
                    value={advancedFilters.search}
                    onChange={(e) =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    startContent={
                      <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                    }
                    classNames={{
                      input: "text-base",
                      inputWrapper:
                        "bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-blue-400 focus-within:border-blue-500 transition-colors duration-200",
                    }}
                    size="lg"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    classNames={{
                      trigger:
                        "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 data-[open=true]:border-gray-500",
                    }}
                  >
                    <SelectItem key="pendente">Pendente</SelectItem>
                    <SelectItem key="concluida">Concluída</SelectItem>
                    <SelectItem key="cancelada">Cancelada</SelectItem>
                  </Select>

                  <Select
                    placeholder="Loja de Origem"
                    selectedKeys={
                      advancedFilters.lojaOrigem
                        ? [advancedFilters.lojaOrigem]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        lojaOrigem: key || "",
                      }));
                    }}
                    classNames={{
                      trigger:
                        "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 data-[open=true]:border-gray-500",
                    }}
                  >
                    {lojas.map((loja) => (
                      <SelectItem key={loja.id.toString()}>
                        {loja.nome}
                      </SelectItem>
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
                    classNames={{
                      trigger:
                        "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 data-[open=true]:border-gray-500",
                    }}
                  >
                    {lojas.map((loja) => (
                      <SelectItem key={loja.id.toString()}>
                        {loja.nome}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    type="date"
                    label="Data Início"
                    value={advancedFilters.dataInicio}
                    onChange={(e) =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        dataInicio: e.target.value,
                      }))
                    }
                    classNames={{
                      inputWrapper:
                        "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 focus-within:border-gray-500",
                    }}
                  />

                  <Input
                    type="date"
                    label="Data Fim"
                    value={advancedFilters.dataFim}
                    onChange={(e) =>
                      setAdvancedFilters((prev) => ({
                        ...prev,
                        dataFim: e.target.value,
                      }))
                    }
                    classNames={{
                      inputWrapper:
                        "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 focus-within:border-gray-500",
                    }}
                  />
                </div>

                {(advancedFilters.search ||
                  advancedFilters.status ||
                  advancedFilters.lojaOrigem ||
                  advancedFilters.lojaDestino ||
                  advancedFilters.dataInicio ||
                  advancedFilters.dataFim) && (
                  <div className="flex justify-end">
                    <Button
                      variant="flat"
                      color="default"
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
                      startContent={<XCircleIcon className="w-4 h-4" />}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Lista de Transferências Moderna */}
            <div className="space-y-4">
              {currentItems.map((transferencia) => {
                const statusConfig = STATUS_CONFIG[transferencia.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={transferencia.id} className="group">
                    <Card className=" ">
                      <CardBody className="p-6">
                        {/* Header da Transferência */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                                transferencia.status === "pendente"
                                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                  : transferencia.status === "concluida"
                                    ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                    : "bg-gradient-to-r from-red-400 to-pink-500"
                              }`}
                            >
                              <StatusIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-lg font-bold text-slate-800 dark:text-white">
                                  Transferência #{transferencia.id}
                                </span>
                                <Chip
                                  color={statusConfig.color}
                                  variant="flat"
                                  size="sm"
                                  className="font-medium"
                                >
                                  {statusConfig.label}
                                </Chip>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Criado em{" "}
                                {new Date(
                                  transferencia.createdat
                                ).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              onPress={() => {
                                setSelectedTransferencia(transferencia);
                                setViewMode("view");
                              }}
                              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                              title="Visualizar detalhes"
                            >
                              <EyeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Button>

                            {transferencia.status === "pendente" && (
                              <>
                                {canConfirmTransferencias && (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    onPress={() =>
                                      confirmarTransferenciaWrapper(
                                        transferencia
                                      )
                                    }
                                    className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800"
                                    title="Confirmar transferência"
                                  >
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  </Button>
                                )}

                                {(canDeleteTransferencias ||
                                  canEditTransferencias) && (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    onPress={() =>
                                      cancelarTransferenciaWrapper(
                                        transferencia
                                      )
                                    }
                                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
                                    title="Cancelar transferência"
                                  >
                                    <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Fluxo de Transferência */}
                        <div className="mb-4">
                          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="flex-1">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Origem
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                  {transferencia.loja_origem?.nome ||
                                    "Loja não encontrada"}
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0 relative">
                              <div className="w-8 h-8 bg-gray-600 dark:bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
                                <ArrowRightIcon className="w-4 h-4 text-white dark:text-gray-900" />
                              </div>
                              {transferencia.status === "concluida" && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 dark:bg-gray-300 rounded-full flex items-center justify-center">
                                  <CheckCircleIcon className="w-3 h-3 text-white dark:text-gray-900" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    Destino
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                  {transferencia.loja_destino?.nome ||
                                    "Loja não encontrada"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Informações Detalhadas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Data Transferência
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {new Date(
                                transferencia.data_transferencia
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Itens
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {transferencia.itens?.length || 0} produto(s)
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Criado
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {new Date(
                                transferencia.createdat
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Atualizado
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {new Date(
                                transferencia.updatedat
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        {/* Observações */}
                        {transferencia.observacoes && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                                Observações
                              </span>
                            </div>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              {transferencia.observacoes}
                            </p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                );
              })}

              {/* Estado Vazio */}
              {filteredTransferencias.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl p-8 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ArrowRightIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      {searchTerm || statusFilter || lojaFilter
                        ? "Nenhuma transferência encontrada"
                        : "Nenhuma transferência cadastrada"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {searchTerm || statusFilter || lojaFilter
                        ? "Tente ajustar os filtros ou buscar por outros termos"
                        : canCreateTransferencias
                          ? "Comece criando sua primeira transferência entre lojas"
                          : "Entre em contato com o administrador para criar transferências"}
                    </p>
                    {canCreateTransferencias &&
                      !(searchTerm || statusFilter || lojaFilter) && (
                        <Button
                          color="primary"
                          onPress={() => setViewMode("create")}
                          startContent={<PlusIcon className="w-4 h-4" />}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                        >
                          Criar Primera Transferência
                        </Button>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Paginação Moderna */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg p-4">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    showControls
                    classNames={{
                      cursor:
                        "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg",
                      item: "hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modo Criação - só renderiza se tem permissão */}
        {viewMode === "create" && canCreateTransferencias && (
          <Card className="shadow-sm  md:p-8">
            <div className="p-6 rounded-t-2xl border-b border-blue-200 dark:border-slate-600">
              <div className="flex items-center justify-between ">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center hidden lg:flex">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                      Nova Transferência
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Configure uma nova movimentação entre lojas
                    </p>
                  </div>
                </div>
                <Button
                  variant="flat"
                  onPress={() => setViewMode("list")}
                  className="hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  ← Voltar
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Seleção de Lojas Moderna */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-default rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Selecionar Lojas
                  </h3>
                </div>

                <div className="space-y-8">
                  {/* Seleção de Loja de Origem com Cards */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      Loja de Origem
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (De onde sairão os produtos)
                      </span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lojas.map((loja) => {
                        const isSelected = formData.loja_origem_id === loja.id;
                        return (
                          <div
                            key={loja.id}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                loja_origem_id: loja.id,
                                loja_destino_id:
                                  formData.loja_destino_id === loja.id
                                    ? undefined
                                    : formData.loja_destino_id,
                                itens: [], // Limpar itens quando mudar loja origem
                              });
                            }}
                            className={`cursor-pointer transition-all duration-300 rounded-xl p-4 border-2 hover:shadow-lg ${
                              isSelected
                                ? "border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-lg scale-105"
                                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSelected
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                <BuildingStorefrontIcon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h4
                                  className={`font-semibold ${
                                    isSelected
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-slate-800 dark:text-white"
                                  }`}
                                >
                                  {loja.nome}
                                </h4>
                                {loja.endereco && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    <MapPinIcon className="w-4 h-4 inline-block " />{" "}
                                    {loja.endereco}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 bg-gray-700 dark:bg-gray-300 rounded-full flex items-center justify-center">
                                  <CheckCircleIcon className="w-3 h-3 text-white dark:text-gray-900" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seleção de Loja de Destino com Cards */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      Loja de Destino
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (Para onde irão os produtos)
                      </span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lojas
                        .filter((loja) => loja.id !== formData.loja_origem_id)
                        .map((loja) => {
                          const isSelected =
                            formData.loja_destino_id === loja.id;
                          const isDisabled =
                            formData.loja_origem_id === loja.id;

                          return (
                            <div
                              key={loja.id}
                              onClick={() => {
                                if (!isDisabled) {
                                  setFormData({
                                    ...formData,
                                    loja_destino_id: loja.id,
                                  });
                                }
                              }}
                              className={`transition-all duration-300 rounded-xl p-4 border-2 ${
                                isDisabled
                                  ? "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50"
                                  : isSelected
                                    ? "border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-lg scale-105 cursor-pointer"
                                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer hover:shadow-lg"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isDisabled
                                      ? "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                      : isSelected
                                        ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  <BuildingStorefrontIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                  <h4
                                    className={`font-semibold ${
                                      isDisabled
                                        ? "text-slate-400 dark:text-slate-500"
                                        : isSelected
                                          ? "text-green-700 dark:text-green-300"
                                          : "text-slate-800 dark:text-white"
                                    }`}
                                  >
                                    {loja.nome}
                                  </h4>
                                  {loja.endereco && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      <MapPinIcon className="w-4 h-4 inline-block " />{" "}
                                      {loja.endereco}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 bg-gray-700 dark:bg-gray-300 rounded-full flex items-center justify-center">
                                    <CheckCircleIcon className="w-3 h-3 text-white dark:text-gray-900" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {!formData.loja_origem_id && (
                      <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                        <Alert
                          variant="faded"
                          color="warning"
                          className="justify-center bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300"
                        >
                          Selecione a loja de origem para escolher a loja de
                          destino
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-default rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Observações (Opcional)
                  </h3>
                </div>

                <Textarea
                  label="Observações"
                  placeholder="Adicione informações importantes sobre esta transferência..."
                  value={formData.observacoes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  classNames={{
                    input: "bg-white/70 dark:bg-slate-700/70",
                    inputWrapper:
                      "border-slate-200 dark:border-slate-600 hover:border-blue-400 focus-within:border-blue-500",
                  }}
                  minRows={3}
                  maxRows={6}
                />
              </div>

              {/* Itens da Transferência - SEÇÃO COMPLETAMENTE RENOVADA */}
              {formData.loja_origem_id && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-default rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Produtos para Transferir
                    </h3>
                  </div>

                  {produtosOrigem.length === 0 ? (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 text-center">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                        Nenhum produto disponível
                      </h4>
                      <p className="text-amber-700 dark:text-amber-300">
                        A loja selecionada não possui produtos em estoque para
                        transferir
                      </p>
                    </div>
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
                          <div
                            key={index}
                            className="bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <div className="p-6">
                              <div className="flex gap-4 items-start">
                                {/* Seleção de Produto COMPLETAMENTE RENOVADA */}
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block flex items-center gap-2">
                                    Selecionar Produto
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="primary"
                                    >
                                      {produtosOrigem.length} disponíveis
                                    </Chip>
                                  </label>

                                  {/* Grid de Produtos */}
                                  <div className="space-y-3">
                                    {!item.produto_id ? (
                                      <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 sticky top-0 z-10">
                                          <Input
                                            placeholder="Buscar produto por nome, marca, modelo..."
                                            size="sm"
                                            value={
                                              productSearchTerms[index] || ""
                                            }
                                            onChange={(e) =>
                                              updateProductSearchTerm(
                                                index,
                                                e.target.value
                                              )
                                            }
                                            classNames={{
                                              inputWrapper:
                                                "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-400 focus-within:border-blue-500",
                                            }}
                                            startContent={
                                              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                                            }
                                            isClearable
                                            onClear={() =>
                                              updateProductSearchTerm(index, "")
                                            }
                                          />
                                          {(() => {
                                            const filtered =
                                              getFilteredProducts(index);
                                            const paginated =
                                              getPaginatedProducts(index);
                                            const startIndex =
                                              (paginated.currentPage - 1) *
                                                PRODUCTS_PER_PAGE +
                                              1;
                                            const endIndex = Math.min(
                                              startIndex +
                                                paginated.products.length -
                                                1,
                                              filtered.length
                                            );

                                            return (
                                              <div className="mt-2 flex items-center justify-between text-xs">
                                                <div className="text-slate-500 dark:text-slate-400">
                                                  Mostrando {startIndex}-
                                                  {endIndex} de{" "}
                                                  {filtered.length} produtos
                                                </div>
                                                {paginated.totalPages > 1 && (
                                                  <div className="flex items-center gap-2">
                                                    <Button
                                                      size="sm"
                                                      isIconOnly
                                                      variant="flat"
                                                      isDisabled={
                                                        paginated.currentPage ===
                                                        1
                                                      }
                                                      onPress={() =>
                                                        updateProductPage(
                                                          index,
                                                          paginated.currentPage -
                                                            1
                                                        )
                                                      }
                                                      className="min-w-unit-8 w-8 h-8"
                                                    >
                                                      <ChevronLeftIcon className="w-4 h-4" />
                                                    </Button>
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                                      {paginated.currentPage}/
                                                      {paginated.totalPages}
                                                    </span>
                                                    <Button
                                                      size="sm"
                                                      isIconOnly
                                                      variant="flat"
                                                      isDisabled={
                                                        paginated.currentPage ===
                                                        paginated.totalPages
                                                      }
                                                      onPress={() =>
                                                        updateProductPage(
                                                          index,
                                                          paginated.currentPage +
                                                            1
                                                        )
                                                      }
                                                      className="min-w-unit-8 w-8 h-8"
                                                    >
                                                      <ChevronRightIcon className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 p-3">
                                          {(() => {
                                            const paginated =
                                              getPaginatedProducts(index);
                                            return paginated.products.length >
                                              0 ? (
                                              paginated.products.map(
                                                (produto) => {
                                                  const quantidade =
                                                    getQuantidadeLoja(
                                                      produto.id,
                                                      formData.loja_origem_id!
                                                    );
                                                  return (
                                                    <div
                                                      key={produto.id}
                                                      onClick={() => {
                                                        atualizarItem(
                                                          index,
                                                          "produto_id",
                                                          produto.id
                                                        );
                                                        // Limpar busca após seleção
                                                        updateProductSearchTerm(
                                                          index,
                                                          ""
                                                        );
                                                      }}
                                                      className="cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200"
                                                    >
                                                      <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                                                          {produto.descricao}
                                                        </h4>
                                                        <Chip
                                                          size="sm"
                                                          variant="flat"
                                                          color={
                                                            quantidade > 10
                                                              ? "success"
                                                              : quantidade > 5
                                                                ? "warning"
                                                                : "danger"
                                                          }
                                                          className="ml-2 flex-shrink-0"
                                                        >
                                                          {quantidade} un.
                                                        </Chip>
                                                      </div>

                                                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                        {produto.marca && (
                                                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            {produto.marca}
                                                          </span>
                                                        )}
                                                        {produto.modelo && (
                                                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            {produto.modelo}
                                                          </span>
                                                        )}
                                                        {produto.compativel && (
                                                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            {produto.compativel}
                                                          </span>
                                                        )}
                                                      </div>

                                                      {produto.preco_venda && (
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                                            R${" "}
                                                            {produto.preco_venda.toFixed(
                                                              2
                                                            )}
                                                          </span>
                                                          <Button
                                                            size="sm"
                                                            color="primary"
                                                            variant="flat"
                                                            className="text-xs"
                                                          >
                                                            Selecionar
                                                          </Button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )
                                            ) : (
                                              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                                <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">
                                                  {productSearchTerms[index]
                                                    ? `Nenhum produto encontrado para "${productSearchTerms[index]}"`
                                                    : "Nenhum produto disponível"}
                                                </p>
                                                {productSearchTerms[index] && (
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() =>
                                                      updateProductSearchTerm(
                                                        index,
                                                        ""
                                                      )
                                                    }
                                                    className="mt-2"
                                                  >
                                                    Limpar busca
                                                  </Button>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ) : (
                                      /* Produto Selecionado */
                                      <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-600 dark:bg-gray-400 rounded-lg flex items-center justify-center">
                                              <CheckCircleIcon className="w-6 h-6 text-white dark:text-gray-900" />
                                            </div>
                                            <div>
                                              <h4 className="font-bold text-gray-800 dark:text-gray-200">
                                                {produto?.descricao}
                                              </h4>
                                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                                Produto selecionado
                                              </p>
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            onPress={() => {
                                              atualizarItem(
                                                index,
                                                "produto_id",
                                                0
                                              );
                                              atualizarItem(
                                                index,
                                                "quantidade",
                                                0
                                              );
                                            }}
                                            className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
                                          >
                                            Alterar
                                          </Button>
                                        </div>

                                        {produto && (
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                            <div className="bg-white/60 dark:bg-slate-800/60 p-2 rounded">
                                              <p className="text-slate-600 dark:text-slate-400">
                                                Marca
                                              </p>
                                              <p className="font-semibold text-slate-800 dark:text-white">
                                                {produto.marca || "N/A"}
                                              </p>
                                            </div>
                                            <div className="bg-white/60 dark:bg-slate-800/60 p-2 rounded">
                                              <p className="text-slate-600 dark:text-slate-400">
                                                Modelo
                                              </p>
                                              <p className="font-semibold text-slate-800 dark:text-white">
                                                {produto.modelo || "N/A"}
                                              </p>
                                            </div>
                                            <div className="bg-white/60 dark:bg-slate-800/60 p-2 rounded">
                                              <p className="text-slate-600 dark:text-slate-400">
                                                Disponível
                                              </p>
                                              <p className="font-bold text-blue-600 dark:text-blue-400">
                                                {quantidadeDisponivel} un.
                                              </p>
                                            </div>
                                            <div className="bg-white/60 dark:bg-slate-800/60 p-2 rounded">
                                              <p className="text-slate-600 dark:text-slate-400">
                                                Preço
                                              </p>
                                              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                R${" "}
                                                {produto.preco_venda?.toFixed(
                                                  2
                                                ) || "0,00"}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Input de Quantidade COMPLETAMENTE RENOVADO */}
                                <div className="w-64">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                                    Quantidade a Transferir
                                  </label>

                                  {item.produto_id ? (
                                    <div className="space-y-3">
                                      {/* Controles de Quantidade */}
                                      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Disponível:{" "}
                                            <strong>
                                              {quantidadeDisponivel} un.
                                            </strong>
                                          </span>
                                          <span className="text-xs text-blue-600 dark:text-blue-400">
                                            Máximo: {quantidadeDisponivel}
                                          </span>
                                        </div>

                                        {/* Slider de Quantidade */}
                                        <div className="space-y-4">
                                          <div className="flex items-center gap-3">
                                            <Button
                                              isIconOnly
                                              size="sm"
                                              variant="flat"
                                              onPress={() => {
                                                const novaQuantidade = Math.max(
                                                  0,
                                                  (item.quantidade || 0) - 1
                                                );
                                                atualizarItem(
                                                  index,
                                                  "quantidade",
                                                  novaQuantidade
                                                );
                                              }}
                                              className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50 min-w-8 h-8"
                                              isDisabled={
                                                !item.quantidade ||
                                                item.quantidade <= 0
                                              }
                                            >
                                              -
                                            </Button>

                                            <div className="flex-1 relative">
                                              <Input
                                                type="number"
                                                value={
                                                  item.quantidade?.toString() ||
                                                  "0"
                                                }
                                                onChange={(e) => {
                                                  const valor =
                                                    Number(e.target.value) || 0;
                                                  atualizarItem(
                                                    index,
                                                    "quantidade",
                                                    Math.min(
                                                      valor,
                                                      quantidadeDisponivel
                                                    )
                                                  );
                                                }}
                                                min="0"
                                                max={quantidadeDisponivel}
                                                classNames={{
                                                  input:
                                                    "text-center font-bold text-2xl text-gray-600 dark:text-gray-400",
                                                  inputWrapper: `border-2 ${
                                                    item.quantidade >
                                                    quantidadeDisponivel
                                                      ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
                                                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                                                  }`,
                                                }}
                                                size="lg"
                                              />
                                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                                                un.
                                              </div>
                                            </div>

                                            <Button
                                              isIconOnly
                                              size="sm"
                                              variant="flat"
                                              onPress={() => {
                                                const novaQuantidade = Math.min(
                                                  quantidadeDisponivel,
                                                  (item.quantidade || 0) + 1
                                                );
                                                atualizarItem(
                                                  index,
                                                  "quantidade",
                                                  novaQuantidade
                                                );
                                              }}
                                              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 min-w-8 h-8"
                                              isDisabled={
                                                item.quantidade >=
                                                quantidadeDisponivel
                                              }
                                            >
                                              +
                                            </Button>
                                          </div>

                                          {/* Barra de Progresso Visual */}
                                          <div className="space-y-2">
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                              <div
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                  item.quantidade >
                                                  quantidadeDisponivel
                                                    ? "bg-red-500"
                                                    : item.quantidade >
                                                        quantidadeDisponivel *
                                                          0.8
                                                      ? "bg-amber-500"
                                                      : "bg-gray-600"
                                                }`}
                                                style={{
                                                  width: `${Math.min(100, ((item.quantidade || 0) / quantidadeDisponivel) * 100)}%`,
                                                }}
                                              />
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                              <span>0</span>
                                              <span>
                                                {quantidadeDisponivel}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Botões de Quantidade Rápida */}
                                          <div className="flex gap-2">
                                            {[25, 50, 75, 100].map(
                                              (percent) => {
                                                const quantidade = Math.floor(
                                                  (quantidadeDisponivel *
                                                    percent) /
                                                    100
                                                );
                                                if (quantidade === 0)
                                                  return null;
                                                return (
                                                  <Button
                                                    key={percent}
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() =>
                                                      atualizarItem(
                                                        index,
                                                        "quantidade",
                                                        quantidade
                                                      )
                                                    }
                                                    className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex-1"
                                                  >
                                                    {percent}%
                                                  </Button>
                                                );
                                              }
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Feedback Visual */}
                                      {item.quantidade > 0 && (
                                        <div
                                          className={`p-3 rounded-lg border ${
                                            item.quantidade >
                                            quantidadeDisponivel
                                              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                                              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                                          }`}
                                        >
                                          {item.quantidade >
                                          quantidadeDisponivel ? (
                                            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                              <ExclamationTriangleIcon className="w-4 h-4" />
                                              <span className="text-sm font-medium">
                                                Quantidade excede o disponível!
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-emerald-700 dark:text-emerald-300 text-sm">
                                              ✓ Transferindo{" "}
                                              <strong>
                                                {item.quantidade} unidade
                                                {item.quantidade > 1 ? "s" : ""}
                                              </strong>
                                              {produto?.preco_venda && (
                                                <span className="block mt-1 font-semibold">
                                                  Valor total: R${" "}
                                                  {(
                                                    produto.preco_venda *
                                                    item.quantidade
                                                  ).toFixed(2)}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center">
                                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Selecione um produto primeiro
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Botão Remover RENOVADO */}
                                <div className="pt-6">
                                  <Button
                                    isIconOnly
                                    color="danger"
                                    variant="flat"
                                    onPress={() => removerItem(index)}
                                    className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 border border-red-200 dark:border-red-700"
                                    title="Remover item"
                                    size="lg"
                                  >
                                    <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                  </Button>
                                </div>
                              </div>

                              {/* Informações do Produto Selecionado RENOVADAS */}
                              {produto && (
                                <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                      <div>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                                          Marca
                                        </p>
                                        <p className="text-slate-800 dark:text-white font-semibold">
                                          {produto.marca || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                      <div>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                                          Modelo
                                        </p>
                                        <p className="text-slate-800 dark:text-white font-semibold">
                                          {produto.modelo || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                      <div>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                                          Disponível
                                        </p>
                                        <p className="text-slate-800 dark:text-white font-bold">
                                          {quantidadeDisponivel} un.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                      <div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                                          A transferir
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">
                                          {item.quantidade || 0} un.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Valor total do item */}
                                  {produto.preco_venda &&
                                    item.quantidade > 0 && (
                                      <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                        <div className="flex items-center justify-between">
                                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                                            Valor total deste item:
                                          </span>
                                          <span className="text-emerald-800 dark:text-emerald-200 font-bold text-lg">
                                            R${" "}
                                            {(
                                              produto.preco_venda *
                                              item.quantidade
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Botão Adicionar Produto (após a lista) */}
                      {formData.loja_origem_id && (
                        <div className="flex justify-center pt-4">
                          <Button
                            color="primary"
                            variant="flat"
                            onPress={adicionarItem}
                            startContent={<PlusIcon className="w-4 h-4" />}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                          >
                            Adicionar Produto
                          </Button>
                        </div>
                      )}

                      {/* Resumo da Transferência RENOVADO */}
                      {formData.itens && formData.itens.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl p-6 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                              Resumo da Transferência
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl">
                              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formData.itens.length}
                              </p>
                              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                Tipo(s) de produto
                              </p>
                            </div>
                            <div className="text-center bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl">
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {formData.itens.reduce(
                                  (total, item) =>
                                    total + (item.quantidade || 0),
                                  0
                                )}
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                Total de unidades
                              </p>
                            </div>
                            <div className="text-center bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl">
                              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
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
                              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                                Valor estimado
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Estado vazio para itens */}
                      {(!formData.itens || formData.itens.length === 0) && (
                        <div className="text-center py-16 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                          <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <PlusIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                            Nenhum produto adicionado
                          </h4>
                          <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Clique em "Adicionar Produto" para começar a montar
                            sua transferência
                          </p>
                          <Button
                            color="primary"
                            variant="solid"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            onPress={adicionarItem}
                            isDisabled={produtosOrigem.length === 0}
                          >
                            Adicionar Primeiro Produto
                          </Button>
                        </div>
                      )}

                      {/* Botão para adicionar mais produtos (aparece após os itens) */}
                      {formData.itens && formData.itens.length > 0 && (
                        <div className="pt-4">
                          <Button
                            color="primary"
                            variant="bordered"
                            size="lg"
                            fullWidth
                            startContent={<PlusIcon className="w-5 h-5" />}
                            onPress={adicionarItem}
                            isDisabled={produtosOrigem.length === 0}
                            className="border-2 border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                          >
                            Adicionar Mais um Produto
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação RENOVADOS */}
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-600">
                <Button
                  variant="flat"
                  onPress={() => setViewMode("list")}
                  className="px-8 py-3 hover:bg-slate-200 dark:hover:bg-slate-600"
                  size="lg"
                >
                  ← Cancelar
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
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  startContent={
                    !loading ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : undefined
                  }
                >
                  {loading ? "Criando..." : "Criar Transferência"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Modo Criação sem permissão */}
        {viewMode === "create" && !canCreateTransferencias && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-red-200 dark:border-red-700 shadow-xl">
            <div className="text-center py-16 px-8">
              <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                Acesso Negado
              </h2>
              <p className="text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
                Você não possui permissão para criar transferências. Entre em
                contato com o administrador do sistema.
              </p>
              <Button
                variant="flat"
                onPress={() => setViewMode("list")}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                ← Voltar à Lista
              </Button>
            </div>
          </div>
        )}

        {/* Modo Visualização */}
        {viewMode === "view" && selectedTransferencia && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl">
            {/* Header da Visualização */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 p-6 rounded-t-2xl border-b border-blue-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      selectedTransferencia.status === "pendente"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : selectedTransferencia.status === "concluida"
                          ? "bg-gradient-to-r from-emerald-400 to-green-500"
                          : "bg-gradient-to-r from-red-400 to-pink-500"
                    }`}
                  >
                    <EyeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      Transferência #{selectedTransferencia.id}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <Chip
                        color={
                          STATUS_CONFIG[selectedTransferencia.status].color
                        }
                        variant="flat"
                        className="font-medium"
                      >
                        {STATUS_CONFIG[selectedTransferencia.status].label}
                      </Chip>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Criado em{" "}
                        {new Date(
                          selectedTransferencia.createdat
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* Botões de ação apenas se tem permissão e status é pendente */}
                  {selectedTransferencia.status === "pendente" && (
                    <>
                      {canConfirmTransferencias && (
                        <Button
                          color="success"
                          variant="flat"
                          startContent={<CheckCircleIcon className="w-4 h-4" />}
                          onPress={() =>
                            confirmarTransferenciaWrapper(selectedTransferencia)
                          }
                          className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800"
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
                            cancelarTransferenciaWrapper(selectedTransferencia)
                          }
                          className="bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800"
                        >
                          Cancelar
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    variant="flat"
                    onPress={() => setViewMode("list")}
                    className="hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    ← Voltar
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Fluxo de Transferência */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border border-blue-200 dark:border-slate-500">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <ArrowRightIcon className="w-5 h-5" />
                  Fluxo da Transferência
                </h3>
                <div className="flex items-center gap-6">
                  <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Loja de Origem
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                      {selectedTransferencia.loja_origem?.nome}
                    </h4>
                    {selectedTransferencia.loja_origem?.endereco && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <MapPinIcon className="w-4 h-4 inline-block " />
                        {selectedTransferencia.loja_origem.endereco}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <ArrowRightIcon className="w-6 h-6 text-white" />
                    </div>
                    {selectedTransferencia.status === "concluida" && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        Loja de Destino
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                      {selectedTransferencia.loja_destino?.nome}
                    </h4>
                    {selectedTransferencia.loja_destino?.endereco && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <MapPinIcon className="w-4 h-4 inline-block " />{" "}
                        {selectedTransferencia.loja_destino.endereco}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedTransferencia.observacoes && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                    💬 Observações
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300">
                    {selectedTransferencia.observacoes}
                  </p>
                </div>
              )}

              {/* Itens da Transferência */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  📦 Itens da Transferência
                </h3>
                <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                  <Table
                    aria-label="Itens da transferência"
                    className="min-w-full"
                  >
                    <TableHeader>
                      <TableColumn className="bg-slate-100 dark:bg-slate-700">
                        PRODUTO
                      </TableColumn>
                      <TableColumn className="bg-slate-100 dark:bg-slate-700">
                        MARCA/MODELO
                      </TableColumn>
                      <TableColumn className="bg-slate-100 dark:bg-slate-700">
                        QUANTIDADE
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {selectedTransferencia.itens?.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <TableCell className="font-medium">
                            {item.produto?.descricao ||
                              "Produto não encontrado"}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {item.produto?.marca}{" "}
                            {item.produto?.modelo && `- ${item.produto.modelo}`}
                          </TableCell>
                          <TableCell>
                            <Chip variant="flat" color="primary" size="sm">
                              {item.quantidade} un.
                            </Chip>
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      <Modal
        isOpen={alertDialog.isOpen}
        onClose={closeAlert}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex gap-3 items-center">
            {alertDialog.type === "success" && (
              <>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {alertDialog.title}
                </span>
              </>
            )}
            {alertDialog.type === "error" && (
              <>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-red-700 dark:text-red-400">
                  {alertDialog.title}
                </span>
              </>
            )}
            {alertDialog.type === "warning" && (
              <>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-amber-700 dark:text-amber-400">
                  {alertDialog.title}
                </span>
              </>
            )}
            {alertDialog.type === "info" && (
              <>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-blue-700 dark:text-blue-400">
                  {alertDialog.title}
                </span>
              </>
            )}
          </ModalHeader>
          <ModalBody>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {alertDialog.message}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color={
                alertDialog.type === "success"
                  ? "success"
                  : alertDialog.type === "error"
                    ? "danger"
                    : alertDialog.type === "warning"
                      ? "warning"
                      : "primary"
              }
              variant="flat"
              onPress={closeAlert}
            >
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex gap-3 items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmDialog.type === "danger"
                  ? "bg-red-100 dark:bg-red-900"
                  : confirmDialog.type === "warning"
                    ? "bg-amber-100 dark:bg-amber-900"
                    : "bg-blue-100 dark:bg-blue-900"
              }`}
            >
              <ExclamationTriangleIcon
                className={`w-6 h-6 ${
                  confirmDialog.type === "danger"
                    ? "text-red-600 dark:text-red-400"
                    : confirmDialog.type === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-blue-600 dark:text-blue-400"
                }`}
              />
            </div>
            <span
              className={
                confirmDialog.type === "danger"
                  ? "text-red-700 dark:text-red-400"
                  : confirmDialog.type === "warning"
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-blue-700 dark:text-blue-400"
              }
            >
              {confirmDialog.title}
            </span>
          </ModalHeader>
          <ModalBody>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">
              {confirmDialog.message}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={closeConfirm}>
              {confirmDialog.cancelText}
            </Button>
            <Button
              color={
                confirmDialog.type === "danger"
                  ? "danger"
                  : confirmDialog.type === "warning"
                    ? "warning"
                    : "primary"
              }
              onPress={handleConfirm}
            >
              {confirmDialog.confirmText}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
