"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { useAuthStore } from "@/store/authZustand";
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Pagination,
  Avatar,
  Progress,
} from "@heroui/react";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ArrowPathRoundedSquareIcon,
  UserIcon,
  BuildingOfficeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  HashtagIcon,
  MagnifyingGlassCircleIcon,
  CheckBadgeIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import {
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TagIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";

const STATUS_OPTIONS = [
  { key: "pendente", label: "1. Pendente" },
  { key: "em_analise", label: "2. Em Análise" },
  { key: "aprovado", label: "3. Aprovado" },
  { key: "aguardando_envio", label: "4. Aguardando Envio" },
  { key: "enviado", label: "5. Enviado para Assistência" },
  { key: "em_reparo", label: "6. Em Reparo" },
  { key: "aguardando_retorno", label: "7. Aguardando Retorno" },
  { key: "retornado", label: "8. Retornado" },
  { key: "devolvido_estoque", label: "10. Devolvido ao Estoque" },
  { key: "reprovado", label: "9. Reprovado" },
  { key: "cancelado", label: "11. Cancelado" },
];

const TIPO_RMA_OPTIONS = [
  { key: "troca", label: "Troca" },
  { key: "garantia", label: "Garantia" },
  { key: "assistencia", label: "Assistência Técnica" },
  { key: "devolucao", label: "Devolução" },
  { key: "reparo", label: "Reparo" },
  { key: "upgrade", label: "Upgrade/Atualização" },
  { key: "defeito_fabrica", label: "Defeito de Fábrica" },
  { key: "dano_transporte", label: "Dano no Transporte" },
  { key: "arrependimento", label: "Arrependimento" },
  { key: "produto_errado", label: "Produto Errado" },
  { key: "manutencao", label: "Manutenção Preventiva" },
  { key: "recall", label: "Recall" },
];

const TIPO_ORIGEM_OPTIONS = [
  { key: "interno", label: "RMA Interno/Fornecedor", icon: BuildingOfficeIcon },
  { key: "cliente", label: "RMA de Cliente", icon: UserIcon },
];

const ITEMS_PER_PAGE = 9; // 3x3 grid

// Função para calcular o progresso do RMA (0-100%)
function calcularProgressoRMA(status: string): {
  percentual: number;
  etapa: string;
  cor: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
} {
  const progressMap: {
    [key: string]: {
      percentual: number;
      etapa: string;
      cor:
        | "default"
        | "primary"
        | "secondary"
        | "success"
        | "warning"
        | "danger";
    };
  } = {
    pendente: { percentual: 10, etapa: "1/10", cor: "warning" },
    em_analise: { percentual: 20, etapa: "2/10", cor: "primary" },
    aprovado: { percentual: 30, etapa: "3/10", cor: "success" },
    reprovado: { percentual: 0, etapa: "X", cor: "danger" },
    aguardando_envio: { percentual: 40, etapa: "4/10", cor: "warning" },
    enviado: { percentual: 50, etapa: "5/10", cor: "secondary" },
    em_reparo: { percentual: 60, etapa: "6/10", cor: "warning" },
    aguardando_retorno: { percentual: 70, etapa: "7/10", cor: "primary" },
    retornado: { percentual: 80, etapa: "8/10", cor: "primary" },
    devolvido_estoque: { percentual: 100, etapa: "10/10", cor: "success" },
    cancelado: { percentual: 0, etapa: "X", cor: "danger" },
  };

  return (
    progressMap[status] || { percentual: 0, etapa: "0/10", cor: "default" }
  );
}

export default function RmaPage() {
  const [rma, setRma] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [produtosDaLoja, setProdutosDaLoja] = useState<any[]>([]); // Produtos filtrados da loja selecionada
  const [totalProdutosCadastrados, setTotalProdutosCadastrados] = useState(0);
  const [lojas, setLojas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null); // Para edição
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: number | null;
    itemName: string;
    item?: any;
  }>({
    isOpen: false,
    itemId: null,
    itemName: "",
    item: undefined,
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [editFotos, setEditFotos] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<{ [key: number]: number }>(
    {}
  );
  const [modalCarouselIndex, setModalCarouselIndex] = useState(0);
  const [newPhotosCarouselIndex, setNewPhotosCarouselIndex] = useState(0);
  const [estoqueDaLoja, setEstoqueDaLoja] = useState<number>(0); // Estoque específico da loja selecionada
  const [showDevolucaoEstoqueModal, setShowDevolucaoEstoqueModal] =
    useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [tipoOrigemFilter, setTipoOrigemFilter] = useState("");

  const { user } = useAuthStore();
  const acessos = user?.permissoes?.acessos;
  const permRma = acessos?.rma;
  const canViewRma = !!permRma?.ver_rma;
  const canCreateRma = !!permRma?.criar_rma;

  // Filtrar lojas disponíveis baseado nas permissões do usuário
  const lojasDisponiveis = useMemo(() => {
    const lojaIdUsuario = user?.permissoes?.loja_id;
    if (lojaIdUsuario === null || lojaIdUsuario === undefined) {
      return lojas;
    }
    return lojas.filter((loja) => loja.id === lojaIdUsuario);
  }, [lojas, user?.permissoes?.loja_id]);

  async function loadRma() {
    setLoading(true);
    try {
      const data = await fetchTable("rma");
      console.log("📦 RMAs carregados:", data?.length || 0);
      console.log("🖼️ Primeira RMA com fotos:", data?.[0]?.fotourl);
      setRma(data || []);
    } catch (error) {
      setRma([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProdutos() {
    try {
      console.log("🔍 Iniciando carregamento de produtos...");

      // Buscar TODOS os registros de estoque_lojas com paginação
      let allEstoqueData: any[] = [];
      let start = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("estoque_lojas")
          .select(
            `
          produto_id,
          quantidade,
          loja_id,
          estoque:produto_id (
            id,
            descricao,
            marca,
            modelo,
            compativel,
            preco_venda,
            observacoes
          )
        `
          )
          // REMOVIDO: .gt("quantidade", 0) - Buscar TODOS os produtos, mesmo com estoque zerado
          // O filtro de estoque > 0 será aplicado apenas na exibição (filteredProdutos)
          .range(start, start + pageSize - 1);

        if (error) {
          console.error("❌ Erro ao buscar estoque:", error);
          break;
        }

        if (data && data.length > 0) {
          allEstoqueData = [...allEstoqueData, ...data];
          console.log(
            `� Buscados ${data.length} registros (${start + 1} a ${start + data.length})`
          );
        }

        // Verificar se há mais registros
        hasMore = data && data.length === pageSize;
        start += pageSize;
      }

      console.log(
        "📊 Total de registros com estoque > 0:",
        allEstoqueData.length
      );

      if (allEstoqueData.length === 0) {
        console.warn("⚠️ Nenhum produto com estoque encontrado!");
        setProdutos([]);
        return;
      }

      // Agrupar produtos e somar quantidades de todas as lojas
      const produtosMap = new Map();

      allEstoqueData.forEach((item: any) => {
        if (!item.estoque) return;

        const produtoId = item.estoque.id;
        const quantidade = Number(item.quantidade) || 0;

        if (produtosMap.has(produtoId)) {
          const produtoExistente = produtosMap.get(produtoId);
          produtoExistente.quantidade += quantidade;
        } else {
          produtosMap.set(produtoId, {
            ...item.estoque,
            quantidade: quantidade,
          });
        }
      });

      const produtosComEstoque = Array.from(produtosMap.values());

      console.log(
        "✅ Total de produtos únicos com estoque:",
        produtosComEstoque.length
      );
      console.log("✅ Produtos com estoque:", produtosComEstoque);

      if (produtosComEstoque.length > 0) {
        console.log("🔍 Exemplo de produto:", produtosComEstoque[0]);
      }

      // Buscar total de produtos cadastrados (incluindo sem estoque)
      // Como pode ter mais de 1000, vamos usar paginação para contar
      try {
        let totalCount = 0;
        let startCount = 0;
        const pageSizeCount = 1000;
        let hasMoreCount = true;

        while (hasMoreCount) {
          const { data: todosProdutos, error: countError } = await supabase
            .from("estoque")
            .select("id")
            .range(startCount, startCount + pageSizeCount - 1);

          if (countError) {
            console.error("❌ Erro ao contar produtos:", countError);
            break;
          }

          if (todosProdutos && todosProdutos.length > 0) {
            totalCount += todosProdutos.length;
          }

          hasMoreCount =
            todosProdutos && todosProdutos.length === pageSizeCount;
          startCount += pageSizeCount;
        }

        console.log("📦 Total de produtos cadastrados:", totalCount);
        setTotalProdutosCadastrados(totalCount);
      } catch (err) {
        console.error("❌ Erro ao buscar contagem:", err);
      }

      setProdutos(produtosComEstoque);
    } catch (error) {
      console.error("❌ Erro ao carregar produtos:", error);
      setProdutos([]);
    }
  }

  async function loadLojas() {
    const data = await fetchTable("lojas");
    setLojas(data || []);
  }

  async function loadClientes() {
    try {
      const data = await fetchTable("clientes");
      console.log("👥 Clientes carregados:", data?.length || 0);
      setClientes(data || []);
    } catch (error) {
      console.error("❌ Erro ao carregar clientes:", error);
      setClientes([]);
    }
  }

  // Carregar produtos com estoque de uma loja específica
  async function loadProdutosDaLoja(lojaId: number) {
    try {
      console.log("🏪 Carregando produtos da loja ID:", lojaId);

      const { data, error } = await supabase
        .from("estoque_lojas")
        .select(
          `
          produto_id,
          quantidade,
          loja_id,
          estoque:produto_id (
            id,
            descricao,
            marca,
            modelo,
            compativel,
            preco_venda,
            observacoes
          )
        `
        )
        .eq("loja_id", lojaId)
        .gt("quantidade", 0);

      if (error) {
        console.error("❌ Erro ao buscar produtos da loja:", error);
        setProdutosDaLoja([]);
        return;
      }

      const produtosFormatados = data
        .filter((item: any) => item.estoque) // Garantir que tem dados do produto
        .map((item: any) => ({
          ...item.estoque,
          quantidade: Number(item.quantidade) || 0,
        }));

      console.log(
        `✅ ${produtosFormatados.length} produtos encontrados na loja ${lojaId}`
      );
      setProdutosDaLoja(produtosFormatados);
    } catch (error) {
      console.error("❌ Erro ao carregar produtos da loja:", error);
      setProdutosDaLoja([]);
    }
  }

  useEffect(() => {
    loadRma();
    loadProdutos();
    loadLojas();
    loadClientes();
    checkStorageBucket();
  }, []);

  // Atualizar estoque da loja sempre que produto ou loja mudar
  useEffect(() => {
    async function atualizarEstoqueDaLoja() {
      if (formData.produto_id && formData.loja_id) {
        const estoque = await getEstoqueDaLoja(
          formData.produto_id,
          formData.loja_id
        );
        setEstoqueDaLoja(estoque);
      } else {
        setEstoqueDaLoja(0);
      }
    }
    atualizarEstoqueDaLoja();
  }, [formData.produto_id, formData.loja_id]);

  // Carregar produtos da loja quando a loja for selecionada (apenas ao criar, não ao editar)
  useEffect(() => {
    if (formData.loja_id && !isEditing && isOpen) {
      loadProdutosDaLoja(formData.loja_id);
    }
  }, [formData.loja_id, isEditing, isOpen]);

  // Função para verificar se o bucket existe
  async function checkStorageBucket() {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.warn(
          "⚠️ Não foi possível listar buckets (permissão necessária):",
          error.message
        );
        return;
      }
      const rmaBucket = data?.find((bucket) => bucket.name === "rma");
      if (rmaBucket) {
        console.log("✅ Bucket 'rma' encontrado:", rmaBucket);
      } else {
        console.warn(
          "⚠️ Bucket 'rma' NÃO encontrado na listagem. Buckets disponíveis:",
          data?.map((b) => b.name)
        );
        console.warn("⚠️ Se as fotos estão funcionando, ignore este aviso.");
      }
    } catch (error) {
      console.warn(
        "⚠️ Erro ao verificar bucket (pode ser falta de permissão):",
        error
      );
    }
  }

  function handleAdd() {
    setFormData({ tipo_rma_origem: "interno" }); // Definir padrão como interno
    setIsEditing(false);
    setProdutosDaLoja([]); // Limpar produtos da loja
    setSelectedProduct(null); // Limpar produto selecionado
    setSelectedCliente(null); // Limpar cliente selecionado
    setIsOpen(true);
  }

  // Função para fazer upload de múltiplas fotos
  async function uploadMultiplePhotos(
    files: File[],
    rmaId: number | string
  ): Promise<string[]> {
    console.log(
      "🔄 Iniciando upload de",
      files.length,
      "foto(s) para RMA",
      rmaId
    );
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${rmaId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        console.log(
          "📤 Uploading arquivo:",
          fileName,
          "| Tamanho:",
          (file.size / 1024).toFixed(2),
          "KB"
        );

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("rma")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("❌ Erro ao fazer upload:", uploadError);
          toast.error(
            `Erro ao fazer upload de ${file.name}: ${uploadError.message}`
          );
          continue; // Continuar com próximos arquivos
        }

        console.log("✅ Upload bem-sucedido:", uploadData);

        const { data } = supabase.storage.from("rma").getPublicUrl(fileName);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
          console.log("🔗 URL pública gerada:", data.publicUrl);
        }
      } catch (error) {
        console.error("❌ Erro ao processar arquivo:", file.name, error);
        toast.error(`Erro ao fazer upload de ${file.name}`);
      }
    }

    console.log("✅ Upload finalizado. Total de URLs:", uploadedUrls.length);
    return uploadedUrls;
  }

  // Função para separar histórico automático das observações do usuário
  function separarHistoricoObservacoes(observacoes: string | null): {
    historico: string[];
    observacoesUsuario: string;
  } {
    if (!observacoes) {
      return { historico: [], observacoesUsuario: "" };
    }

    const linhas = observacoes.split("\n");
    const historico: string[] = [];
    const observacoesUsuario: string[] = [];

    linhas.forEach((linha) => {
      // Linhas de histórico começam com [data]
      if (linha.match(/^\[.*?\].*?:/)) {
        historico.push(linha);
      } else if (linha.trim()) {
        observacoesUsuario.push(linha);
      }
    });

    return {
      historico,
      observacoesUsuario: observacoesUsuario.join("\n"),
    };
  }

  // Função para adicionar registro ao histórico de observações
  function adicionarHistorico(
    observacoesAtuais: string | null,
    novoRegistro: string
  ): string {
    const dataHora = new Date().toLocaleString("pt-BR");
    const usuario = user?.nome || "Sistema";
    const linha = `[${dataHora}] ${usuario}: ${novoRegistro}`;

    if (observacoesAtuais) {
      return `${observacoesAtuais}\n${linha}`;
    }
    return linha;
  }

  async function handleSave(statusOverride?: string) {
    if (!formData.produto_id || !formData.loja_id) {
      toast.error("Por favor, selecione um produto e uma loja.");
      return;
    }

    // Validar cliente para RMA de cliente
    if (formData.tipo_rma_origem === "cliente" && !formData.cliente_id) {
      toast.error("Por favor, selecione um cliente para RMA de Cliente.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedItem) {
        // EDIÇÃO: Verificar se o status mudou para "concluido" (retorno ao estoque)
        const statusAnterior = selectedItem.status;
        const statusNovo = statusOverride || formData.status || "pendente";
        const quantidadeRma = formData.quantidade || 1;

        // Separar histórico das observações do usuário DO REGISTRO NO BANCO (não do formData)
        const { historico, observacoesUsuario } = separarHistoricoObservacoes(
          selectedItem.observacoes
        );

        console.log(
          "📝 Histórico existente no banco:",
          historico.length,
          "linhas"
        );
        console.log("📝 Observações do usuário no banco:", observacoesUsuario);
        console.log("📝 Novas observações do formData:", formData.observacoes);

        // Começar com o histórico existente
        let observacoesAtualizadas = historico.join("\n");

        // As novas observações do usuário (o que ele editou no Textarea)
        const novasObservacoesUsuario = formData.observacoes?.trim() || "";

        console.log(
          "📝 Observações que serão salvas:",
          novasObservacoesUsuario
        );

        // Se mudou de outro status para "concluido", devolver ao estoque
        if (statusAnterior !== "concluido" && statusNovo === "concluido") {
          console.log("🔄 Devolvendo ao estoque:", quantidadeRma, "unidades");

          // Buscar o registro de estoque_lojas
          const { data: estoqueAtual, error: estoqueError } = await supabase
            .from("estoque_lojas")
            .select("id, quantidade")
            .eq("produto_id", formData.produto_id)
            .eq("loja_id", formData.loja_id)
            .single();

          if (estoqueError && estoqueError.code !== "PGRST116") {
            throw new Error(`Erro ao buscar estoque: ${estoqueError.message}`);
          }

          if (estoqueAtual) {
            // Atualizar quantidade (adicionar de volta)
            const quantidadeAnterior = Number(estoqueAtual.quantidade);
            const novaQuantidade = quantidadeAnterior + quantidadeRma;
            const { error: updateEstoqueError } = await supabase
              .from("estoque_lojas")
              .update({ quantidade: novaQuantidade })
              .eq("id", estoqueAtual.id);

            if (updateEstoqueError) {
              throw new Error(
                `Erro ao atualizar estoque: ${updateEstoqueError.message}`
              );
            }

            console.log("✅ Estoque atualizado:", novaQuantidade);

            // Adicionar ao histórico
            const loja = lojas.find((l) => l.id === formData.loja_id);
            observacoesAtualizadas = adicionarHistorico(
              observacoesAtualizadas,
              `✅ RMA concluído - ${quantidadeRma} unidade(s) devolvida(s) ao estoque da loja ${loja?.nome || ""}. Estoque: ${quantidadeAnterior} → ${novaQuantidade}`
            );

            toast.success(
              `${quantidadeRma} unidade(s) devolvida(s) ao estoque!`
            );
          }
        }

        // Se mudou de outro status para "devolvido_estoque", devolver ao estoque
        if (
          statusAnterior !== "devolvido_estoque" &&
          statusNovo === "devolvido_estoque"
        ) {
          console.log("📦 Devolvendo ao estoque:", quantidadeRma, "unidades");

          // Buscar o registro de estoque_lojas
          const { data: estoqueAtual, error: estoqueError } = await supabase
            .from("estoque_lojas")
            .select("id, quantidade")
            .eq("produto_id", formData.produto_id)
            .eq("loja_id", formData.loja_id)
            .single();

          if (estoqueError && estoqueError.code !== "PGRST116") {
            throw new Error(`Erro ao buscar estoque: ${estoqueError.message}`);
          }

          if (estoqueAtual) {
            // Atualizar quantidade (adicionar de volta)
            const quantidadeAnterior = Number(estoqueAtual.quantidade);
            const novaQuantidade = quantidadeAnterior + quantidadeRma;
            const { error: updateEstoqueError } = await supabase
              .from("estoque_lojas")
              .update({ quantidade: novaQuantidade })
              .eq("id", estoqueAtual.id);

            if (updateEstoqueError) {
              throw new Error(
                `Erro ao atualizar estoque: ${updateEstoqueError.message}`
              );
            }

            console.log("✅ Estoque atualizado:", novaQuantidade);

            // Adicionar ao histórico
            const loja = lojas.find((l) => l.id === formData.loja_id);
            observacoesAtualizadas = adicionarHistorico(
              observacoesAtualizadas,
              `📦 Produto devolvido ao estoque - ${quantidadeRma} unidade(s) devolvida(s) ao estoque da loja ${loja?.nome || ""}. Estoque: ${quantidadeAnterior} → ${novaQuantidade}`
            );

            toast.success(
              `${quantidadeRma} unidade(s) devolvida(s) ao estoque!`
            );
          }
        }

        // Registrar mudança de status
        if (statusAnterior !== statusNovo) {
          const statusLabels: any = {
            pendente: "Pendente",
            em_analise: "Em Análise",
            aprovado: "Aprovado",
            reprovado: "Reprovado",
            aguardando_envio: "Aguardando Envio",
            enviado: "Enviado para Assistência",
            em_reparo: "Em Reparo",
            aguardando_retorno: "Aguardando Retorno",
            retornado: "Retornado",
            devolvido_estoque: "Devolvido ao Estoque",
            concluido: "Concluído",
            cancelado: "Cancelado",
          };
          observacoesAtualizadas = adicionarHistorico(
            observacoesAtualizadas,
            `📝 Status alterado: ${statusLabels[statusAnterior] || statusAnterior} → ${statusLabels[statusNovo] || statusNovo}`
          );
        }

        // Fazer upload das novas fotos
        let newPhotoUrls: string[] = [];
        if (fotos.length > 0) {
          console.log(
            "📸 EDIÇÃO: Fazendo upload de",
            fotos.length,
            "nova(s) foto(s)..."
          );
          newPhotoUrls = await uploadMultiplePhotos(fotos, selectedItem.id);
          console.log("🔗 EDIÇÃO: URLs das novas fotos:", newPhotoUrls);

          // Adicionar ao histórico que fotos foram adicionadas
          observacoesAtualizadas = adicionarHistorico(
            observacoesAtualizadas,
            `📷 ${fotos.length} foto(s) adicionada(s)`
          );
        }

        // Combinar fotos antigas (não removidas) com novas
        const allPhotos = [...editFotos, ...newPhotoUrls];

        // Detectar fotos removidas
        const fotosOriginais = selectedItem.fotourl || [];
        const fotosRemovidas = fotosOriginais.filter(
          (url: string) => !editFotos.includes(url)
        );

        if (fotosRemovidas.length > 0) {
          observacoesAtualizadas = adicionarHistorico(
            observacoesAtualizadas,
            `🗑️ ${fotosRemovidas.length} foto(s) removida(s)`
          );
        }

        console.log(
          "📷 Total de fotos após edição:",
          allPhotos.length,
          "| Antigas:",
          editFotos.length,
          "| Novas:",
          newPhotoUrls.length
        );

        // AGORA sim, adicionar as observações do usuário no final
        // (depois de todos os eventos de histórico terem sido adicionados)
        if (novasObservacoesUsuario) {
          observacoesAtualizadas = observacoesAtualizadas
            ? `${observacoesAtualizadas}\n${novasObservacoesUsuario}`
            : novasObservacoesUsuario;
        }

        console.log("📝 Observações finais que serão salvas:");
        console.log(observacoesAtualizadas);

        // Criar objeto apenas com campos válidos da tabela RMA (SEM fotourl)
        const validRmaFields = {
          produto_id: formData.produto_id,
          loja_id: formData.loja_id,
          cliente_id: formData.cliente_id || null,
          tipo_rma_origem: formData.tipo_rma_origem || "interno",
          quantidade: quantidadeRma,
          motivo: formData.motivo || null,
          tipo_rma: formData.tipo_rma || null,
          status: statusNovo,
          observacoes: observacoesAtualizadas,
          numero_rma: formData.numero_rma || null,
          codigo_rastreio: formData.codigo_rastreio || null,
          analise_interna: formData.analise_interna || null,
          inspecao: formData.inspecao || null,
          solucao: formData.solucao || null,
          updated_at: new Date().toISOString(),
          // NÃO incluir fotourl aqui, será passado no 5º parâmetro
        };

        // Remover campos undefined para evitar problemas
        const cleanedData = Object.fromEntries(
          Object.entries(validRmaFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        try {
          console.log(
            "💾 EDIÇÃO: Atualizando RMA com",
            allPhotos.length,
            "foto(s)..."
          );
          const updateResult = await updateTable(
            "rma",
            selectedItem.id,
            cleanedData,
            undefined, // sem arquivo único
            allPhotos // array completo de URLs (antigas + novas)
          );
          console.log("✅ EDIÇÃO: RMA atualizado:", updateResult);

          toast.success("RMA atualizado com sucesso!");
        } catch (updateError) {
          throw new Error(
            `Erro ao atualizar RMA: ${getErrorMessage(updateError)}`
          );
        }
      } else {
        // CRIAÇÃO: Deduzir do estoque ao criar RMA
        const quantidadeRma = formData.quantidade || 1;

        // Verificar estoque disponível
        const { data: estoqueAtual, error: estoqueError } = await supabase
          .from("estoque_lojas")
          .select("id, quantidade")
          .eq("produto_id", formData.produto_id)
          .eq("loja_id", formData.loja_id)
          .single();

        if (estoqueError) {
          throw new Error(`Produto não encontrado no estoque desta loja.`);
        }

        const quantidadeDisponivel = Number(estoqueAtual.quantidade) || 0;

        if (quantidadeDisponivel < quantidadeRma) {
          throw new Error(
            `Estoque insuficiente! Disponível: ${quantidadeDisponivel}, Solicitado: ${quantidadeRma}`
          );
        }

        // Deduzir do estoque
        const novaQuantidade = quantidadeDisponivel - quantidadeRma;
        const { error: updateEstoqueError } = await supabase
          .from("estoque_lojas")
          .update({ quantidade: novaQuantidade })
          .eq("id", estoqueAtual.id);

        if (updateEstoqueError) {
          throw new Error(
            `Erro ao atualizar estoque: ${updateEstoqueError.message}`
          );
        }

        console.log(
          "✅ Estoque deduzido:",
          quantidadeRma,
          "→ Nova quantidade:",
          novaQuantidade
        );

        // Criar histórico inicial
        const produto = produtos.find((p) => p.id === formData.produto_id);
        const loja = lojas.find((l) => l.id === formData.loja_id);
        let observacoesIniciais = formData.observacoes || null;

        observacoesIniciais = adicionarHistorico(
          observacoesIniciais,
          `📦 RMA criado - ${quantidadeRma} unidade(s) de "${produto?.descricao || "Produto"}" retirada(s) do estoque da loja ${loja?.nome || ""}. Estoque: ${quantidadeDisponivel} → ${novaQuantidade}`
        );

        // Criar objeto apenas com campos válidos da tabela RMA
        const validRmaFields = {
          produto_id: formData.produto_id,
          loja_id: formData.loja_id,
          cliente_id: formData.cliente_id || null,
          tipo_rma_origem: formData.tipo_rma_origem || "interno",
          quantidade: quantidadeRma,
          motivo: formData.motivo || null,
          tipo_rma: formData.tipo_rma || "troca",
          status: formData.status || "pendente",
          observacoes: observacoesIniciais,
          numero_rma: formData.numero_rma || null,
          codigo_rastreio: formData.codigo_rastreio || null,
          analise_interna: formData.analise_interna || null,
          inspecao: formData.inspecao || null,
          solucao: formData.solucao || null,
          data_rma: new Date().toISOString(),
          usuario_id: user?.id || null,
        };

        // Remover campos undefined
        const cleanedData = Object.fromEntries(
          Object.entries(validRmaFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        try {
          // Inserir sem foto primeiro para obter o ID
          console.log("📝 Inserindo RMA no banco...");
          const result = await insertTable("rma", cleanedData);
          console.log("✅ RMA inserido:", result);

          // Se há fotos, fazer upload e atualizar o registro
          if (fotos.length > 0 && result && result[0]?.id) {
            console.log(
              "📸 Detectadas",
              fotos.length,
              "foto(s) para upload. RMA ID:",
              result[0].id
            );
            const photoUrls = await uploadMultiplePhotos(fotos, result[0].id);
            console.log("🔗 URLs das fotos:", photoUrls);

            if (photoUrls.length > 0) {
              console.log("💾 Atualizando RMA com URLs das fotos...");
              const updateResult = await updateTable(
                "rma",
                result[0].id,
                {}, // values vazio, vamos usar o 5º parâmetro
                undefined, // sem arquivo único
                photoUrls // array de URLs (5º parâmetro)
              );
              console.log("✅ RMA atualizado com fotos:", updateResult);
            }
          }

          toast.success(
            `RMA cadastrado! ${quantidadeRma} unidade(s) retirada(s) do estoque.`
          );
        } catch (insertError) {
          console.error("❌ Erro ao inserir RMA:", insertError);
          throw new Error(`Erro ao criar RMA: ${getErrorMessage(insertError)}`);
        }
      }

      await loadRma();
      await loadProdutos(); // Recarregar produtos para atualizar quantidades

      handleClose();
    } catch (error) {
      console.error("❌ Erro ao salvar RMA:", error);
      toast.error(`Erro ao salvar RMA: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setFormData({});
    setIsEditing(false);
    setProductSearchTerm("");
    setSelectedProduct(null);
    setShowProductSearch(false);
    setSelectedItem(null); // Limpar item selecionado
    setFotos([]);
    setEditFotos([]);
    setModalCarouselIndex(0);
    setNewPhotosCarouselIndex(0);
    setClienteSearchTerm("");
    setSelectedCliente(null);
    setShowClienteSearch(false);
  }

  function handleEdit(item: any) {
    // Bloquear edição se o status for "concluido" ou "devolvido_estoque"
    if (item.status === "concluido" || item.status === "devolvido_estoque") {
      toast.error("❌ RMA com status finalizado não pode ser editado!");
      return;
    }

    setSelectedItem(item); // Salvar item para edição

    // Separar histórico das observações do usuário
    const { historico, observacoesUsuario } = separarHistoricoObservacoes(
      item.observacoes
    );

    // Preencher formData APENAS com as observações do usuário (não o histórico)
    setFormData({
      produto_id: item.produto_id,
      loja_id: item.loja_id,
      cliente_id: item.cliente_id,
      tipo_rma_origem: item.tipo_rma_origem || "interno",
      quantidade: item.quantidade || 1,
      motivo: item.motivo,
      tipo_rma: item.tipo_rma,
      status: item.status,
      observacoes: observacoesUsuario, // APENAS observações do usuário, sem histórico
      numero_rma: item.numero_rma,
      codigo_rastreio: item.codigo_rastreio,
      analise_interna: item.analise_interna,
      inspecao: item.inspecao,
      solucao: item.solucao,
    });

    // Carregar cliente se for RMA de cliente
    if (item.cliente_id) {
      const cliente = clientes.find((c) => c.id === item.cliente_id);
      if (cliente) {
        setSelectedCliente(cliente);
      }
    }

    // SEMPRE buscar produto do banco ao editar para garantir dados atualizados
    // Isso garante que mesmo produtos que zeraram o estoque depois da criação do RMA apareçam
    console.log("🔍 Buscando produto do banco (ID:", item.produto_id, ")...");

    loadProdutoById(item.produto_id).then((produto) => {
      if (produto) {
        console.log(
          "✅ Produto carregado:",
          produto.descricao,
          "| Estoque:",
          produto.quantidade
        );
        setSelectedProduct(produto);
      } else {
        // Fallback: tentar da lista em memória
        const produtoMemoria = produtos.find((p) => p.id === item.produto_id);
        if (produtoMemoria) {
          console.log("⚠️ Usando produto da memória (fallback)");
          setSelectedProduct(produtoMemoria);
        } else {
          console.error(
            "❌ Produto não encontrado nem no banco nem na memória!"
          );
          toast.error("Produto não encontrado!");
        }
      }
    });

    setEditFotos(item.fotourl ?? []);
    setFotos([]);
    setModalCarouselIndex(0);
    setNewPhotosCarouselIndex(0);
    setIsEditing(true);
    setIsOpen(true);
  }

  // Função para buscar produto específico por ID com estoque total atualizado
  async function loadProdutoById(produtoId: number) {
    try {
      // Buscar dados do produto na tabela estoque
      const { data: produtoData, error: produtoError } = await supabase
        .from("estoque")
        .select("*")
        .eq("id", produtoId)
        .single();

      if (produtoError) throw produtoError;

      if (!produtoData) {
        console.warn("⚠️ Produto não encontrado no banco");
        return null;
      }

      // Buscar estoque total somando todas as lojas
      const { data: estoqueLojas, error: estoqueError } = await supabase
        .from("estoque_lojas")
        .select("quantidade")
        .eq("produto_id", produtoId);

      if (estoqueError) {
        console.warn("⚠️ Erro ao buscar estoque das lojas:", estoqueError);
        // Retorna produto com quantidade 0 se não conseguir buscar estoque
        return { ...produtoData, quantidade: 0 };
      }

      // Somar quantidade de todas as lojas
      const quantidadeTotal =
        estoqueLojas?.reduce(
          (total, item) => total + (Number(item.quantidade) || 0),
          0
        ) || 0;

      console.log(
        "✅ Produto carregado:",
        produtoData.descricao,
        "| Estoque total:",
        quantidadeTotal
      );

      return {
        ...produtoData,
        quantidade: quantidadeTotal,
      };
    } catch (error) {
      console.error("❌ Erro ao buscar produto:", error);
      return null;
    }
  }

  // Função para buscar estoque específico de um produto em uma loja
  async function getEstoqueDaLoja(
    produtoId: number,
    lojaId: number
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("estoque_lojas")
        .select("quantidade")
        .eq("produto_id", produtoId)
        .eq("loja_id", lojaId)
        .single();

      if (error || !data) {
        console.warn(
          `⚠️ Estoque não encontrado para produto ${produtoId} na loja ${lojaId}`
        );
        return 0;
      }

      const quantidade = Number(data.quantidade) || 0;
      console.log(`✅ Estoque da loja ${lojaId}:`, quantidade);
      return quantidade;
    } catch (error) {
      console.error("❌ Erro ao buscar estoque da loja:", error);
      return 0;
    }
  }

  async function handleRemoveFoto(url: string) {
    setEditFotos((prev) => prev.filter((f) => f !== url));
  }

  // Deletar RMA - versão atualizada
  function handleDeleteClick(item: any) {
    // Bloquear exclusão se o status for "concluido"
    if (item.status === "concluido") {
      toast.error("❌ RMA concluído não pode ser excluído!");
      return;
    }

    const produto = produtos.find((p) => p.id === item.produto_id);
    setDeleteModal({
      isOpen: true,
      itemId: item.id,
      itemName: produto?.descricao || `RMA #${item.id}`,
      item: item,
    });
  }

  async function confirmDelete() {
    if (!deleteModal.itemId || !deleteModal.item || deleting) return;

    // Marcar como deletando para prevenir múltiplas execuções
    setDeleting(true);

    // Fechar modal imediatamente para evitar cliques duplicados
    const itemToDelete = deleteModal.item;
    const itemId = deleteModal.itemId;
    setDeleteModal({
      isOpen: false,
      itemId: null,
      itemName: "",
      item: undefined,
    });

    setLoading(true);
    try {
      // Devolver ao estoque (não faz sentido excluir RMA e perder o produto)
      // Buscar o registro de estoque_lojas
      const { data: estoqueAtual, error: estoqueError } = await supabase
        .from("estoque_lojas")
        .select("id, quantidade")
        .eq("produto_id", itemToDelete.produto_id)
        .eq("loja_id", itemToDelete.loja_id)
        .single();

      if (estoqueError && estoqueError.code !== "PGRST116") {
        console.warn("⚠️ Erro ao buscar estoque para devolução:", estoqueError);
      }

      if (estoqueAtual) {
        // Devolver quantidade ao estoque
        const quantidadeAnterior = Number(estoqueAtual.quantidade);
        const novaQuantidade = quantidadeAnterior + itemToDelete.quantidade;

        const { error: updateEstoqueError } = await supabase
          .from("estoque_lojas")
          .update({ quantidade: novaQuantidade })
          .eq("id", estoqueAtual.id);

        if (updateEstoqueError) {
          console.warn("⚠️ Erro ao devolver ao estoque:", updateEstoqueError);
        } else {
          console.log(
            `✅ Estoque devolvido: ${itemToDelete.quantidade} unidades (${quantidadeAnterior} → ${novaQuantidade})`
          );
        }
      }

      // Excluir o RMA
      await deleteTable("rma", itemId);
      await loadRma();
      await loadProdutos(); // Recarregar produtos para atualizar estoque

      toast.success(
        `RMA excluído com sucesso! ${estoqueAtual ? `${itemToDelete.quantidade} unidade(s) devolvida(s) ao estoque.` : ""}`
      );
    } catch (error) {
      console.error("Erro ao deletar RMA:", error);
      toast.error(`Erro ao deletar RMA: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  }

  function cancelDelete() {
    setDeleteModal({
      isOpen: false,
      itemId: null,
      itemName: "",
      item: undefined,
    });
  }

  // Filtros e paginação
  const filteredRma = useMemo(() => {
    // Filtrar por loja primeiro
    const lojaIdUsuario = user?.permissoes?.loja_id;
    let rmaFiltradosPorLoja = rma;

    if (lojaIdUsuario !== null && lojaIdUsuario !== undefined) {
      rmaFiltradosPorLoja = rma.filter(
        (item) => item.loja_id === lojaIdUsuario
      );
    }

    return rmaFiltradosPorLoja.filter((item) => {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const loja = lojas.find((l) => l.id === item.loja_id);
      const cliente = clientes.find((c) => c.id === item.cliente_id);

      const searchMatch =
        !searchTerm ||
        produto?.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loja?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = !statusFilter || item.status === statusFilter;

      const tipoOrigemMatch =
        !tipoOrigemFilter ||
        (item.tipo_rma_origem || "interno") === tipoOrigemFilter;

      return searchMatch && statusMatch && tipoOrigemMatch;
    });
  }, [
    rma,
    produtos,
    lojas,
    clientes,
    searchTerm,
    statusFilter,
    user?.permissoes?.loja_id,
    tipoOrigemFilter,
  ]);

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredRma.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredRma.slice(startIndex, endIndex);

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tipoOrigemFilter]);

  // Filtrar produtos baseado na pesquisa
  const filteredProdutos = useMemo(() => {
    console.log("🔍 Filtrando produtos...");
    console.log("📦 Total de produtos disponíveis:", produtos.length);

    // Se NÃO estiver pesquisando, mostrar apenas produtos com estoque
    if (!productSearchTerm) {
      const produtosComEstoque = produtos.filter((produto) => {
        const quantidade = Number(produto.quantidade) || 0;
        return quantidade > 0;
      });
      console.log("✅ Produtos com estoque > 0:", produtosComEstoque.length);
      const resultado = produtosComEstoque.slice(0, 16);
      console.log("📌 Retornando primeiros 16 produtos:", resultado.length);
      return resultado;
    }

    // Se ESTIVER pesquisando, buscar em TODOS os produtos (incluindo sem estoque)
    // Isso permite encontrar produtos para RMA mesmo se estoque zerado
    const resultado = produtos.filter(
      (produto) =>
        produto.descricao
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        produto.marca
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        produto.modelo
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        produto.compativel
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase())
    );

    console.log(
      `🔎 Busca por "${productSearchTerm}":`,
      resultado.length,
      "produtos encontrados (incluindo sem estoque)"
    );
    return resultado;
  }, [produtos, productSearchTerm]);

  // Filtrar produtos da loja baseado na pesquisa
  const filteredProdutosDaLoja = useMemo(() => {
    if (!productSearchTerm) {
      return produtosDaLoja;
    }

    return produtosDaLoja.filter(
      (produto) =>
        produto.descricao
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        produto.marca
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        produto.modelo
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        produto.compativel
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase())
    );
  }, [produtosDaLoja, productSearchTerm]);

  // Filtrar clientes baseado na pesquisa
  const filteredClientes = useMemo(() => {
    if (!clienteSearchTerm) {
      return clientes.slice(0, 20); // Primeiros 20 clientes
    }

    return clientes.filter(
      (cliente) =>
        cliente.nome?.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
        cliente.email
          ?.toLowerCase()
          .includes(clienteSearchTerm.toLowerCase()) ||
        cliente.telefone
          ?.toLowerCase()
          .includes(clienteSearchTerm.toLowerCase()) ||
        cliente.cpf_cnpj
          ?.toLowerCase()
          .includes(clienteSearchTerm.toLowerCase())
    );
  }, [clientes, clienteSearchTerm]);

  function handleSelectProduct(produto: any) {
    setSelectedProduct(produto);
    setFormData({ ...formData, produto_id: produto.id });
    setShowProductSearch(false);
    setProductSearchTerm("");
  }

  function handleOpenProductSearch() {
    setShowProductSearch(true);
    setSelectedProduct(null);
  }

  if (!canViewRma) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar RMA.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de RMA</h1>
          <p className="text-gray-600 mt-1">
            {filteredRma.length} registro
            {filteredRma.length !== 1 ? "s" : ""} encontrado
            {filteredRma.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreateRma && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleAdd}
            size="lg"
            variant="solid"
          >
            Novo RMA
          </Button>
        )}
      </div>

      {/* Filtros de busca */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Buscar RMA"
              placeholder="Buscar por produto, marca, modelo, loja ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              size="lg"
              startContent={
                <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
              }
              isClearable
              onClear={() => setSearchTerm("")}
            />
            <Select
              label="Filtrar por Status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setStatusFilter(key || "");
              }}
              className="w-full md:w-64"
              size="lg"
              placeholder="Todos os status"
            >
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
            <Select
              label="Tipo de RMA"
              selectedKeys={tipoOrigemFilter ? [tipoOrigemFilter] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setTipoOrigemFilter(key || "");
              }}
              className="w-full md:w-64"
              size="lg"
              placeholder="Todos os tipos"
            >
              {TIPO_ORIGEM_OPTIONS.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Grid de cards com paginação */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {currentItems.map((item) => {
              const produto = produtos.find((p) => p.id === item.produto_id);
              const loja = lojas.find((l) => l.id === item.loja_id);
              const cliente = clientes.find((c) => c.id === item.cliente_id);
              const isRmaCliente =
                (item.tipo_rma_origem || "interno") === "cliente";

              return (
                <Card key={item.id} onPress={() => handleEdit(item)}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold line-clamp-1 text-gray-900">
                            {isRmaCliente
                              ? cliente?.nome || "Cliente"
                              : produto?.descricao || "Produto"}
                          </h3>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={isRmaCliente ? "secondary" : "default"}
                            className="flex-shrink-0"
                            startContent={
                              isRmaCliente ? (
                                <UserIcon className="w-3 h-3" />
                              ) : (
                                <BuildingOfficeIcon className="w-3 h-3" />
                              )
                            }
                          >
                            {isRmaCliente ? "Cliente" : "Interno"}
                          </Chip>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {produto?.marca} {produto?.modelo}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1 flex items-center gap-1">
                          <BuildingStorefrontIcon className="w-4 h-4" />
                          {loja?.nome || "N/A"}
                        </p>
                      </div>
                      <Chip
                        color={
                          item.status === "pendente" ||
                          item.status === "em_analise"
                            ? "warning"
                            : item.status === "aprovado" ||
                                item.status === "concluido" ||
                                item.status === "devolvido_estoque"
                              ? "success"
                              : item.status === "reprovado" ||
                                  item.status === "cancelado"
                                ? "danger"
                                : "primary"
                        }
                        variant="flat"
                        size="sm"
                        startContent={
                          item.status === "pendente" ||
                          item.status === "em_analise" ? (
                            <ClockIcon className="w-4 h-4" />
                          ) : item.status === "enviado" ||
                            item.status === "aguardando_envio" ? (
                            <PaperAirplaneIcon className="w-4 h-4" />
                          ) : item.status === "concluido" ||
                            item.status === "aprovado" ||
                            item.status === "devolvido_estoque" ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : item.status === "reprovado" ||
                            item.status === "cancelado" ? (
                            <XMarkIcon className="w-4 h-4" />
                          ) : (
                            <CubeIcon className="w-4 h-4" />
                          )
                        }
                      >
                        {STATUS_OPTIONS.find((s) => s.key === item.status)
                          ?.label || item.status}
                      </Chip>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <p className="text-gray-500 text-xs">Quantidade</p>
                        <p className="font-semibold text-gray-900">
                          {item.quantidade}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <p className="text-gray-500 text-xs">Tipo</p>
                        <p className="font-semibold text-gray-900">
                          {TIPO_RMA_OPTIONS.find((t) => t.key === item.tipo_rma)
                            ?.label ||
                            item.tipo_rma ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <p className="text-gray-500 text-xs">Data RMA</p>
                        <p className="font-semibold text-gray-900">
                          {item.data_rma
                            ? new Date(item.data_rma).toLocaleDateString(
                                "pt-BR"
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <p className="text-gray-500 text-xs">ID</p>
                        <p className="font-semibold text-gray-900">
                          #{item.id}
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso Moderna */}
                    <div className="mb-3 p-3 bg-gradient-to-r from-default-50 to-default-100 rounded-lg border border-default-200">
                      {(() => {
                        const { percentual, etapa, cor } = calcularProgressoRMA(
                          item.status
                        );
                        const statusLabel =
                          STATUS_OPTIONS.find((s) => s.key === item.status)
                            ?.label || item.status;

                        return (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-semibold text-default-600">
                                Progresso do RMA
                              </p>
                              <Chip
                                size="sm"
                                variant="flat"
                                color={cor}
                                className="font-mono text-xs"
                              >
                                {item.status === "reprovado" ||
                                item.status === "cancelado"
                                  ? "Finalizado"
                                  : `Etapa ${etapa}`}
                              </Chip>
                            </div>

                            <Progress
                              value={percentual}
                              color={cor}
                              size="md"
                              className="mb-2"
                              classNames={{
                                indicator:
                                  item.status === "concluido" ||
                                  item.status === "devolvido_estoque"
                                    ? "bg-gradient-to-r from-success-400 to-success-600"
                                    : item.status === "reprovado" ||
                                        item.status === "cancelado"
                                      ? "bg-gradient-to-r from-danger-400 to-danger-600"
                                      : "bg-gradient-to-r from-primary-400 to-primary-600",
                              }}
                            />

                            <div className="flex justify-between items-center">
                              <p className="text-xs text-default-500 line-clamp-1">
                                {statusLabel}
                              </p>
                              <p className="text-xs font-bold text-default-700">
                                {percentual}%
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {item.motivo && (
                      <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-700 font-medium">
                          Motivo:
                        </p>
                        <p className="text-sm line-clamp-2 text-gray-700">
                          {item.motivo}
                        </p>
                      </div>
                    )}

                    {item.observacoes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 font-medium mb-2">
                          Histórico e Observações:
                        </p>
                        <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                          {item.observacoes
                            .split("\n")
                            .map((linha: string, idx: number) => {
                              // Detectar se é uma linha de histórico [data] usuario: texto
                              const isHistorico = linha.match(/^\[.*?\].*?:/);

                              if (isHistorico) {
                                return (
                                  <div
                                    key={idx}
                                    className="text-xs font-mono  rounded px-2 py-1 border border-blue-100"
                                  >
                                    {linha}
                                  </div>
                                );
                              }

                              return linha.trim() ? (
                                <p key={idx} className="text-sm">
                                  {linha}
                                </p>
                              ) : null;
                            })}
                        </div>
                      </div>
                    )}

                    {/* Carrossel de Fotos do RMA */}
                    {item.fotourl && item.fotourl.length > 0 && (
                      <div className="mt-3 bg-default-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-default-600 font-medium">
                            Fotos ({item.fotourl.length})
                          </p>
                          <p className="text-xs text-default-400">
                            {((carouselIndex[item.id] || 0) %
                              item.fotourl.length) +
                              1}
                            /{item.fotourl.length}
                          </p>
                        </div>
                        <div className="relative group">
                          {/* Imagem Principal */}
                          <div
                            className="w-full h-40 rounded-lg overflow-hidden bg-default-200 cursor-pointer"
                            onClick={() =>
                              window.open(
                                item.fotourl[
                                  (carouselIndex[item.id] || 0) %
                                    item.fotourl.length
                                ],
                                "_blank"
                              )
                            }
                          >
                            <img
                              src={
                                item.fotourl[
                                  (carouselIndex[item.id] || 0) %
                                    item.fotourl.length
                                ]
                              }
                              alt={`Foto ${((carouselIndex[item.id] || 0) % item.fotourl.length) + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Botões de Navegação */}
                          {item.fotourl.length > 1 && (
                            <>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="solid"
                                color="default"
                                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => {
                                  setCarouselIndex((prev) => ({
                                    ...prev,
                                    [item.id]:
                                      ((prev[item.id] || 0) -
                                        1 +
                                        item.fotourl.length) %
                                      item.fotourl.length,
                                  }));
                                }}
                              >
                                <ChevronLeftIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="solid"
                                color="default"
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => {
                                  setCarouselIndex((prev) => ({
                                    ...prev,
                                    [item.id]:
                                      ((prev[item.id] || 0) + 1) %
                                      item.fotourl.length,
                                  }));
                                }}
                              >
                                <ChevronRightIcon className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* Indicadores de Posição */}
                          {item.fotourl.length > 1 && (
                            <div className="flex gap-1 justify-center mt-2">
                              {item.fotourl.map((_: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setCarouselIndex((prev) => ({
                                      ...prev,
                                      [item.id]: idx,
                                    }));
                                  }}
                                  className={`h-1.5 rounded-full transition-all ${
                                    (carouselIndex[item.id] || 0) %
                                      item.fotourl.length ===
                                    idx
                                      ? "w-6 bg-primary"
                                      : "w-1.5 bg-default-300 hover:bg-default-400"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Adicionar botões de ação no card */}
                    {(canCreateRma || permRma?.deletar_rma) && (
                      <div className="flex gap-2 mt-3">
                        {canCreateRma && (
                          <Button
                            size="sm"
                            variant="bordered"
                            color="primary"
                            onPress={() => handleEdit(item)}
                            className="flex-1"
                            isDisabled={item.status === "concluido"}
                            startContent={
                              item.status === "concluido" ? (
                                <CheckCircleIcon className="w-4 h-4" />
                              ) : (
                                <PencilSquareIcon className="w-4 h-4" />
                              )
                            }
                          >
                            {item.status === "concluido"
                              ? "Concluído"
                              : "Editar"}
                          </Button>
                        )}
                        {permRma?.deletar_rma && (
                          <Button
                            size="sm"
                            variant="bordered"
                            color="danger"
                            onPress={() => handleDeleteClick(item)}
                            className="flex-1"
                            startContent={<TrashIcon className="w-4 h-4" />}
                            isDisabled={item.status === "concluido"}
                          >
                            Excluir
                          </Button>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
                size="lg"
              />
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {filteredRma.length === 0 && !loading && (
            <Card>
              <CardBody className="text-center py-12">
                <div className="text-6xl mb-4">
                  <MagnifyingGlassIcon className="w-16 h-16 text-default-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum RMA encontrado
                </h3>
                <p className="text-default-500 mb-4">
                  {searchTerm || statusFilter
                    ? "Tente ajustar os filtros de busca"
                    : "Não há registros de RMA cadastrados"}
                </p>
                {canCreateRma && (
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={handleAdd}
                  >
                    Criar primeiro RMA
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Modal de cadastro/edição */}
      {(canCreateRma || isEditing) &&
        (() => {
          // Verificar se o status atual é "devolvido_estoque"
          const isDevolvido = formData.status === "devolvido_estoque";

          return (
            <Modal
              isOpen={isOpen}
              onClose={handleClose}
              size="3xl"
              scrollBehavior="outside"
            >
              <ModalContent>
                <ModalHeader className="flex flex-col gap-1 rounded-t-lg">
                  <h2 className="text-xl font-bold">
                    {isEditing ? "Editar RMA" : "Novo RMA"}
                  </h2>
                  <p className="text-sm text-default-500">
                    {isEditing
                      ? "Atualize as informações do RMA"
                      : "Registre uma nova solicitação de RMA"}
                  </p>
                </ModalHeader>
                <ModalBody className="py-6">
                  <div className="space-y-6">
                    {/* Aviso de bloqueio quando devolvido ao estoque */}
                    {isDevolvido && (
                      <div className="bg-warning-50 border-2 border-warning-500 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <ExclamationTriangleIcon className="w-6 h-6 text-warning-600 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold text-warning-800 mb-1 flex items-center gap-2">
                              <LockClosedIcon className="w-4 h-4" />
                              RMA Devolvido ao Estoque
                            </h4>
                            <p className="text-sm text-warning-700">
                              Este RMA foi marcado como "Devolvido ao Estoque" e
                              não pode mais ser editado. O produto já foi
                              devolvido ao estoque da loja.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seletor de Tipo de Origem */}
                    <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border-2 border-primary-300">
                      <h3 className="text-lg font-semibold mb-3 text-primary-700 flex items-center gap-2">
                        <ArrowPathRoundedSquareIcon className="w-6 h-6" />
                        Tipo de RMA
                      </h3>
                      <Select
                        label="Selecione o Tipo de Origem"
                        selectedKeys={
                          formData.tipo_rma_origem
                            ? [formData.tipo_rma_origem]
                            : ["interno"]
                        }
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys)[0] as string;
                          setFormData({ ...formData, tipo_rma_origem: key });
                          // Limpar cliente se mudar para interno
                          if (key === "interno") {
                            setFormData({
                              ...formData,
                              tipo_rma_origem: key,
                              cliente_id: null,
                            });
                            setSelectedCliente(null);
                          }
                        }}
                        size="lg"
                        variant="bordered"
                        isDisabled={isEditing || isDevolvido}
                        description="Defina se é um RMA interno/fornecedor ou de cliente"
                      >
                        {TIPO_ORIGEM_OPTIONS.map((option) => (
                          <SelectItem key={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Seção de Cliente - Condicional para tipo_rma_origem = "cliente" */}
                    {formData.tipo_rma_origem === "cliente" && (
                      <div className="p-4 bg-secondary-50 rounded-lg border-2 border-secondary-300">
                        <h3 className="text-lg font-semibold mb-3 text-secondary-700 flex items-center gap-2">
                          <UserIcon className="w-6 h-6" />
                          Cliente
                        </h3>

                        {selectedCliente || formData.cliente_id ? (
                          <div className="p-4 bg-success-50 rounded-lg mb-3 border border-success-300">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-success-800 text-lg">
                                  {selectedCliente?.nome ||
                                    clientes.find(
                                      (c) => c.id === formData.cliente_id
                                    )?.nome}
                                </h4>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-success-700 flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4" />
                                    {selectedCliente?.email ||
                                      clientes.find(
                                        (c) => c.id === formData.cliente_id
                                      )?.email}
                                  </p>
                                  <p className="text-sm text-success-700 flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4" />
                                    {selectedCliente?.telefone ||
                                      clientes.find(
                                        (c) => c.id === formData.cliente_id
                                      )?.telefone}
                                  </p>
                                  {(selectedCliente?.cpf_cnpj ||
                                    clientes.find(
                                      (c) => c.id === formData.cliente_id
                                    )?.cpf_cnpj) && (
                                    <p className="text-sm text-success-700 flex items-center gap-2">
                                      <IdentificationIcon className="w-4 h-4" />
                                      {selectedCliente?.cpf_cnpj ||
                                        clientes.find(
                                          (c) => c.id === formData.cliente_id
                                        )?.cpf_cnpj}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="flat"
                                color="warning"
                                onPress={() => setShowClienteSearch(true)}
                                isDisabled={isDevolvido}
                              >
                                Alterar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            color="secondary"
                            variant="flat"
                            className="w-full mb-3"
                            size="lg"
                            onPress={() => setShowClienteSearch(true)}
                            startContent={
                              <MagnifyingGlassIcon className="w-5 h-5" />
                            }
                            isDisabled={isDevolvido}
                          >
                            Buscar e Selecionar Cliente
                          </Button>
                        )}

                        {/* Modal de busca de cliente */}
                        {showClienteSearch && (
                          <div className="space-y-4 mt-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-secondary-700">
                                Buscar Clientes
                              </h4>
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => setShowClienteSearch(false)}
                                isIconOnly
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </Button>
                            </div>

                            <Input
                              placeholder="Digite nome, email, telefone ou CPF/CNPJ..."
                              value={clienteSearchTerm}
                              onChange={(e) =>
                                setClienteSearchTerm(e.target.value)
                              }
                              startContent={
                                <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                              }
                              size="md"
                              variant="bordered"
                              isClearable
                              onClear={() => setClienteSearchTerm("")}
                            />

                            <div className="max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filteredClientes.map((cliente) => (
                                  <Card
                                    key={cliente.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-secondary-300"
                                    isPressable
                                    onPress={() => {
                                      setSelectedCliente(cliente);
                                      setFormData({
                                        ...formData,
                                        cliente_id: cliente.id,
                                      });
                                      setShowClienteSearch(false);
                                      setClienteSearchTerm("");
                                    }}
                                  >
                                    <CardBody className="p-3">
                                      <div className="flex items-start gap-2">
                                        <Avatar
                                          name={cliente.nome}
                                          size="sm"
                                          className="flex-shrink-0"
                                          color="secondary"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-sm line-clamp-1">
                                            {cliente.nome}
                                          </h4>
                                          <p className="text-xs text-default-500 line-clamp-1">
                                            {cliente.email}
                                          </p>
                                          <p className="text-xs text-default-500">
                                            {cliente.telefone}
                                          </p>
                                        </div>
                                      </div>
                                    </CardBody>
                                  </Card>
                                ))}
                              </div>

                              {filteredClientes.length === 0 && (
                                <div className="text-center py-8">
                                  <p className="text-default-500 text-sm">
                                    Nenhum cliente encontrado
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Seção 1 - Seleção de Produto e Quantidade */}
                    <div className="border-2 border-primary-200 rounded-lg p-6 ">
                      <h3 className="text-lg font-semibold mb-4 text-primary-600 flex items-center gap-2">
                        <CubeIcon className="w-6 h-6" />
                        1. Produto e Quantidade
                      </h3>

                      {/* Produto selecionado */}
                      {selectedProduct || formData.produto_id ? (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Produto Selecionado
                          </label>
                          <div className="p-4 border-2 border-primary-200 rounded-lg bg-primary-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {selectedProduct?.descricao ||
                                    produtos.find(
                                      (p) => p.id === formData.produto_id
                                    )?.descricao}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {selectedProduct?.marca ||
                                    produtos.find(
                                      (p) => p.id === formData.produto_id
                                    )?.marca}{" "}
                                  {selectedProduct?.modelo ||
                                    produtos.find(
                                      (p) => p.id === formData.produto_id
                                    )?.modelo}
                                </p>
                                {(() => {
                                  const qtdEstoque =
                                    selectedProduct?.quantidade ||
                                    produtos.find(
                                      (p) => p.id === formData.produto_id
                                    )?.quantidade ||
                                    0;
                                  return (
                                    <div className="text-sm font-medium mt-1">
                                      <p
                                        className={`${qtdEstoque > 0 ? "text-primary-700" : "text-orange-600"}`}
                                      >
                                        Estoque total: {qtdEstoque} unidades
                                        <span className="text-xs text-gray-500 ml-1">
                                          (todas as lojas)
                                        </span>
                                      </p>
                                      {formData.loja_id && (
                                        <p className="text-blue-600 mt-1">
                                          Na loja selecionada: {estoqueDaLoja}{" "}
                                          unidades
                                        </p>
                                      )}
                                      {qtdEstoque === 0 && (
                                        <span className="block text-xs text-orange-500 mt-1 flex items-center gap-1">
                                          <ExclamationTriangleIcon className="w-3 h-3" />
                                          Produto sem estoque disponível
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              <Button
                                size="sm"
                                variant="bordered"
                                color="primary"
                                onPress={handleOpenProductSearch}
                                isDisabled={isEditing || isDevolvido} // Desabilitar troca de produto ao editar ou se devolvido
                              >
                                {isEditing ? "Editando" : "Alterar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          color="primary"
                          variant="bordered"
                          className="w-full mb-4"
                          size="lg"
                          onPress={handleOpenProductSearch}
                          startContent={
                            <MagnifyingGlassIcon className="w-5 h-5" />
                          }
                        >
                          Buscar e Selecionar Produto
                        </Button>
                      )}

                      {/* Modal de busca de produtos */}
                      {showProductSearch && (
                        <div className="space-y-4 mt-4 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <MagnifyingGlassIcon className="w-5 h-5 text-primary-600" />
                              Buscar Produtos com Estoque
                            </h4>
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() => setShowProductSearch(false)}
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* Input de busca */}
                          <Input
                            placeholder="Digite para buscar produtos..."
                            value={productSearchTerm}
                            onChange={(e) =>
                              setProductSearchTerm(e.target.value)
                            }
                            startContent={
                              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                            }
                            size="lg"
                            variant="bordered"
                            isClearable
                            onClear={() => setProductSearchTerm("")}
                          />

                          {/* Contador de resultados */}
                          <div className="flex justify-between items-center text-sm text-gray-600  p-2 rounded">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {filteredProdutos.length} produto
                                {filteredProdutos.length !== 1 ? "s" : ""} com
                                estoque
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className="text-gray-500">
                                {totalProdutosCadastrados || 0} total
                                cadastrados
                              </span>
                            </div>
                            {productSearchTerm && (
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => setProductSearchTerm("")}
                              >
                                Limpar busca
                              </Button>
                            )}
                          </div>

                          {/* Grid de produtos */}
                          <div className="max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {filteredProdutos.map((produto) => (
                                <Card
                                  key={produto.id}
                                  className="cursor-pointer hover:border-primary-500 transition-all border-2"
                                  isPressable
                                  onPress={() => handleSelectProduct(produto)}
                                >
                                  <CardBody className="p-3">
                                    <div className="space-y-2">
                                      <h5 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                                        {produto.descricao}
                                      </h5>
                                      <div className="space-y-1 text-xs text-default-500">
                                        {produto.marca && (
                                          <p className="line-clamp-1">
                                            {produto.marca}
                                          </p>
                                        )}
                                        {produto.modelo && (
                                          <p className="line-clamp-1 text-sm text-gray-600">
                                            {produto.modelo}
                                          </p>
                                        )}
                                        {/* Indicador de estoque disponível - simplificado */}
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                          <span className="text-sm font-medium text-gray-700">
                                            Estoque:{" "}
                                            {Number(produto.quantidade) || 0}
                                          </span>
                                          {produto.preco_venda && (
                                            <span className="font-semibold text-gray-900">
                                              R${" "}
                                              {produto.preco_venda.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {produto.compativel && (
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                          <p className="text-xs text-gray-600 line-clamp-1">
                                            Compatível: {produto.compativel}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CardBody>
                                </Card>
                              ))}
                            </div>

                            {/* Mensagem quando não há produtos */}
                            {filteredProdutos.length === 0 && (
                              <div className="text-center py-8">
                                <div className="text-4xl mb-2">�</div>
                                <p className="text-default-500 font-medium">
                                  {productSearchTerm
                                    ? "Nenhum produto encontrado com estoque"
                                    : "Nenhum produto com estoque disponível"}
                                </p>
                                <p className="text-sm text-default-400 mt-1">
                                  {productSearchTerm
                                    ? "Tente buscar com outros termos ou verifique o estoque"
                                    : "Adicione produtos ao estoque para criar RMA"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Seção 2 - Loja e Detalhes da RMA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Seleção de loja */}
                      <div className="p-4  border-2 border-primary-200 rounded-lg">
                        <h3 className="text-base font-semibold mb-3 text-gray-900 flex items-center gap-2">
                          <BuildingStorefrontIcon className="w-5 h-5 text-primary-600" />
                          2. Loja de Origem
                        </h3>
                        <Select
                          label="Selecione a loja"
                          selectedKeys={
                            formData.loja_id
                              ? [formData.loja_id.toString()]
                              : []
                          }
                          onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0] as string;
                            setFormData({ ...formData, loja_id: Number(key) });
                          }}
                          size="md"
                          placeholder="Escolha a loja"
                          variant="bordered"
                          isDisabled={isEditing || isDevolvido} // Desabilitar mudança de loja ao editar ou se devolvido
                          description={
                            isEditing || isDevolvido
                              ? "A loja não pode ser alterada"
                              : undefined
                          }
                        >
                          {lojasDisponiveis.map((l) => (
                            <SelectItem key={l.id} textValue={l.nome}>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{l.nome}</span>
                                {l.endereco && (
                                  <span className="text-xs text-gray-500">
                                    {l.endereco}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* Detalhes da RMA */}
                      <div className="p-4  border-2 border-primary-200 rounded-lg">
                        <h3 className="text-base font-semibold mb-3 text-gray-900 flex items-center gap-2">
                          <ClipboardDocumentListIcon className="w-5 h-5 text-primary-600" />
                          3. Detalhes da RMA
                        </h3>
                        <div className="space-y-4">
                          {/* Campo de Quantidade - mais destacado */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Quantidade *
                            </label>
                            <Input
                              type="number"
                              placeholder="Digite a quantidade"
                              min="1"
                              max={
                                isEditing && selectedItem
                                  ? selectedItem.quantidade + estoqueDaLoja
                                  : estoqueDaLoja || 1
                              }
                              value={formData.quantidade?.toString() || ""}
                              onChange={(e) => {
                                const novaQuantidade =
                                  Number(e.target.value) || 1;

                                // Validação: ao editar, não pode exceder quantidade original + estoque disponível DA LOJA
                                if (isEditing && selectedItem) {
                                  const quantidadeOriginal =
                                    selectedItem.quantidade;
                                  const estoqueDisponivel = estoqueDaLoja;
                                  const maxPermitido =
                                    quantidadeOriginal + estoqueDisponivel;

                                  if (novaQuantidade > maxPermitido) {
                                    toast.error(
                                      `Quantidade máxima permitida: ${maxPermitido} (${quantidadeOriginal} do RMA + ${estoqueDisponivel} em estoque da loja)`
                                    );
                                    return;
                                  }
                                } else {
                                  // Ao criar, validar contra estoque disponível DA LOJA
                                  const estoqueDisponivel = estoqueDaLoja;
                                  if (novaQuantidade > estoqueDisponivel) {
                                    toast.error(
                                      `Quantidade máxima permitida: ${estoqueDisponivel} (estoque disponível na loja)`
                                    );
                                    return;
                                  }
                                }

                                setFormData({
                                  ...formData,
                                  quantidade: novaQuantidade,
                                });
                              }}
                              variant="bordered"
                              size="lg"
                              isDisabled={isDevolvido}
                              classNames={{
                                input: "text-2xl font-bold text-center",
                                inputWrapper:
                                  "border-2 border-primary-300 hover:border-primary-500",
                              }}
                              description={
                                selectedProduct && formData.loja_id ? (
                                  <span className="text-sm text-gray-600">
                                    {isEditing && selectedItem ? (
                                      <>
                                        Máximo permitido:{" "}
                                        <strong>
                                          {selectedItem.quantidade +
                                            estoqueDaLoja}
                                        </strong>{" "}
                                        ({selectedItem.quantidade} do RMA +{" "}
                                        {estoqueDaLoja} em estoque na loja
                                        selecionada)
                                      </>
                                    ) : (
                                      <>
                                        Disponível em estoque na loja:{" "}
                                        <strong>{estoqueDaLoja}</strong>
                                      </>
                                    )}
                                  </span>
                                ) : selectedProduct && !formData.loja_id ? (
                                  <span className="text-sm text-orange-600">
                                    ⚠️ Selecione uma loja para verificar o
                                    estoque
                                  </span>
                                ) : null
                              }
                            />
                          </div>

                          {/* Tipo de RMA */}
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Tipo de RMA *
                            </label>
                            <Select
                              selectedKeys={
                                formData.tipo_rma ? [formData.tipo_rma] : []
                              }
                              onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0] as string;
                                setFormData({ ...formData, tipo_rma: key });
                              }}
                              size="lg"
                              placeholder="Selecione o tipo"
                              variant="bordered"
                              isDisabled={isDevolvido}
                            >
                              {TIPO_RMA_OPTIONS.map((option) => (
                                <SelectItem key={option.key}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 3 - Status e Motivo */}
                    <div className="p-4  border-2 border-primary-200 rounded-lg">
                      <h3 className="text-base font-semibold mb-3 text-gray-900 flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-primary-600" />
                        4. Status e Motivo
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Status Atual"
                          selectedKeys={
                            formData.status ? [formData.status] : ["pendente"]
                          }
                          onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0] as string;

                            // Se selecionar "devolvido_estoque", mostrar modal de confirmação
                            if (key === "devolvido_estoque" && isEditing) {
                              setPendingStatus(key);
                              setShowDevolucaoEstoqueModal(true);
                            } else {
                              setFormData({ ...formData, status: key });
                            }
                          }}
                          size="md"
                          placeholder="Selecione o status"
                          variant="bordered"
                          isDisabled={isDevolvido}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.key}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>

                        <Input
                          label="Motivo da RMA"
                          placeholder="Ex: Defeito, dano no transporte, etc."
                          value={formData.motivo || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, motivo: e.target.value })
                          }
                          variant="bordered"
                          isDisabled={isDevolvido}
                        />
                      </div>
                    </div>

                    {/* Campos extras para RMA de Cliente */}
                    {formData.tipo_rma_origem === "cliente" && (
                      <>
                        {/* Número RMA e Código de Rastreio */}
                        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <h3 className="text-base font-semibold mb-3 text-blue-800 flex items-center gap-2">
                            <ClipboardDocumentListIcon className="w-5 h-5" />
                            Informações de Rastreamento
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Número do RMA"
                              placeholder="Ex: RMA-2024-001"
                              value={formData.numero_rma || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  numero_rma: e.target.value,
                                })
                              }
                              variant="bordered"
                              isDisabled={isDevolvido}
                              startContent={
                                <HashtagIcon className="w-4 h-4 text-blue-600" />
                              }
                            />
                            <Input
                              label="Código de Rastreio"
                              placeholder="Ex: BR123456789"
                              value={formData.codigo_rastreio || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  codigo_rastreio: e.target.value,
                                })
                              }
                              variant="bordered"
                              isDisabled={isDevolvido}
                              startContent={
                                <TruckIcon className="w-4 h-4 text-blue-600" />
                              }
                            />
                          </div>
                        </div>

                        {/* Análise Interna, Inspeção e Solução */}
                        <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                          <h3 className="text-base font-semibold mb-3 text-purple-800 flex items-center gap-2">
                            <MagnifyingGlassCircleIcon className="w-5 h-5" />
                            Análises e Solução
                          </h3>
                          <div className="space-y-4">
                            <Textarea
                              label="Análise Interna"
                              placeholder="Avaliação técnica interna do produto..."
                              value={formData.analise_interna || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  analise_interna: e.target.value,
                                })
                              }
                              variant="bordered"
                              minRows={3}
                              maxRows={5}
                              isDisabled={isDevolvido}
                              description="Análise técnica realizada pela equipe interna"
                            />
                            <Textarea
                              label="Inspeção"
                              placeholder="Detalhes da inspeção física do produto..."
                              value={formData.inspecao || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  inspecao: e.target.value,
                                })
                              }
                              variant="bordered"
                              minRows={3}
                              maxRows={5}
                              isDisabled={isDevolvido}
                              description="Resultados da inspeção visual e funcional"
                            />
                            <Textarea
                              label="Solução Aplicada"
                              placeholder="Resolução final aplicada ao RMA..."
                              value={formData.solucao || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  solucao: e.target.value,
                                })
                              }
                              variant="bordered"
                              minRows={3}
                              maxRows={5}
                              isDisabled={isDevolvido}
                              description="Descreva a solução final (reparo, troca, reembolso, etc.)"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Seção 4 - Observações e Histórico */}
                    <div className="space-y-4">
                      {/* Histórico Automático (Somente Leitura) */}
                      {isEditing && selectedItem?.observacoes && (
                        <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                          <h3 className="text-base font-semibold mb-3 text-gray-900 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-gray-600" />
                            Histórico Automático (Somente Leitura)
                          </h3>
                          <div className=" rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                            {separarHistoricoObservacoes(
                              selectedItem.observacoes
                            ).historico.map((linha, idx) => (
                              <div
                                key={idx}
                                className="text-xs font-mono bg-gray-50 rounded px-3 py-2 border border-gray-200"
                              >
                                {linha}
                              </div>
                            ))}
                            {separarHistoricoObservacoes(
                              selectedItem.observacoes
                            ).historico.length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-2">
                                Nenhum histórico registrado ainda
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Observações Editáveis */}
                      <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                        <h3 className="text-lg font-semibold mb-3 text-primary-700 flex items-center gap-2">
                          <DocumentTextIcon className="w-5 h-5" />
                          Observações da Assistência
                        </h3>
                        <Textarea
                          placeholder="Informações sobre o atendimento, diagnóstico, procedimentos realizados, etc."
                          value={
                            isEditing
                              ? separarHistoricoObservacoes(
                                  formData.observacoes ||
                                    selectedItem?.observacoes
                                ).observacoesUsuario
                              : formData.observacoes || ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              observacoes: e.target.value,
                            })
                          }
                          variant="bordered"
                          minRows={4}
                          maxRows={6}
                          isDisabled={isDevolvido}
                          classNames={{
                            input: "resize-none",
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          O histórico de movimentações é adicionado
                          automaticamente e não pode ser editado.
                        </p>
                      </div>
                    </div>

                    {/* Seção 5 - Fotos */}
                    <div className="p-4  border-2 border-primary-200 rounded-lg">
                      <h3 className="text-base font-semibold mb-3 text-gray-900 flex items-center gap-2">
                        <PhotoIcon className="w-5 h-5 text-primary-600" />
                        5. Fotos do RMA
                      </h3>

                      {/* Fotos existentes com Carrossel */}
                      {isEditing && editFotos.length > 0 && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Fotos atuais ({editFotos.length}):
                          </label>
                          <div className="relative group">
                            {/* Imagem Principal */}
                            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                              <img
                                src={
                                  editFotos[
                                    modalCarouselIndex % editFotos.length
                                  ]
                                }
                                alt={`Foto ${modalCarouselIndex + 1}`}
                                className="w-full h-full object-contain"
                              />

                              {/* Botão Remover Foto Atual */}
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="solid"
                                className="absolute top-2 right-2 z-10"
                                onPress={() =>
                                  handleRemoveFoto(
                                    editFotos[
                                      modalCarouselIndex % editFotos.length
                                    ]
                                  )
                                }
                                isDisabled={isDevolvido}
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Botões de Navegação */}
                            {editFotos.length > 1 && (
                              <>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="solid"
                                  color="default"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onPress={() => {
                                    setModalCarouselIndex(
                                      (prev) =>
                                        (prev - 1 + editFotos.length) %
                                        editFotos.length
                                    );
                                  }}
                                >
                                  <ChevronLeftIcon className="w-5 h-5" />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="solid"
                                  color="default"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onPress={() => {
                                    setModalCarouselIndex(
                                      (prev) => (prev + 1) % editFotos.length
                                    );
                                  }}
                                >
                                  <ChevronRightIcon className="w-5 h-5" />
                                </Button>
                              </>
                            )}

                            {/* Indicadores de Posição */}
                            {editFotos.length > 1 && (
                              <div className="flex gap-1 justify-center mt-3">
                                {editFotos.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setModalCarouselIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${
                                      modalCarouselIndex % editFotos.length ===
                                      idx
                                        ? "w-8 bg-primary"
                                        : "w-2 bg-gray-300 hover:bg-gray-400"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Miniaturas */}
                            {editFotos.length > 1 && (
                              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                {editFotos.map((url, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setModalCarouselIndex(idx)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                      modalCarouselIndex % editFotos.length ===
                                      idx
                                        ? "border-primary-500 ring-2 ring-primary-200"
                                        : "border-gray-300 hover:border-primary-300"
                                    }`}
                                  >
                                    <img
                                      src={url}
                                      alt={`Miniatura ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Preview das novas fotos selecionadas com Carrossel */}
                      {fotos.length > 0 && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Novas fotos selecionadas ({fotos.length}):
                          </label>
                          <div className="relative group">
                            {/* Imagem Principal */}
                            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-primary-200">
                              <img
                                src={URL.createObjectURL(
                                  fotos[newPhotosCarouselIndex % fotos.length]
                                )}
                                alt={`Nova foto ${newPhotosCarouselIndex + 1}`}
                                className="w-full h-full object-contain"
                              />

                              {/* Botão Remover Foto Atual */}
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="solid"
                                className="absolute top-2 right-2 z-10"
                                onPress={() => {
                                  const currentIndex =
                                    newPhotosCarouselIndex % fotos.length;
                                  setFotos((prev) =>
                                    prev.filter((_, i) => i !== currentIndex)
                                  );
                                  // Ajustar índice se necessário
                                  if (
                                    newPhotosCarouselIndex >=
                                    fotos.length - 1
                                  ) {
                                    setNewPhotosCarouselIndex(
                                      Math.max(0, fotos.length - 2)
                                    );
                                  }
                                }}
                                isDisabled={isDevolvido}
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Botões de Navegação */}
                            {fotos.length > 1 && (
                              <>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="solid"
                                  color="default"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onPress={() => {
                                    setNewPhotosCarouselIndex(
                                      (prev) =>
                                        (prev - 1 + fotos.length) % fotos.length
                                    );
                                  }}
                                >
                                  <ChevronLeftIcon className="w-5 h-5" />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="solid"
                                  color="default"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onPress={() => {
                                    setNewPhotosCarouselIndex(
                                      (prev) => (prev + 1) % fotos.length
                                    );
                                  }}
                                >
                                  <ChevronRightIcon className="w-5 h-5" />
                                </Button>
                              </>
                            )}

                            {/* Indicadores de Posição */}
                            {fotos.length > 1 && (
                              <div className="flex gap-1 justify-center mt-3">
                                {fotos.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      setNewPhotosCarouselIndex(idx)
                                    }
                                    className={`h-2 rounded-full transition-all ${
                                      newPhotosCarouselIndex % fotos.length ===
                                      idx
                                        ? "w-8 bg-primary"
                                        : "w-2 bg-gray-300 hover:bg-gray-400"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Miniaturas */}
                            {fotos.length > 1 && (
                              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                {fotos.map((file, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      setNewPhotosCarouselIndex(idx)
                                    }
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                      newPhotosCarouselIndex % fotos.length ===
                                      idx
                                        ? "border-primary-500 ring-2 ring-primary-200"
                                        : "border-gray-300 hover:border-primary-300"
                                    }`}
                                  >
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Miniatura ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Upload de novas fotos */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isEditing
                            ? "Adicionar novas fotos:"
                            : "Fotos do produto:"}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={isDevolvido}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setFotos((prev) => [...prev, ...files]);
                          }}
                          className="mt-2 block w-full text-sm text-gray-500 
                        file:mr-4 file:py-2 file:px-4 
                        file:rounded-full file:border-0 
                        file:text-sm file:font-semibold 
                        file:bg-primary-100 file:text-primary-700 
                        hover:file:bg-primary-200 
                        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Formatos aceitos: JPG, PNG, JPEG. Máximo: 5MB por
                          foto. Você pode selecionar múltiplas fotos de uma vez.
                        </p>
                      </div>
                    </div>

                    {/* Seção 6 - Preview/Resumo */}
                    {(selectedProduct || formData.produto_id) && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                          <ArchiveBoxIcon className="w-5 h-5 text-gray-600" />
                          Resumo da RMA
                        </h4>
                        {(() => {
                          const produto =
                            selectedProduct ||
                            produtos.find((p) => p.id === formData.produto_id);
                          const loja = lojas.find(
                            (l) => l.id === formData.loja_id
                          );
                          return produto ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-default-500">
                                    Produto:
                                  </span>
                                  <span className="font-medium">
                                    {produto.descricao}
                                  </span>
                                </div>
                                {produto.marca && (
                                  <div className="flex justify-between">
                                    <span className="text-default-500">
                                      Marca:
                                    </span>
                                    <span>{produto.marca}</span>
                                  </div>
                                )}
                                {produto.modelo && (
                                  <div className="flex justify-between">
                                    <span className="text-default-500">
                                      Modelo:
                                    </span>
                                    <span>{produto.modelo}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                {loja && (
                                  <div className="flex justify-between">
                                    <span className="text-default-500">
                                      Loja:
                                    </span>
                                    <span>{loja.nome}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-default-500">
                                    Quantidade:
                                  </span>
                                  <span className="font-medium text-primary">
                                    {formData.quantidade || 1}
                                  </span>
                                </div>
                                {formData.tipo_rma && (
                                  <div className="flex justify-between">
                                    <span className="text-default-500">
                                      Tipo:
                                    </span>
                                    <span className="font-medium">
                                      {TIPO_RMA_OPTIONS.find(
                                        (t) => t.key === formData.tipo_rma
                                      )?.label || formData.tipo_rma}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </ModalBody>
                {/* Atualizar o footer do modal */}
                <ModalFooter className="bg-default-50 rounded-b-lg">
                  <Button
                    variant="light"
                    onPress={handleClose}
                    className="font-medium"
                    isDisabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={() => handleSave()}
                    className="font-medium px-6"
                    isDisabled={
                      !formData.produto_id ||
                      !formData.loja_id ||
                      (formData.tipo_rma_origem === "cliente" &&
                        !formData.cliente_id) ||
                      saving ||
                      isDevolvido
                    }
                    isLoading={saving}
                  >
                    {saving
                      ? isEditing
                        ? "Atualizando..."
                        : "Salvando..."
                      : isEditing
                        ? " Atualizar"
                        : " Salvar"}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          );
        })()}

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 bg-danger-50 text-danger-800 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-danger-100 rounded-full">🗑️</div>
              <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-danger-50 rounded-lg">
                <p className="text-lg font-semibold text-danger-800 mb-2">
                  Tem certeza que deseja excluir este RMA?
                </p>
                <p className="text-danger-600 mb-2">
                  <strong>Produto:</strong> {deleteModal.itemName}
                </p>
                {deleteModal.item && (
                  <p className="text-danger-600">
                    <strong>Quantidade:</strong> {deleteModal.item.quantidade}{" "}
                    unidade(s)
                  </p>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 text-xl">ℹ️</span>
                  <div className="text-left">
                    <p className="font-semibold text-blue-800 mb-1">
                      Devolução ao Estoque
                    </p>
                    <p className="text-sm text-blue-700">
                      {deleteModal.item && (
                        <>
                          <strong>
                            {deleteModal.item.quantidade} unidade(s)
                          </strong>{" "}
                          será(ão) devolvida(s) ao estoque da loja de origem
                          automaticamente.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-warning-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-warning-600 text-xl">⚠️</span>
                  <div className="text-left">
                    <p className="font-semibold text-warning-800 mb-1">
                      Atenção!
                    </p>
                    <p className="text-sm text-warning-700">
                      Esta ação não pode ser desfeita. O RMA será
                      permanentemente removido do sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="bg-default-50 rounded-b-lg">
            <Button
              variant="light"
              onPress={cancelDelete}
              className="font-medium"
              isDisabled={loading || deleting}
            >
              ❌ Cancelar
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              className="font-medium px-6"
              isLoading={loading || deleting}
              isDisabled={loading || deleting}
            >
              {loading || deleting ? "Excluindo..." : "🗑️ Confirmar Exclusão"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação - Devolução ao Estoque */}
      <Modal
        isOpen={showDevolucaoEstoqueModal}
        onClose={() => {
          setShowDevolucaoEstoqueModal(false);
          setPendingStatus(null);
        }}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 bg-warning-50 text-warning-700">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6" />
              <span>⚠️ Confirmar Devolução ao Estoque</span>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <p className="text-default-700">
                Ao alterar o status para <strong>"Devolvido ao Estoque"</strong>
                , as seguintes ações serão realizadas automaticamente:
              </p>

              {/* Informações do Produto e Loja */}
              {selectedProduct && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-primary-700 mb-2 flex items-center gap-2">
                    <ArchiveBoxIcon className="w-4 h-4" />
                    Detalhes da Devolução:
                  </p>
                  <div className="text-sm text-default-600 space-y-1">
                    <p>
                      <strong>Produto:</strong> {selectedProduct.marca}{" "}
                      {selectedProduct.modelo}
                    </p>
                    <p>
                      <strong>Loja:</strong>{" "}
                      {lojas.find((l) => l.id === formData.loja_id)?.nome ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Quantidade:</strong> {formData.quantidade || 1}{" "}
                      unidade(s)
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-r-lg">
                <ul className="space-y-2 text-sm text-default-600">
                  <li className="flex items-start gap-2">
                    <ArchiveBoxIcon className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>{formData.quantidade || 1} unidade(s)</strong>{" "}
                      será(ão) adicionada(s) ao estoque da loja selecionada
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <LockClosedIcon className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Este RMA{" "}
                      <strong className="text-danger-600">
                        não poderá mais ser editado
                      </strong>{" "}
                      após a confirmação.{" "}
                      <strong className="text-danger-600">
                        Todos os campos ficarão bloqueados permanentemente.
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-600 font-bold">📝</span>
                    <span>
                      A operação será registrada automaticamente no histórico
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-danger-50 border-2 border-danger-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-danger-700 mb-1">
                      ⚠️ ATENÇÃO: Ação Irreversível
                    </p>
                    <p className="text-danger-600">
                      Após confirmar esta ação, você{" "}
                      <strong>
                        NÃO poderá mais editar, alterar ou modificar
                      </strong>{" "}
                      qualquer informação deste RMA. Certifique-se de que todos
                      os dados estão corretos antes de prosseguir.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-default-700 font-semibold text-center">
                Tem certeza que deseja continuar?
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setShowDevolucaoEstoqueModal(false);
                setPendingStatus(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              color="warning"
              onPress={async () => {
                if (pendingStatus) {
                  // Atualiza o formData com o novo status
                  setFormData({ ...formData, status: pendingStatus });

                  // Fecha o modal
                  setShowDevolucaoEstoqueModal(false);

                  // Chama o handleSave passando o status diretamente
                  await handleSave(pendingStatus);

                  setPendingStatus(null);
                }
              }}
              className="font-semibold"
            >
              ✅ Confirmar Devolução
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Toaster position="top-right" />
    </div>
  );
}

// Função utilitária para extrair mensagem de erro
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    return JSON.stringify(error, null, 2);
  }
  return "Erro desconhecido";
}
