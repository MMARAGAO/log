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
} from "@heroui/react";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { supabase } from "@/lib/supabaseClient";
import toast, { Toaster } from "react-hot-toast";
import {
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const STATUS_OPTIONS = [
  {
    key: "solicitado",
    label: "1. Solicitado pelo Cliente",
    description: "Cliente informou problema/devolução",
  },
  {
    key: "em_analise",
    label: "2. Em Análise",
    description: "Avaliando validade da solicitação",
  },
  {
    key: "aprovado",
    label: "3. Aprovado - RMA Emitido",
    description: "Código RMA gerado, aguardando envio",
  },
  {
    key: "reprovado",
    label: "❌ Reprovado",
    description: "Solicitação não aprovada",
  },
  {
    key: "em_transito",
    label: "4. Em Trânsito",
    description: "Produto sendo enviado ao centro logístico",
  },
  {
    key: "recebido",
    label: "5. Recebido",
    description: "Produto recebido, aguardando inspeção",
  },
  {
    key: "em_inspecao",
    label: "6. Em Inspeção",
    description: "Testando e verificando estado do produto",
  },
  {
    key: "em_reparo",
    label: "7a. Em Reparo",
    description: "Produto sendo reparado",
  },
  {
    key: "processando_troca",
    label: "7b. Processando Troca",
    description: "Separando produto para substituição",
  },
  {
    key: "processando_reembolso",
    label: "7c. Processando Reembolso",
    description: "Preparando reembolso/crédito",
  },
  {
    key: "concluido",
    label: "8. ✅ Concluído",
    description: "RMA finalizado e registrado",
  },
];

const ITEMS_PER_PAGE = 9; // 3x3 grid

export default function RmaClientesPage() {
  const [rmaClientes, setRmaClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
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
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: "",
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [editFotos, setEditFotos] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<{ [key: number]: number }>(
    {}
  );
  const [modalCarouselIndex, setModalCarouselIndex] = useState(0);

  const { user } = useAuthStore();
  const acessos = user?.permissoes?.acessos as any;
  const permRmaClientes = acessos?.rma_clientes;
  const canViewRmaClientes = !!permRmaClientes?.ver_rma_clientes;
  const canCreateRmaClientes = !!permRmaClientes?.criar_rma_clientes;

  async function loadRmaClientes() {
    setLoading(true);
    try {
      const data = await fetchTable("rma_clientes");
      setRmaClientes(data || []);
    } catch (error) {
      setRmaClientes([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProdutos() {
    const data = await fetchTable("estoque");
    setProdutos(data || []);
  }

  async function loadClientes() {
    const data = await fetchTable("clientes");
    setClientes(data || []);
  }

  async function loadLojas() {
    const data = await fetchTable("lojas");
    setLojas(data || []);
  }

  useEffect(() => {
    loadRmaClientes();
    loadProdutos();
    loadClientes();
    loadLojas();
  }, []);

  function handleAdd() {
    // Gerar número de RMA automático
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, "0");
    const numeroRma = `RMA-${year}-${randomNum}`;

    setFormData({
      numero_rma: numeroRma,
    });
    setIsEditing(false);
    setIsOpen(true);
  }

  // Função para fazer upload de múltiplas fotos
  async function uploadMultiplePhotos(
    files: File[],
    rmaId: number | string
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${rmaId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("rma_clientes")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Erro ao fazer upload:", uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("rma_clientes")
          .getPublicUrl(fileName);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", file.name, error);
        toast.error(`Erro ao fazer upload de ${file.name}`);
      }
    }

    return uploadedUrls;
  }

  async function handleSave() {
    if (!formData.produto_id || !formData.cliente_id || !formData.loja_id) {
      toast.error("Por favor, selecione um produto, cliente e loja.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedItem) {
        // Fazer upload das novas fotos
        let newPhotoUrls: string[] = [];
        if (fotos.length > 0) {
          newPhotoUrls = await uploadMultiplePhotos(fotos, selectedItem.id);
        }

        // Combinar fotos antigas (não removidas) com novas
        const allPhotos = [...editFotos, ...newPhotoUrls];

        const validRmaFields = {
          produto_id: formData.produto_id,
          cliente_id: formData.cliente_id,
          loja_id: formData.loja_id,
          quantidade: formData.quantidade || 1,
          motivo: formData.motivo || null,
          tipo_rma: formData.tipo_rma || null,
          status: formData.status || "solicitado",
          observacoes: formData.observacoes || null,
          solucao: formData.solucao || null,
          numero_rma: formData.numero_rma || null,
          codigo_rastreio: formData.codigo_rastreio || null,
          analise_interna: formData.analise_interna || null,
          inspecao: formData.inspecao || null,
          updated_at: new Date().toISOString(),
          fotourl: allPhotos.length > 0 ? allPhotos : null,
        };

        const cleanedData = Object.fromEntries(
          Object.entries(validRmaFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        try {
          await updateTable(
            "rma_clientes",
            selectedItem.id,
            cleanedData,
            undefined,
            editFotos
          );

          toast.success("RMA de cliente atualizado com sucesso!");
        } catch (updateError) {
          throw new Error(
            `Erro ao atualizar RMA: ${getErrorMessage(updateError)}`
          );
        }
      } else {
        const validRmaFields = {
          produto_id: formData.produto_id,
          cliente_id: formData.cliente_id,
          loja_id: formData.loja_id,
          quantidade: formData.quantidade || 1,
          motivo: formData.motivo || null,
          tipo_rma: formData.tipo_rma || "troca",
          status: formData.status || "solicitado",
          observacoes: formData.observacoes || null,
          solucao: formData.solucao || null,
          numero_rma: formData.numero_rma || null,
          codigo_rastreio: formData.codigo_rastreio || null,
          analise_interna: formData.analise_interna || null,
          inspecao: formData.inspecao || null,
          data_rma: new Date().toISOString(),
          usuario_id: user?.id || null,
        };

        const cleanedData = Object.fromEntries(
          Object.entries(validRmaFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        try {
          const result = await insertTable("rma_clientes", cleanedData);

          if (fotos.length > 0 && result && result[0]?.id) {
            const photoUrls = await uploadMultiplePhotos(fotos, result[0].id);

            if (photoUrls.length > 0) {
              await updateTable(
                "rma_clientes",
                result[0].id,
                { fotourl: photoUrls },
                undefined,
                []
              );
            }
          }

          toast.success("RMA de cliente cadastrado com sucesso!");
        } catch (insertError) {
          console.error("❌ Erro ao inserir RMA:", insertError);
          throw new Error(`Erro ao criar RMA: ${getErrorMessage(insertError)}`);
        }
      }

      await loadRmaClientes();
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
    setClienteSearchTerm("");
    setSelectedCliente(null);
    setShowClienteSearch(false);
    setSelectedItem(null);
    setFotos([]);
    setEditFotos([]);
    setModalCarouselIndex(0);
  }

  function handleEdit(item: any) {
    setSelectedItem(item);
    setFormData({
      ...item,
      quantidade: item.quantidade || 1,
    });
    setSelectedProduct(produtos.find((p) => p.id === item.produto_id) || null);
    setSelectedCliente(clientes.find((c) => c.id === item.cliente_id) || null);
    setEditFotos(item.fotourl ?? []);
    setFotos([]);
    setModalCarouselIndex(0);
    setIsEditing(true);
    setIsOpen(true);
  }

  async function handleRemoveFoto(url: string) {
    setEditFotos((prev) => prev.filter((f) => f !== url));
  }

  function handleDeleteClick(item: any) {
    const cliente = clientes.find((c) => c.id === item.cliente_id);
    setDeleteModal({
      isOpen: true,
      itemId: item.id,
      itemName: cliente?.nome || `RMA #${item.id}`,
    });
  }

  async function confirmDelete() {
    if (!deleteModal.itemId) return;

    setLoading(true);
    try {
      await deleteTable("rma_clientes", deleteModal.itemId);
      await loadRmaClientes();
      toast.success("RMA excluído com sucesso!");
      setDeleteModal({ isOpen: false, itemId: null, itemName: "" });
    } catch (error) {
      console.error("Erro ao deletar RMA:", error);
      toast.error(`Erro ao deletar RMA: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function cancelDelete() {
    setDeleteModal({ isOpen: false, itemId: null, itemName: "" });
  }

  // Filtros e paginação
  const filteredRmaClientes = useMemo(() => {
    return rmaClientes.filter((item) => {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const cliente = clientes.find((c) => c.id === item.cliente_id);
      const loja = lojas.find((l) => l.id === item.loja_id);

      const searchMatch =
        !searchTerm ||
        produto?.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loja?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.motivo?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = !statusFilter || item.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [rmaClientes, produtos, clientes, lojas, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredRmaClientes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredRmaClientes.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filtrar produtos baseado na pesquisa
  const filteredProdutos = useMemo(() => {
    if (!productSearchTerm) return produtos.slice(0, 16);

    return produtos.filter(
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
  }, [produtos, productSearchTerm]);

  // Filtrar clientes baseado na pesquisa
  const filteredClientes = useMemo(() => {
    if (!clienteSearchTerm) return clientes.slice(0, 16);

    return clientes.filter(
      (cliente) =>
        cliente.nome?.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
        cliente.email
          ?.toLowerCase()
          .includes(clienteSearchTerm.toLowerCase()) ||
        cliente.telefone
          ?.toLowerCase()
          .includes(clienteSearchTerm.toLowerCase()) ||
        cliente.doc?.toLowerCase().includes(clienteSearchTerm.toLowerCase())
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

  function handleSelectCliente(cliente: any) {
    setSelectedCliente(cliente);
    setFormData({ ...formData, cliente_id: cliente.id });
    setShowClienteSearch(false);
    setClienteSearchTerm("");
  }

  function handleOpenClienteSearch() {
    setShowClienteSearch(true);
    setSelectedCliente(null);
  }

  if (!canViewRmaClientes) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar RMA de Clientes.
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
          <h1 className="text-3xl font-bold">RMA de Clientes</h1>
          <p className="text-default-500 mt-1">
            {filteredRmaClientes.length} registro
            {filteredRmaClientes.length !== 1 ? "s" : ""} encontrado
            {filteredRmaClientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreateRmaClientes && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleAdd}
            size="lg"
          >
            Novo RMA Cliente
          </Button>
        )}
      </div>

      {/* Filtros de busca */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por produto, cliente, loja ou motivo..."
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
              const cliente = clientes.find((c) => c.id === item.cliente_id);
              const loja = lojas.find((l) => l.id === item.loja_id);
              return (
                <Card key={item.id} onPress={() => handleEdit(item)}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold line-clamp-1">
                          {cliente?.nome || "Cliente"}
                        </h3>
                        <p className="text-sm text-default-500 line-clamp-1">
                          {produto?.descricao || "Produto"}
                        </p>
                        <p className="text-xs text-default-400 line-clamp-1">
                          📍 {loja?.nome || "N/A"}
                        </p>
                      </div>
                      <Chip
                        color={
                          item.status === "solicitado"
                            ? "warning"
                            : item.status === "em_analise"
                              ? "primary"
                              : item.status === "aprovado"
                                ? "success"
                                : item.status === "reprovado"
                                  ? "danger"
                                  : item.status === "em_transito"
                                    ? "secondary"
                                    : item.status === "recebido"
                                      ? "primary"
                                      : item.status === "em_inspecao"
                                        ? "primary"
                                        : item.status === "em_reparo"
                                          ? "warning"
                                          : item.status === "processando_troca"
                                            ? "secondary"
                                            : item.status ===
                                                "processando_reembolso"
                                              ? "secondary"
                                              : item.status === "concluido"
                                                ? "success"
                                                : "default"
                        }
                        variant="flat"
                        size="sm"
                      >
                        {STATUS_OPTIONS.find((s) => s.key === item.status)
                          ?.label || item.status}
                      </Chip>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">RMA</p>
                        <p className="font-semibold text-xs">
                          {item.numero_rma || `#${item.id}`}
                        </p>
                      </div>
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">Tipo</p>
                        <p className="font-semibold">
                          {item.tipo_rma || "N/A"}
                        </p>
                      </div>
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">Data</p>
                        <p className="font-semibold">
                          {item.data_rma
                            ? new Date(item.data_rma).toLocaleDateString(
                                "pt-BR"
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">Qtd</p>
                        <p className="font-semibold">{item.quantidade}</p>
                      </div>
                    </div>

                    {/* Barra de Progresso das Etapas */}
                    {item.status !== "reprovado" && (
                      <div className="mb-3 p-2 bg-default-50 rounded-lg">
                        <p className="text-xs text-default-500 mb-2">
                          Progresso:
                        </p>
                        <div className="flex items-center gap-1">
                          {[
                            "solicitado",
                            "em_analise",
                            "aprovado",
                            "em_transito",
                            "recebido",
                            "em_inspecao",
                            "concluido",
                          ].map((etapa, idx) => {
                            const statusOrder = [
                              "solicitado",
                              "em_analise",
                              "aprovado",
                              "em_transito",
                              "recebido",
                              "em_inspecao",
                              "em_reparo",
                              "processando_troca",
                              "processando_reembolso",
                              "concluido",
                            ];
                            const currentIndex = statusOrder.indexOf(
                              item.status
                            );
                            const etapaIndex = statusOrder.indexOf(etapa);
                            const isActive = currentIndex >= etapaIndex;
                            const isCurrent =
                              item.status === etapa ||
                              (etapa === "em_inspecao" &&
                                [
                                  "em_reparo",
                                  "processando_troca",
                                  "processando_reembolso",
                                ].includes(item.status));

                            return (
                              <div
                                key={etapa}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  isCurrent
                                    ? "bg-primary animate-pulse"
                                    : isActive
                                      ? "bg-success"
                                      : "bg-default-200"
                                }`}
                                title={
                                  STATUS_OPTIONS.find((s) => s.key === etapa)
                                    ?.label
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {item.codigo_rastreio && (
                      <div className="mt-2 p-2 bg-secondary-50 rounded-lg border border-secondary-200">
                        <p className="text-xs text-secondary-600 font-medium">
                          📦 Rastreio:
                        </p>
                        <p className="text-sm font-mono">
                          {item.codigo_rastreio}
                        </p>
                      </div>
                    )}

                    {item.motivo && (
                      <div className="mt-2 p-2 bg-warning-50 rounded-lg border border-warning-200">
                        <p className="text-xs text-warning-600 font-medium">
                          Motivo:
                        </p>
                        <p className="text-sm line-clamp-2">{item.motivo}</p>
                      </div>
                    )}

                    {item.observacoes && (
                      <div className="mt-2 p-2 bg-primary-50 rounded-lg border border-primary-200">
                        <p className="text-xs text-primary-600 font-medium">
                          Solicitação:
                        </p>
                        <p className="text-sm line-clamp-2">
                          {item.observacoes}
                        </p>
                      </div>
                    )}

                    {item.solucao && item.status === "concluido" && (
                      <div className="mt-2 p-2 bg-success-50 rounded-lg border border-success-200">
                        <p className="text-xs text-success-600 font-medium">
                          ✅ Resolução:
                        </p>
                        <p className="text-sm line-clamp-2">{item.solucao}</p>
                      </div>
                    )}

                    {/* Carrossel de Fotos */}
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

                    {/* Botões de ação */}
                    {(canCreateRmaClientes ||
                      permRmaClientes?.deletar_rma_clientes) && (
                      <div className="flex gap-2 mt-3">
                        {canCreateRmaClientes && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={() => handleEdit(item)}
                            className="flex-1"
                          >
                            Editar
                          </Button>
                        )}
                        {permRmaClientes?.deletar_rma_clientes && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDeleteClick(item)}
                            className="flex-1"
                            startContent={<TrashIcon className="w-4 h-4" />}
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
          {filteredRmaClientes.length === 0 && !loading && (
            <Card>
              <CardBody className="text-center py-12">
                <div className="text-6xl mb-4">
                  <MagnifyingGlassIcon className="w-16 h-16 text-default-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum RMA de Cliente encontrado
                </h3>
                <p className="text-default-500 mb-4">
                  {searchTerm || statusFilter
                    ? "Tente ajustar os filtros de busca"
                    : "Não há registros de RMA de clientes cadastrados"}
                </p>
                {canCreateRmaClientes && (
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
      {(canCreateRmaClientes || isEditing) && (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          size="3xl"
          scrollBehavior="outside"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 rounded-t-lg">
              <h2 className="text-xl font-bold">
                {isEditing ? "Editar RMA de Cliente" : "Novo RMA de Cliente"}
              </h2>
              <p className="text-sm text-default-500">
                {isEditing
                  ? "Atualize as informações do RMA"
                  : "Registre uma nova solicitação de RMA de cliente"}
              </p>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="space-y-6">
                {/* Seção 1 - Seleção de Cliente */}
                <div className="p-4 bg-default-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-primary">
                    Selecionar Cliente
                  </h3>

                  {selectedCliente || formData.cliente_id ? (
                    <div className="p-4 bg-success-50 rounded-lg mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-success-800">
                            {selectedCliente?.nome ||
                              clientes.find((c) => c.id === formData.cliente_id)
                                ?.nome}
                          </h4>
                          <p className="text-sm text-success-600">
                            {selectedCliente?.email ||
                              clientes.find((c) => c.id === formData.cliente_id)
                                ?.email}
                          </p>
                          <p className="text-sm text-success-600">
                            {selectedCliente?.telefone ||
                              clientes.find((c) => c.id === formData.cliente_id)
                                ?.telefone}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          onPress={handleOpenClienteSearch}
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      color="primary"
                      variant="flat"
                      className="w-full mb-3"
                      size="lg"
                      onPress={handleOpenClienteSearch}
                      startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                    >
                      Buscar e Selecionar Cliente
                    </Button>
                  )}

                  {showClienteSearch && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Buscar Clientes</h4>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => setShowClienteSearch(false)}
                        >
                          ✕
                        </Button>
                      </div>

                      <Input
                        placeholder="Digite nome, email, telefone ou CPF/CNPJ..."
                        value={clienteSearchTerm}
                        onChange={(e) => setClienteSearchTerm(e.target.value)}
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
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              isPressable
                              onPress={() => handleSelectCliente(cliente)}
                            >
                              <CardBody className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={cliente.fotourl?.[0]}
                                    name={cliente.nome?.charAt(0)}
                                    size="sm"
                                  />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm line-clamp-1">
                                      {cliente.nome}
                                    </h5>
                                    <p className="text-xs text-default-500 line-clamp-1">
                                      {cliente.email}
                                    </p>
                                    <p className="text-xs text-default-400">
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
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-default-500">
                              Nenhum cliente encontrado
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Seção 2 - Seleção de Produto */}
                <div className="p-4 bg-default-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-primary">
                    Selecionar Produto
                  </h3>

                  {selectedProduct || formData.produto_id ? (
                    <div className="p-4 bg-success-50 rounded-lg mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-success-800">
                            {selectedProduct?.descricao ||
                              produtos.find((p) => p.id === formData.produto_id)
                                ?.descricao}
                          </h4>
                          <p className="text-sm text-success-600">
                            {selectedProduct?.marca ||
                              produtos.find((p) => p.id === formData.produto_id)
                                ?.marca}{" "}
                            {selectedProduct?.modelo ||
                              produtos.find((p) => p.id === formData.produto_id)
                                ?.modelo}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          onPress={handleOpenProductSearch}
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      color="primary"
                      variant="flat"
                      className="w-full mb-3"
                      size="lg"
                      onPress={handleOpenProductSearch}
                      startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                    >
                      Buscar e Selecionar Produto
                    </Button>
                  )}

                  {showProductSearch && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Buscar Produtos</h4>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => setShowProductSearch(false)}
                        >
                          ✕
                        </Button>
                      </div>

                      <Input
                        placeholder="Digite para buscar produtos..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        startContent={
                          <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                        }
                        size="md"
                        variant="bordered"
                        isClearable
                        onClear={() => setProductSearchTerm("")}
                      />

                      <div className="max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {filteredProdutos.map((produto) => (
                            <Card
                              key={produto.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
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
                                      <p className="line-clamp-1">
                                        {produto.modelo}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          ))}
                        </div>

                        {filteredProdutos.length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-default-500">
                              Nenhum produto encontrado
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Seção 3 - Loja e Detalhes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-default-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-primary">
                      Loja
                    </h3>
                    <Select
                      label="Loja Responsável"
                      selectedKeys={
                        formData.loja_id ? [formData.loja_id.toString()] : []
                      }
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0] as string;
                        setFormData({ ...formData, loja_id: Number(key) });
                      }}
                      size="md"
                      placeholder="Selecione a loja"
                      variant="bordered"
                    >
                      {lojas.map((l) => (
                        <SelectItem key={l.id} textValue={l.nome}>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{l.nome}</span>
                            {l.endereco && (
                              <span className="text-xs text-default-500">
                                {l.endereco}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="p-4 bg-warning-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-warning-700">
                      Detalhes
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Quantidade"
                        type="number"
                        placeholder="1"
                        min="1"
                        value={formData.quantidade?.toString() || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantidade: Number(e.target.value) || 1,
                          })
                        }
                        variant="bordered"
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                              Qtd
                            </span>
                          </div>
                        }
                      />
                      <Select
                        label="Tipo de RMA"
                        selectedKeys={
                          formData.tipo_rma ? [formData.tipo_rma] : []
                        }
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys)[0] as string;
                          setFormData({ ...formData, tipo_rma: key });
                        }}
                        size="md"
                        placeholder="Tipo"
                        variant="bordered"
                      >
                        <SelectItem key="troca">🔄 Troca</SelectItem>
                        <SelectItem key="garantia">🛡️ Garantia</SelectItem>
                        <SelectItem key="reparo">🔧 Reparo</SelectItem>
                        <SelectItem key="devolucao">↩️ Devolução</SelectItem>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seção 4 - Etapa e Rastreamento */}
                <div className="p-4 bg-success-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-success-700">
                    Etapa do Processo e Rastreamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Status / Etapa do RMA"
                      selectedKeys={
                        formData.status ? [formData.status] : ["solicitado"]
                      }
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0] as string;
                        setFormData({ ...formData, status: key });
                      }}
                      size="md"
                      placeholder="Selecione a etapa"
                      variant="bordered"
                      description="Selecione a etapa atual do processo de RMA"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.key}
                          textValue={option.label}
                          startContent={
                            <Chip
                              size="sm"
                              color={
                                option.key === "solicitado"
                                  ? "warning"
                                  : option.key === "em_analise"
                                    ? "primary"
                                    : option.key === "aprovado"
                                      ? "success"
                                      : option.key === "reprovado"
                                        ? "danger"
                                        : option.key === "em_transito"
                                          ? "secondary"
                                          : option.key === "recebido"
                                            ? "primary"
                                            : option.key === "em_inspecao"
                                              ? "primary"
                                              : option.key === "em_reparo"
                                                ? "warning"
                                                : option.key ===
                                                    "processando_troca"
                                                  ? "secondary"
                                                  : option.key ===
                                                      "processando_reembolso"
                                                    ? "secondary"
                                                    : option.key === "concluido"
                                                      ? "success"
                                                      : "default"
                              }
                              variant="flat"
                            />
                          }
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {option.label}
                            </span>
                            <span className="text-xs text-default-400">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      label="Motivo da RMA"
                      placeholder="Ex: Defeito, produto errado, etc."
                      value={formData.motivo || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, motivo: e.target.value })
                      }
                      variant="bordered"
                    />
                  </div>

                  {/* Campos adicionais baseados no status */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Número do RMA"
                      placeholder="Ex: RMA-2025-001"
                      value={formData.numero_rma || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, numero_rma: e.target.value })
                      }
                      variant="bordered"
                      description="Código único para rastreamento"
                      startContent={
                        <span className="text-default-400 text-sm">#</span>
                      }
                      isDisabled
                    />

                    {(formData.status === "em_transito" ||
                      formData.status === "recebido" ||
                      formData.status === "em_inspecao" ||
                      formData.status === "em_reparo" ||
                      formData.status === "processando_troca" ||
                      formData.status === "processando_reembolso" ||
                      formData.status === "concluido") && (
                      <Input
                        label="Código de Rastreio"
                        placeholder="Ex: BR123456789BR"
                        value={formData.codigo_rastreio || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            codigo_rastreio: e.target.value,
                          })
                        }
                        variant="bordered"
                        description="Código dos Correios ou transportadora"
                      />
                    )}
                  </div>
                </div>

                {/* Seção 5 - Detalhes do Processo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-primary-700">
                      1. Solicitação do Cliente
                    </h3>
                    <Textarea
                      placeholder="Detalhes do problema relatado pelo cliente, motivo da devolução, estado do produto..."
                      value={formData.observacoes || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observacoes: e.target.value,
                        })
                      }
                      variant="bordered"
                      minRows={4}
                      maxRows={6}
                      classNames={{
                        input: "resize-none",
                      }}
                    />
                  </div>

                  <div className="p-4 bg-warning-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-warning-700">
                      2. Análise Interna
                    </h3>
                    <Textarea
                      placeholder="Avaliação da validade da solicitação, verificação de garantia, política de devolução..."
                      value={formData.analise_interna || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          analise_interna: e.target.value,
                        })
                      }
                      variant="bordered"
                      minRows={4}
                      maxRows={6}
                      classNames={{
                        input: "resize-none",
                      }}
                    />
                  </div>
                </div>

                {/* Seção 6 - Inspeção e Resolução */}
                {(formData.status === "recebido" ||
                  formData.status === "em_inspecao" ||
                  formData.status === "em_reparo" ||
                  formData.status === "processando_troca" ||
                  formData.status === "processando_reembolso" ||
                  formData.status === "concluido") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary-50 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-secondary-700">
                        5/6. Recebimento e Inspeção
                      </h3>
                      <Textarea
                        placeholder="Estado do produto recebido, testes realizados, diagnóstico técnico..."
                        value={formData.inspecao || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, inspecao: e.target.value })
                        }
                        variant="bordered"
                        minRows={4}
                        maxRows={6}
                        classNames={{
                          input: "resize-none",
                        }}
                      />
                    </div>

                    <div className="p-4 bg-success-50 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-success-700">
                        7. Resolução Aplicada
                      </h3>
                      <Textarea
                        placeholder="Ação tomada: reparo realizado, produto trocado, valor reembolsado, crédito concedido..."
                        value={formData.solucao || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, solucao: e.target.value })
                        }
                        variant="bordered"
                        minRows={4}
                        maxRows={6}
                        classNames={{
                          input: "resize-none",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Seção 7 - Fotos com Carrossel no Modal */}
                <div className="p-4 bg-default-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-default-700">
                    📸 Fotos e Evidências do RMA
                  </h3>
                  <p className="text-xs text-default-500 mb-3">
                    Adicione fotos do produto, nota fiscal, etiqueta de envio,
                    etc.
                  </p>

                  {/* Carrossel de Fotos Existentes */}
                  {isEditing && editFotos.length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-default-600 mb-2 block">
                        Fotos atuais ({editFotos.length}):
                      </label>
                      <div className="bg-default-100 rounded-lg p-3">
                        <div className="relative group">
                          <div className="w-full h-64 rounded-lg overflow-hidden bg-default-200">
                            <img
                              src={
                                editFotos[modalCarouselIndex % editFotos.length]
                              }
                              alt={`Foto ${modalCarouselIndex + 1}`}
                              className="w-full h-full object-contain cursor-pointer"
                              onClick={() =>
                                window.open(
                                  editFotos[
                                    modalCarouselIndex % editFotos.length
                                  ],
                                  "_blank"
                                )
                              }
                            />
                          </div>

                          {/* Botão de remover foto */}
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="solid"
                            className="absolute top-2 right-2"
                            onPress={() =>
                              handleRemoveFoto(
                                editFotos[modalCarouselIndex % editFotos.length]
                              )
                            }
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>

                          {editFotos.length > 1 && (
                            <>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="solid"
                                color="default"
                                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => {
                                  setModalCarouselIndex(
                                    (prev) =>
                                      (prev - 1 + editFotos.length) %
                                      editFotos.length
                                  );
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
                                  setModalCarouselIndex(
                                    (prev) => (prev + 1) % editFotos.length
                                  );
                                }}
                              >
                                <ChevronRightIcon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>

                        {/* Indicadores */}
                        {editFotos.length > 1 && (
                          <div className="flex gap-1 justify-center mt-3">
                            {editFotos.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setModalCarouselIndex(idx)}
                                className={`h-1.5 rounded-full transition-all ${
                                  modalCarouselIndex % editFotos.length === idx
                                    ? "w-6 bg-primary"
                                    : "w-1.5 bg-default-300 hover:bg-default-400"
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Miniaturas */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {editFotos.map((url, idx) => (
                            <div
                              key={url}
                              className={`relative cursor-pointer ${
                                idx === modalCarouselIndex % editFotos.length
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                              onClick={() => setModalCarouselIndex(idx)}
                            >
                              <Avatar
                                src={url}
                                size="md"
                                className="w-16 h-16"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Preview das novas fotos */}
                  {fotos.length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-default-600 mb-2 block">
                        Novas fotos selecionadas ({fotos.length}):
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {fotos.map((file, index) => (
                          <div key={index} className="relative">
                            <Avatar
                              src={URL.createObjectURL(file)}
                              size="lg"
                              className="w-20 h-20"
                            />
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="solid"
                              className="absolute -top-2 -right-2 min-w-6 w-6 h-6"
                              onPress={() => {
                                setFotos((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload de novas fotos */}
                  <div>
                    <label className="text-sm font-medium text-default-600 mb-2 block">
                      {isEditing
                        ? "Adicionar novas fotos:"
                        : "Fotos do produto:"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
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
                        cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-default-400">
                      Formatos aceitos: JPG, PNG, JPEG. Máximo: 5MB por foto.
                      Você pode selecionar múltiplas fotos de uma vez.
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>
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
                onPress={handleSave}
                className="font-medium px-6"
                isDisabled={
                  !formData.produto_id ||
                  !formData.cliente_id ||
                  !formData.loja_id ||
                  saving
                }
                isLoading={saving}
              >
                {saving
                  ? isEditing
                    ? "Atualizando..."
                    : "Salvando..."
                  : isEditing
                    ? "Atualizar"
                    : "Salvar"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

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
                <p className="text-danger-600">
                  <strong>Cliente:</strong> {deleteModal.itemName}
                </p>
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
              isDisabled={loading}
            >
              ❌ Cancelar
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              className="font-medium px-6"
              isLoading={loading}
              isDisabled={loading}
            >
              {loading ? "Excluindo..." : "🗑️ Confirmar Exclusão"}
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
