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
} from "@heroui/react";
import {
  PlusIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import toast, { Toaster } from 'react-hot-toast';
import { TrashIcon } from "@heroicons/react/24/outline";

const STATUS_OPTIONS = [
  { key: "pendente", label: "Pendente" },
  { key: "enviado", label: "Enviado para Assistência" },
  { key: "concluido", label: "Concluído" },
];

const ITEMS_PER_PAGE = 9; // 3x3 grid

export default function RmaPage() {
  const [rma, setRma] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
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
  const [selectedItem, setSelectedItem] = useState<any>(null); // Para edição
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null, itemName: "" });

  const { user } = useAuthStore();
  const acessos = user?.permissoes?.acessos;
  const permRma = acessos?.rma;
  const canViewRma = !!permRma?.ver_rma;
  const canCreateRma = !!permRma?.criar_rma;

  async function loadRma() {
    setLoading(true);
    try {
      const data = await fetchTable("rma");
      setRma(data || []);
    } catch (error) {
      setRma([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadProdutos() {
    const data = await fetchTable("estoque");
    setProdutos(data || []);
  }

  async function loadLojas() {
    const data = await fetchTable("lojas");
    setLojas(data || []);
  }

  useEffect(() => {
    loadRma();
    loadProdutos();
    loadLojas();
  }, []);

  function handleAdd() {
    setFormData({});
    setIsEditing(false);
    setIsOpen(true);
  }

  async function handleSave() {
    if (!formData.produto_id || !formData.loja_id) {
      toast.error("Por favor, selecione um produto e uma loja.");
      return;
    }

    setSaving(true);
    try {


      if (isEditing && selectedItem) {
        

        // Criar objeto apenas com campos válidos da tabela RMA
        const validRmaFields = {
          produto_id: formData.produto_id,
          loja_id: formData.loja_id,
          quantidade: formData.quantidade || 1,
          motivo: formData.motivo || null,
          tipo_rma: formData.tipo_rma || null,
          status: formData.status || "pendente",
          observacoes: formData.observacoes || null,
          updated_at: new Date().toISOString(),
        };

        // Remover campos undefined para evitar problemas
        const cleanedData = Object.fromEntries(
          Object.entries(validRmaFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        

        try {
          const updateResult = await updateTable(
            "rma",
            selectedItem.id,
            cleanedData
          );
          
          toast.success("RMA atualizado com sucesso!");
        } catch (updateError) {
          console.error("❌ Erro ao atualizar RMA:", updateError);
          throw new Error(
            `Erro ao atualizar RMA: ${getErrorMessage(updateError)}`
          );
        }
      } else {
        

        // Criar objeto apenas com campos válidos da tabela RMA
        const validRmaFields = {
          produto_id: formData.produto_id,
          loja_id: formData.loja_id,
          quantidade: formData.quantidade || 1,
          motivo: formData.motivo || null,
          tipo_rma: formData.tipo_rma || "troca",
          status: formData.status || "pendente",
          observacoes: formData.observacoes || null,
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
          const result = await insertTable("rma", cleanedData);
         
          toast.success("RMA cadastrado com sucesso!");
        } catch (insertError) {
          console.error("❌ Erro ao inserir RMA:", insertError);
          throw new Error(
            `Erro ao criar RMA: ${getErrorMessage(insertError)}`
          );
        }
      }

      
      await loadRma();

      
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
  }

  function handleEdit(item: any) {
    setSelectedItem(item); // Salvar item para edição
    setFormData({
      ...item,
      quantidade: item.quantidade || 1,
    });
    setSelectedProduct(produtos.find(p => p.id === item.produto_id) || null);
    setIsEditing(true);
    setIsOpen(true);
  }

  // Deletar RMA - versão atualizada
  function handleDeleteClick(item: any) {
    const produto = produtos.find((p) => p.id === item.produto_id);
    setDeleteModal({
      isOpen: true,
      itemId: item.id,
      itemName: produto?.descricao || `RMA #${item.id}`,
    });
  }

  async function confirmDelete() {
    if (!deleteModal.itemId) return;

    setLoading(true);
    try {
      await deleteTable("rma", deleteModal.itemId);
      await loadRma();
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
  const filteredRma = useMemo(() => {
    return rma.filter((item) => {
      const produto = produtos.find((p) => p.id === item.produto_id);
      const loja = lojas.find((l) => l.id === item.loja_id);

      const searchMatch =
        !searchTerm ||
        produto?.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loja?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.motivo?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = !statusFilter || item.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [rma, produtos, lojas, searchTerm, statusFilter]);

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredRma.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredRma.slice(startIndex, endIndex);

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filtrar produtos baseado na pesquisa
  const filteredProdutos = useMemo(() => {
    if (!productSearchTerm) return produtos.slice(0, 16); // Mostrar apenas 16 produtos inicialmente

    return produtos.filter(
      (produto) =>
        produto.descricao?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        produto.marca?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        produto.modelo?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        produto.compativel?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [produtos, productSearchTerm]);

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
          <h1 className="text-3xl font-bold">Controle de RMA</h1>
          <p className="text-default-500 mt-1">
            {filteredRma.length} registro
            {filteredRma.length !== 1 ? "s" : ""} encontrado
            {filteredRma.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreateRma && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleAdd}
            size="lg"
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
              return (
                <Card
                  key={item.id}

                  
                  onPress={() => handleEdit(item)}
                >
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold line-clamp-1">
                          {produto?.descricao || "Produto"}
                        </h3>
                        <p className="text-sm text-default-500 line-clamp-1">
                          {produto?.marca} {produto?.modelo}
                        </p>
                        <p className="text-sm text-default-500 line-clamp-1">
                          📍 {loja?.nome || "N/A"}
                        </p>
                      </div>
                      <Chip
                        color={
                          item.status === "pendente"
                            ? "warning"
                            : item.status === "enviado"
                            ? "primary"
                            : "success"
                        }
                        variant="flat"
                        size="sm"
                      >
                        {STATUS_OPTIONS.find((s) => s.key === item.status)?.label ||
                          item.status}
                      </Chip>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">Quantidade</p>
                        <p className="font-semibold">{item.quantidade}</p>
                      </div>
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">Tipo</p>
                        <p className="font-semibold">{item.tipo_rma || "N/A"}</p>
                      </div>
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">Data RMA</p>
                        <p className="font-semibold">
                          {item.data_rma
                            ? new Date(item.data_rma).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-default-50 rounded-lg p-2">
                        <p className="text-default-500 text-xs">ID</p>
                        <p className="font-semibold">#{item.id}</p>
                      </div>
                    </div>

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
                          Observações:
                        </p>
                        <p className="text-sm line-clamp-2">{item.observacoes}</p>
                      </div>
                    )}

                    {/* Adicionar botões de ação no card */}
                    {(canCreateRma || permRma?.deletar_rma) && (
                      <div className="flex gap-2 mt-3">
                        {canCreateRma && (
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
                        {permRma?.deletar_rma && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDeleteClick(item)} // Mudança aqui
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
      {(canCreateRma || isEditing) && (
        <Modal isOpen={isOpen} onClose={handleClose} size="3xl" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-t-lg">
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
                {/* Seção 1 - Seleção de Produto */}
                <div className="p-4 bg-default-50 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-3 text-primary">
                    Selecionar Produto
                  </h3>

                  {/* Produto selecionado ou botão para buscar */}
                  {selectedProduct || formData.produto_id ? (
                    <div className="p-4 bg-success-50 rounded-lg border border-success-200 mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-success-800">
                            {selectedProduct?.descricao || 
                             produtos.find(p => p.id === formData.produto_id)?.descricao}
                          </h4>
                          <p className="text-sm text-success-600">
                            {selectedProduct?.marca || produtos.find(p => p.id === formData.produto_id)?.marca} {" "}
                            {selectedProduct?.modelo || produtos.find(p => p.id === formData.produto_id)?.modelo}
                          </p>
                          {(selectedProduct?.preco_venda || produtos.find(p => p.id === formData.produto_id)?.preco_venda) && (
                            <p className="text-sm font-medium text-success-700">
                              R$ {(selectedProduct?.preco_venda || produtos.find(p => p.id === formData.produto_id)?.preco_venda)?.toFixed(2)}
                            </p>
                          )}
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

                  {/* Modal de busca de produtos */}
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
                      
                      {/* Input de busca */}
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

                      {/* Contador de resultados */}
                      <div className="flex justify-between items-center text-sm text-default-500">
                        <span>
                          {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? 's' : ''} encontrado{filteredProdutos.length !== 1 ? 's' : ''}
                        </span>
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

                      {/* Grid de produtos 4x4 */}
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
                                      <p className="line-clamp-1">{produto.marca}</p>
                                    )}
                                    {produto.modelo && (
                                      <p className="line-clamp-1">{produto.modelo}</p>
                                    )}
                                    {produto.preco_venda && (
                                      <p className="font-semibold text-success-600">
                                        R$ {produto.preco_venda.toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                  {produto.compativel && (
                                    <div className="bg-warning-50 rounded px-2 py-1">
                                      <p className="text-xs text-warning-700 line-clamp-1">
                                        {produto.compativel}
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
                            <div className="text-4xl mb-2">🔍</div>
                            <p className="text-default-500">
                              Nenhum produto encontrado
                            </p>
                            <p className="text-sm text-default-400">
                              Tente buscar com outros termos
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
                  <div className="p-4 bg-default-50 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-3 text-primary">Loja</h3>
                    <Select
                      label="Loja de Origem"
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

                  {/* Detalhes da RMA */}
                  <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                    <h3 className="text-lg font-semibold mb-3 text-warning-700">
                      Detalhes da RMA
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
                            <span className="text-default-400 text-small">Qtd</span>
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
                        <SelectItem key="assistencia">🔧 Assistência</SelectItem>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seção 3 - Status e Motivo */}
                <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                  <h3 className="text-lg font-semibold mb-3 text-success-700">
                    Status e Motivo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Status Atual"
                      selectedKeys={
                        formData.status ? [formData.status] : ["pendente"]
                      }
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0] as string;
                        setFormData({ ...formData, status: key });
                      }}
                      size="md"
                      placeholder="Selecione o status"
                      variant="bordered"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.key}
                          startContent={
                            <Chip
                              size="sm"
                              color={
                                option.key === "pendente"
                                  ? "warning"
                                  : option.key === "enviado"
                                  ? "primary"
                                  : "success"
                              }
                              variant="flat"
                            />
                          }
                        >
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
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small"></span>
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* Seção 4 - Observações */}
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <h3 className="text-lg font-semibold mb-3 text-primary-700">
                    Observações
                  </h3>
                  <Textarea
                    placeholder="Informações adicionais sobre a RMA, condições do produto, procedimentos realizados, etc."
                    value={formData.observacoes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    variant="bordered"
                    minRows={4}
                    maxRows={6}
                    classNames={{
                      input: "resize-none",
                    }}
                  />
                </div>

                {/* Seção 5 - Preview/Resumo */}
                {(selectedProduct || formData.produto_id) && (
                  <div className="p-4 bg-default-100 rounded-lg border">
                    <h4 className="font-semibold mb-3 text-default-700">
                      Resumo da RMA
                    </h4>
                    {(() => {
                      const produto = selectedProduct || produtos.find(p => p.id === formData.produto_id);
                      const loja = lojas.find((l) => l.id === formData.loja_id);
                      return produto ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-default-500">Produto:</span>
                              <span className="font-medium">{produto.descricao}</span>
                            </div>
                            {produto.marca && (
                              <div className="flex justify-between">
                                <span className="text-default-500">Marca:</span>
                                <span>{produto.marca}</span>
                              </div>
                            )}
                            {produto.modelo && (
                              <div className="flex justify-between">
                                <span className="text-default-500">Modelo:</span>
                                <span>{produto.modelo}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {loja && (
                              <div className="flex justify-between">
                                <span className="text-default-500">Loja:</span>
                                <span>{loja.nome}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-default-500">Quantidade:</span>
                              <span className="font-medium text-primary">
                                {formData.quantidade || 1}
                              </span>
                            </div>
                            {formData.tipo_rma && (
                              <div className="flex justify-between">
                                <span className="text-default-500">Tipo:</span>
                                <span className="font-medium">{formData.tipo_rma}</span>
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
                onPress={handleSave}
                className="font-medium px-6"
                isDisabled={!formData.produto_id || !formData.loja_id || saving}
                isLoading={saving}
              >
                {saving 
                  ? (isEditing ? "Atualizando..." : "Salvando...") 
                  : (isEditing ? "💾 Atualizar" : " Salvar")
                }
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
              <div className="p-2 bg-danger-100 rounded-full">
                🗑️
              </div>
              <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
                <p className="text-lg font-semibold text-danger-800 mb-2">
                  Tem certeza que deseja excluir este RMA?
                </p>
                <p className="text-danger-600">
                  <strong>Produto:</strong> {deleteModal.itemName}
                </p>
              </div>
              
              <div className="bg-warning-50 rounded-lg p-4 border border-warning-200">
                <div className="flex items-start gap-2">
                  <span className="text-warning-600 text-xl">⚠️</span>
                  <div className="text-left">
                    <p className="font-semibold text-warning-800 mb-1">
                      Atenção!
                    </p>
                    <p className="text-sm text-warning-700">
                      Esta ação não pode ser desfeita. O RMA será permanentemente removido do sistema.
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