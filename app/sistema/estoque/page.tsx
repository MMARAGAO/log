"use client";

import { useEffect, useState } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { useAuthStore } from "@/store/authZustand";
import {
  currencyMask,
  currencyToNumber,
  numberToCurrencyInput,
} from "@/utils/maskInput";
import {
  Card,
  CardBody,
  Input,
  Button,
  Avatar,
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
  Image,
  Pagination,
  PaginationItem,
  PaginationCursor,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CubeIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";

interface EstoqueItem {
  id: number;
  descricao: string;
  modelo?: string;
  marca?: string;
  compativel?: string;
  minimo?: number;
  preco_compra?: number;
  preco_venda?: number;
  quantidade?: number;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  observacoes?: string;
}

interface FilterState {
  orderBy: string;
  orderDirection: "asc" | "desc";
  minQuantidade: string;
  maxQuantidade: string;
  minPrecoCompra: string;
  maxPrecoCompra: string;
  minPrecoVenda: string;
  maxPrecoVenda: string;
  marca: string;
  estoqueBaixo: boolean;
  semFoto: boolean;
}

const ITEMS_PER_PAGE = 12;

// Opções de ordenação
const ORDER_OPTIONS = [
  { key: "descricao", label: "Descrição" },
  { key: "marca", label: "Marca" },
  { key: "modelo", label: "Modelo" },
  { key: "quantidade", label: "Quantidade" },
  { key: "preco_compra", label: "Preço de Compra" },
  { key: "preco_venda", label: "Preço de Venda" },
  { key: "lucro", label: "Lucro Unitário" },
  { key: "createdat", label: "Data de Criação" },
  { key: "updatedat", label: "Última Atualização" },
];

// Componente do Carrossel de Fotos para o Card
function PhotoCarousel({
  photos,
  itemName,
  className,
}: {
  photos: string[];
  itemName: string;
  className?: string;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Reset quando as fotos mudarem
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [photos]);

  if (!photos || photos.length === 0) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
      >
        <CubeIcon className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Imagem principal */}
      <img
        src={photos[currentPhotoIndex]}
        alt={`${itemName} - Foto ${currentPhotoIndex + 1}`}
        className="object-contain w-full h-full rounded-xl transition-opacity duration-300"
        onError={(e) => {
          // Fallback se a imagem não carregar
          e.currentTarget.style.display = "none";
        }}
      />

      {photos.length > 1 && (
        <>
          {/* Botão anterior */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
            onPress={prevPhoto}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>

          {/* Botão próximo */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
            onPress={nextPhoto}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>

          {/* Indicadores/dots */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPhoto(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  index === currentPhotoIndex
                    ? "bg-white scale-110"
                    : "bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          {/* Contador de fotos */}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10">
            {currentPhotoIndex + 1}/{photos.length}
          </div>

          {/* Ícone de múltiplas fotos */}
          <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
            <PhotoIcon className="w-3 h-3" />
            {photos.length}
          </div>
        </>
      )}

      {/* Overlay de hover para indicar que é clicável */}
      {photos.length > 1 && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 cursor-pointer" />
      )}
    </div>
  );
}

// Componente do Carrossel de Fotos para o Modal (menor e com botão de remoção)
function ModalPhotoCarousel({
  photos,
  onRemove,
  title,
}: {
  photos: string[];
  onRemove: (index: number) => void;
  title: string;
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Reset quando as fotos mudarem
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [photos]);

  if (!photos || photos.length === 0) {
    return null;
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const handleRemovePhoto = () => {
    onRemove(currentPhotoIndex);
    // Ajustar índice se necessário
    if (currentPhotoIndex >= photos.length - 1 && photos.length > 1) {
      setCurrentPhotoIndex(photos.length - 2);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{title}</label>

      {/* Carrossel principal */}
      <div className="relative overflow-hidden w-full h-48 bg-gray-100 rounded-lg mb-3">
        <img
          src={photos[currentPhotoIndex]}
          alt={`${title} ${currentPhotoIndex + 1}`}
          className="object-contain w-full h-full"
        />

        {/* Botão de remover foto */}
        <Button
          isIconOnly
          size="sm"
          color="danger"
          variant="solid"
          className="absolute top-2 right-2 z-20"
          onPress={handleRemovePhoto}
        >
          <XMarkIcon className="w-3 h-3" />
        </Button>

        {photos.length > 1 && (
          <>
            {/* Botão anterior */}
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
              onPress={prevPhoto}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>

            {/* Botão próximo */}
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
              onPress={nextPhoto}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>

            {/* Contador de fotos */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10">
              {currentPhotoIndex + 1}/{photos.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                index === currentPhotoIndex
                  ? "border-primary-500 scale-105"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <img
                src={photo}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover rounded"
              />
              {/* Indicador de foto ativa */}
              {index === currentPhotoIndex && (
                <div className="absolute inset-0 bg-primary-500/20 rounded" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  const [formData, setFormData] = useState<Partial<EstoqueItem>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Estado dos filtros
  const [filters, setFilters] = useState<FilterState>({
    orderBy: "descricao",
    orderDirection: "asc",
    minQuantidade: "",
    maxQuantidade: "",
    minPrecoCompra: "",
    maxPrecoCompra: "",
    minPrecoVenda: "",
    maxPrecoVenda: "",
    marca: "",
    estoqueBaixo: false,
    semFoto: false,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permEstoque = acessos?.estoque;
  const canViewEstoque = !!permEstoque?.ver_estoque;
  const canCreateEstoque = !!permEstoque?.criar_estoque;
  const canEditEstoque = !!permEstoque?.editar_estoque;
  const canDeleteEstoque = !!permEstoque?.deletar_estoque;

  // Carregar estoque
  async function loadEstoque() {
    setLoading(true);
    try {
      const data = await fetchTable("estoque");
      setEstoque(data || []);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEstoque();
  }, []);

  // Obter marcas únicas para o filtro
  const uniqueBrands = Array.from(
    new Set(estoque.map((item) => item.marca).filter(Boolean))
  ).sort();

  // Função para calcular lucro
  function calculateProfit(item: EstoqueItem): number {
    const compra = item.preco_compra || 0;
    const venda = item.preco_venda || 0;
    return venda - compra;
  }

  // Verificar estoque baixo
  function isLowStock(item: EstoqueItem): boolean {
    return (item.quantidade || 0) <= (item.minimo || 0);
  }

  // Aplicar filtros e ordenação
  const filteredAndSortedEstoque = estoque
    .filter((item) => {
      // Filtro de busca por texto
      const searchMatch =
        !searchTerm ||
        item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.compativel?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de quantidade
      const quantidadeMatch =
        (!filters.minQuantidade ||
          (item.quantidade || 0) >= Number(filters.minQuantidade)) &&
        (!filters.maxQuantidade ||
          (item.quantidade || 0) <= Number(filters.maxQuantidade));

      // Filtro de preço de compra
      const precoCompraMatch =
        (!filters.minPrecoCompra ||
          (item.preco_compra || 0) >=
            currencyToNumber(filters.minPrecoCompra)) &&
        (!filters.maxPrecoCompra ||
          (item.preco_compra || 0) <= currencyToNumber(filters.maxPrecoCompra));

      // Filtro de preço de venda
      const precoVendaMatch =
        (!filters.minPrecoVenda ||
          (item.preco_venda || 0) >= currencyToNumber(filters.minPrecoVenda)) &&
        (!filters.maxPrecoVenda ||
          (item.preco_venda || 0) <= currencyToNumber(filters.maxPrecoVenda));

      // Filtro de marca
      const marcaMatch = !filters.marca || item.marca === filters.marca;

      // Filtro de estoque baixo
      const estoqueBaixoMatch = !filters.estoqueBaixo || isLowStock(item);

      // Filtro de sem foto
      const semFotoMatch =
        !filters.semFoto || !item.fotourl || item.fotourl.length === 0;

      return (
        searchMatch &&
        quantidadeMatch &&
        precoCompraMatch &&
        precoVendaMatch &&
        marcaMatch &&
        estoqueBaixoMatch &&
        semFotoMatch
      );
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.orderBy) {
        case "descricao":
          aValue = a.descricao?.toLowerCase() || "";
          bValue = b.descricao?.toLowerCase() || "";
          break;
        case "marca":
          aValue = a.marca?.toLowerCase() || "";
          bValue = b.marca?.toLowerCase() || "";
          break;
        case "modelo":
          aValue = a.modelo?.toLowerCase() || "";
          bValue = b.modelo?.toLowerCase() || "";
          break;
        case "quantidade":
          aValue = a.quantidade || 0;
          bValue = b.quantidade || 0;
          break;
        case "preco_compra":
          aValue = a.preco_compra || 0;
          bValue = b.preco_compra || 0;
          break;
        case "preco_venda":
          aValue = a.preco_venda || 0;
          bValue = b.preco_venda || 0;
          break;
        case "lucro":
          aValue = calculateProfit(a);
          bValue = calculateProfit(b);
          break;
        case "createdat":
          aValue = new Date(a.createdat || 0);
          bValue = new Date(b.createdat || 0);
          break;
        case "updatedat":
          aValue = new Date(a.updatedat || 0);
          bValue = new Date(b.updatedat || 0);
          break;
        default:
          aValue = a.descricao?.toLowerCase() || "";
          bValue = b.descricao?.toLowerCase() || "";
      }

      if (filters.orderDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Calcular paginação
  const totalPages = Math.ceil(
    filteredAndSortedEstoque.length / ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredAndSortedEstoque.slice(startIndex, endIndex);

  // Reset página quando buscar ou filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Calcular estatísticas
  const totalQuantidade = estoque.reduce(
    (acc, item) => acc + (item.quantidade || 0),
    0
  );
  const totalPrecoVenda = estoque.reduce(
    (acc, item) => acc + (item.preco_venda || 0) * (item.quantidade || 0),
    0
  );
  const totalPrecoCompra = estoque.reduce(
    (acc, item) => acc + (item.preco_compra || 0) * (item.quantidade || 0),
    0
  );
  const totalLucro = totalPrecoVenda - totalPrecoCompra;

  // Limpar filtros
  function clearFilters() {
    setFilters({
      orderBy: "descricao",
      orderDirection: "asc",
      minQuantidade: "",
      maxQuantidade: "",
      minPrecoCompra: "",
      maxPrecoCompra: "",
      minPrecoVenda: "",
      maxPrecoVenda: "",
      marca: "",
      estoqueBaixo: false,
      semFoto: false,
    });
    setSearchTerm("");
  }

  // Limpar formulário
  function clearForm() {
    setFormData({});
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCurrentPhotos([]);
    setSelectedItem(null);
    setIsEditing(false);
  }

  // Adicionar novo item
  function handleAdd() {
    clearForm();
    onOpen();
  }

  // Editar item
  function handleEdit(item: EstoqueItem) {
    setSelectedItem(item);
    setFormData({
      ...item,
      preco_compra: item.preco_compra || 0,
      preco_venda: item.preco_venda || 0,
      quantidade: item.quantidade || 0,
      minimo: item.minimo || 0,
    });
    setCurrentPhotos(item.fotourl || []);
    setIsEditing(true);
    onOpen();
  }

  // Gerenciar seleção de arquivos
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    // Gerar previews
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  }

  // Remover foto atual
  function removeCurrentPhoto(index: number) {
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    setCurrentPhotos(newPhotos);
  }

  // Remover foto preview
  function removePreviewPhoto(index: number) {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  }

  // Handlers com verificação de permissão
  function safeHandleAdd() {
    if (!canCreateEstoque) {
      alert("Você não possui permissão para criar itens no estoque.");
      return;
    }
    handleAdd();
  }

  function safeHandleEdit(item: EstoqueItem) {
    if (!canEditEstoque) {
      alert("Você não possui permissão para editar itens do estoque.");
      return;
    }
    handleEdit(item);
  }

  async function safeHandleDelete(id: number) {
    if (!canDeleteEstoque) {
      alert("Você não possui permissão para deletar itens do estoque.");
      return;
    }
    await handleDelete(id);
  }

  // Salvar item com verificação de permissão
  async function handleSave() {
    if (!formData.descricao) {
      alert("Descrição é obrigatória!");
      return;
    }

    // Verificação de permissão
    if (isEditing && !canEditEstoque) {
      alert("Você não possui permissão para editar itens do estoque.");
      return;
    }
    if (!isEditing && !canCreateEstoque) {
      alert("Você não possui permissão para criar itens no estoque.");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        preco_compra: formData.preco_compra || 0,
        preco_venda: formData.preco_venda || 0,
        quantidade: formData.quantidade || 0,
        minimo: formData.minimo || 0,
      };

      if (isEditing && selectedItem) {
        // Atualizar item existente
        if (selectedFiles.length > 0) {
          // Adicionar novas fotos uma por uma
          let currentFotoArray = [...currentPhotos];

          for (let i = 0; i < selectedFiles.length; i++) {
            await updateTable(
              "estoque",
              selectedItem.id,
              i === 0 ? dataToSave : {}, // Atualizar dados apenas na primeira chamada
              selectedFiles[i],
              currentFotoArray
            );

            // Buscar o item atualizado para pegar o array correto
            const updatedItems = await fetchTable("estoque");
            const updatedItem = updatedItems.find(
              (item) => item.id === selectedItem.id
            );
            if (updatedItem?.fotourl) {
              currentFotoArray = updatedItem.fotourl;
            }
          }
        } else {
          // Apenas atualizar dados sem adicionar fotos
          await updateTable(
            "estoque",
            selectedItem.id,
            dataToSave,
            undefined,
            currentPhotos
          );
        }
      } else {
        // Criar novo item
        if (selectedFiles.length === 0) {
          // Criar item sem fotos
          await insertTable("estoque", dataToSave);
        } else {
          // Criar item com fotos (múltiplas ou única)
          console.log(`Criando item com ${selectedFiles.length} foto(s)`);

          // Inserir item com a primeira foto
          await insertTable("estoque", dataToSave, selectedFiles[0]);

          if (selectedFiles.length > 1) {
            // Aguardar para garantir que o item foi criado
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Buscar o item recém-criado
            const allItems = await fetchTable("estoque");
            const newItem = allItems
              .filter(
                (item) =>
                  item.descricao === dataToSave.descricao &&
                  item.marca === dataToSave.marca &&
                  item.modelo === dataToSave.modelo
              )
              .sort(
                (a, b) =>
                  new Date(b.createdat || "").getTime() -
                  new Date(a.createdat || "").getTime()
              )[0];

            if (newItem) {
              console.log(
                `Item criado com ID: ${newItem.id}, fotos atuais:`,
                newItem.fotourl
              );

              // Adicionar fotos restantes uma por uma
              for (let i = 1; i < selectedFiles.length; i++) {
                console.log(
                  `Adicionando foto ${i + 1} de ${selectedFiles.length}`
                );

                // Buscar o estado atual do item antes de cada upload
                const currentItems = await fetchTable("estoque");
                const currentItem = currentItems.find(
                  (item) => item.id === newItem.id
                );
                const currentFotoArray = currentItem?.fotourl || [];

                console.log(
                  `Fotos atuais antes do upload ${i + 1}:`,
                  currentFotoArray
                );

                await updateTable(
                  "estoque",
                  newItem.id,
                  {}, // Não atualizar outros dados
                  selectedFiles[i],
                  currentFotoArray
                );

                // Aguardar entre uploads
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            } else {
              console.error("Não foi possível encontrar o item recém-criado");
            }
          }
        }
      }

      // Recarregar dados apenas uma vez no final
      await loadEstoque();
      onClose();
      clearForm();
    } catch (error) {
      console.error("Erro completo ao salvar item:", error);
    } finally {
      setLoading(false);
    }
  }

  // Deletar item
  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    setLoading(true);
    try {
      await deleteTable("estoque", id);
      await loadEstoque();
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      alert("Erro ao deletar item!");
    } finally {
      setLoading(false);
    }
  }

  // Verificação de loading
  if (loading && !isOpen) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando estoque..." />
      </div>
    );
  }

  // Bloqueio de visualização
  if (!canViewEstoque) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        </div>

        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar o estoque.
            </p>
            <p className="text-default-500 text-xs">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        {canCreateEstoque && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={safeHandleAdd}
          >
            Novo Item
          </Button>
        )}
      </div>

      {/* Cards de Estatísticas - sempre visível se pode ver estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <CubeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total de Itens</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalQuantidade.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                <ShoppingCartIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Valor de Compra</p>
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalPrecoCompra)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Valor de Venda</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalPrecoVenda)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Lucro Potencial</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalLucro)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Busca e Filtros */}
      <div className="mb-6 space-y-4">
        {/* Linha de busca e controles */}
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Buscar por descrição, modelo, marca ou compatibilidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
            className="flex-1"
          />

          <Button
            variant={showFilters ? "solid" : "flat"}
            color={showFilters ? "primary" : "default"}
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>

          {(searchTerm ||
            Object.values(filters).some(
              (v) => v !== "" && v !== "descricao" && v !== "asc" && v !== false
            )) && (
            <Button variant="flat" color="warning" onPress={clearFilters}>
              Limpar
            </Button>
          )}
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <Card>
            <CardBody className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Ordenação */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <div className="flex gap-2">
                    <Select
                      selectedKeys={[filters.orderBy]}
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0] as string;
                        setFilters((prev) => ({ ...prev, orderBy: key }));
                      }}
                      className="flex-1"
                      size="sm"
                    >
                      {ORDER_OPTIONS.map((option) => (
                        <SelectItem key={option.key}>{option.label}</SelectItem>
                      ))}
                    </Select>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          orderDirection:
                            prev.orderDirection === "asc" ? "desc" : "asc",
                        }));
                      }}
                    >
                      {filters.orderDirection === "asc" ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade</label>
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      type="number"
                      placeholder="Min"
                      value={filters.minQuantidade}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          minQuantidade: e.target.value,
                        }))
                      }
                    />
                    <Input
                      size="sm"
                      type="number"
                      placeholder="Max"
                      value={filters.maxQuantidade}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          maxQuantidade: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Preço de Compra */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço de Compra</label>
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      placeholder="Min"
                      value={filters.minPrecoCompra}
                      onChange={(e) => {
                        const masked = currencyMask(e.target.value);
                        setFilters((prev) => ({
                          ...prev,
                          minPrecoCompra: masked,
                        }));
                      }}
                    />
                    <Input
                      size="sm"
                      placeholder="Max"
                      value={filters.maxPrecoCompra}
                      onChange={(e) => {
                        const masked = currencyMask(e.target.value);
                        setFilters((prev) => ({
                          ...prev,
                          maxPrecoCompra: masked,
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Preço de Venda */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço de Venda</label>
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      placeholder="Min"
                      value={filters.minPrecoVenda}
                      onChange={(e) => {
                        const masked = currencyMask(e.target.value);
                        setFilters((prev) => ({
                          ...prev,
                          minPrecoVenda: masked,
                        }));
                      }}
                    />
                    <Input
                      size="sm"
                      placeholder="Max"
                      value={filters.maxPrecoVenda}
                      onChange={(e) => {
                        const masked = currencyMask(e.target.value);
                        setFilters((prev) => ({
                          ...prev,
                          maxPrecoVenda: masked,
                        }));
                      }}
                    />
                  </div>
                </div>

                {/* Marca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marca</label>
                  <Select
                    selectedKeys={filters.marca ? [filters.marca] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFilters((prev) => ({ ...prev, marca: key || "" }));
                    }}
                    size="sm"
                    placeholder="Todas as marcas"
                  >
                    {uniqueBrands.map((brand) => (
                      <SelectItem key={brand}>{brand}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Filtros especiais */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Filtros especiais
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.estoqueBaixo}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            estoqueBaixo: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Estoque baixo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.semFoto}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            semFoto: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">Sem foto</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Informações da paginação */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-default-500">
          Mostrando {startIndex + 1} a{" "}
          {Math.min(endIndex, filteredAndSortedEstoque.length)} de{" "}
          {filteredAndSortedEstoque.length} itens
          {(searchTerm ||
            Object.values(filters).some(
              (v) => v !== "" && v !== "descricao" && v !== "asc" && v !== false
            )) &&
            ` (filtrado de ${estoque.length} total)`}
        </p>

        {/* Paginação Superior */}
        {totalPages > 1 && (
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            size="sm"
            classNames={{
              wrapper: "gap-0 overflow-visible h-8",
              item: "w-8 h-8 text-small rounded-none",
              cursor: "bg-primary-500 text-white font-bold",
            }}
          />
        )}
      </div>

      {loading && !isOpen ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => (
              <Card key={item.id} className="w-full">
                <CardBody>
                  {/* Carrossel de Fotos */}
                  <PhotoCarousel
                    photos={item.fotourl || []}
                    itemName={item.descricao}
                    className="w-full bg-gray-200 h-56 rounded-xl"
                  />

                  <div className="flex items-center justify-between mb-3 mt-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {item.descricao}
                        </h3>
                        <p className="text-small text-default-500">
                          {item.marca} {item.modelo && `- ${item.modelo}`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={isLowStock(item) ? "danger" : "success"}
                          >
                            Qtd: {item.quantidade || 0}
                          </Chip>
                          {isLowStock(item) && (
                            <Chip size="sm" color="danger" variant="flat">
                              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                              Estoque Baixo
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>

                    {(canEditEstoque || canDeleteEstoque) && (
                      <div className="flex gap-2">
                        {canEditEstoque && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={() => safeHandleEdit(item)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteEstoque && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => safeHandleDelete(item.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <Divider className="my-3" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-default-500">Compatível</p>
                      <p className="font-medium">{item.compativel || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-default-500">Preço Compra</p>
                      <p className="font-medium text-red-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.preco_compra || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-default-500">Preço Venda</p>
                      <p className="font-medium text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.preco_venda || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-default-500">Lucro Unitário</p>
                      <p className="font-medium text-blue-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(calculateProfit(item))}
                      </p>
                    </div>
                  </div>

                  {item.observacoes && (
                    <div className="mt-3 p-3 bg-default-100 rounded-lg">
                      <p className="text-sm">{item.observacoes}</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}

            {filteredAndSortedEstoque.length === 0 && !loading && (
              <div className="text-center py-8 text-default-500 col-span-full">
                {(searchTerm ||
                  Object.values(filters).some(
                    (v) =>
                      v !== "" &&
                      v !== "descricao" &&
                      v !== "asc" &&
                      v !== false
                  )) &&
                  "Nenhum item encontrado com os filtros aplicados"}
                {!(
                  searchTerm ||
                  Object.values(filters).some(
                    (v) =>
                      v !== "" &&
                      v !== "descricao" &&
                      v !== "asc" &&
                      v !== false
                  )
                ) && "Nenhum item no estoque"}
              </div>
            )}
          </div>

          {/* Paginação Inferior */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                classNames={{
                  wrapper: "gap-0 overflow-visible h-10",
                  item: "w-10 h-10 text-small rounded-none bg-transparent",
                  cursor: "bg-primary-500 text-white font-bold",
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Modal - só abre se tiver permissão */}
      {(canCreateEstoque || canEditEstoque) && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="3xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>{isEditing ? "Editar Item" : "Novo Item"}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Descrição */}
                <Input
                  label="Descrição *"
                  placeholder="Digite a descrição do item"
                  value={formData.descricao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  isRequired
                />

                {/* Modelo e Marca */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Modelo"
                    placeholder="Ex: iPhone 13"
                    value={formData.modelo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                  />
                  <Input
                    label="Marca"
                    placeholder="Ex: Apple"
                    value={formData.marca || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                  />
                </div>

                {/* Compatibilidade */}
                <Input
                  label="Compatível com"
                  placeholder="Ex: iPhone 13, 13 Pro, 14"
                  value={formData.compativel || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, compativel: e.target.value })
                  }
                />

                {/* Quantidade e Mínimo */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantidade"
                    type="number"
                    placeholder="0"
                    value={formData.quantidade?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantidade: Number(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="Estoque Mínimo"
                    type="number"
                    placeholder="0"
                    value={formData.minimo?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimo: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Preço de Compra"
                    placeholder="R$ 0,00"
                    value={numberToCurrencyInput(formData.preco_compra || 0)}
                    onChange={(e) => {
                      const masked = currencyMask(e.target.value);
                      setFormData({
                        ...formData,
                        preco_compra: currencyToNumber(masked),
                      });
                    }}
                  />
                  <Input
                    label="Preço de Venda"
                    placeholder="R$ 0,00"
                    value={numberToCurrencyInput(formData.preco_venda || 0)}
                    onChange={(e) => {
                      const masked = currencyMask(e.target.value);
                      setFormData({
                        ...formData,
                        preco_venda: currencyToNumber(masked),
                      });
                    }}
                  />
                </div>

                {/* Observações */}
                <Textarea
                  label="Observações"
                  placeholder="Informações adicionais sobre o item..."
                  value={formData.observacoes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                />

                {/* Upload de Fotos */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adicionar Fotos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Carrossel de Fotos Atuais */}
                {currentPhotos.length > 0 && (
                  <ModalPhotoCarousel
                    photos={currentPhotos}
                    onRemove={removeCurrentPhoto}
                    title="Fotos Atuais"
                  />
                )}

                {/* Carrossel de Novas Fotos */}
                {previewUrls.length > 0 && (
                  <ModalPhotoCarousel
                    photos={previewUrls}
                    onRemove={removePreviewPhoto}
                    title="Novas Fotos"
                  />
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button color="primary" onPress={handleSave} isLoading={loading}>
                {isEditing ? "Atualizar" : "Salvar"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
