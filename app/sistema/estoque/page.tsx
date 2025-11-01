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
import { EstoqueStats, EstoqueCard } from "@/components/estoque";
import * as XLSX from "xlsx";
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
  Squares2X2Icon,
  ListBulletIcon,
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
  quantidade?: number; // Esta será removida da tabela estoque
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  observacoes?: string;
  // Novos campos para trabalhar com estoque por loja
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

// Vamos simplificar a interface para evitar confusões
interface FormDataEstoque {
  id?: number;
  descricao?: string;
  modelo?: string;
  marca?: string;
  compativel?: string;
  minimo?: number;
  preco_compra?: number;
  preco_venda?: number;
  quantidade?: number; // Adicionar esta propriedade
  observacoes?: string;
  createdat?: string;
  updatedat?: string;
  fotourl?: string[];
  [key: `quantidade_loja_${number}`]: number;
}

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [selectedLoja, setSelectedLoja] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);
  const [formData, setFormData] = useState<FormDataEstoque>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  // Carregar lojas
  async function loadLojas() {
    try {
      const data = await fetchTable("lojas");
      setLojas(data || []);
      // if (data && data.length > 0 && !selectedLoja) {
      //   setSelectedLoja(data[0].id);
      // }
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    }
  }

  // Carregar estoque com quantidades por loja
  // Carregar estoque com quantidades por loja
  async function loadEstoque() {
    setLoading(true);
    try {
      console.log("🔄 Iniciando carregamento do estoque...");
      const data = await fetchTable("estoque");
      console.log("📦 Produtos carregados:", data?.length || 0);

      if (data && data.length > 0) {
        console.log("🔄 Carregando estoque por lojas...");

        // Buscar todos os registros de estoque_lojas de uma vez
        const todosEstoqueLojas = await fetchTable("estoque_lojas");
        console.log(
          "🏪 Registros de estoque por loja:",
          todosEstoqueLojas?.length || 0
        );

        // Para cada produto, filtrar as quantidades de cada loja
        const produtosComEstoque = data.map((produto, index) => {
          try {
            // Filtrar estoque de todas as lojas para este produto
            const estoqueLojas =
              todosEstoqueLojas?.filter(
                (item) => item.produto_id === produto.id
              ) || [];

            // Calcular quantidade total
            const quantidadeTotal = estoqueLojas.reduce((total, item) => {
              const qty = Number(item.quantidade) || 0;
              return total + qty;
            }, 0);

            if (index < 3) {
              // Log apenas dos primeiros 3 produtos para debug
              console.log(`📋 Produto ${produto.id} (${produto.descricao}):`, {
                estoqueLojas: estoqueLojas.length,
                quantidadeTotal,
              });
            }

            return {
              ...produto,
              estoque_lojas: estoqueLojas,
              quantidade_total: quantidadeTotal,
            };
          } catch (error) {
            console.error(
              `❌ Erro ao processar estoque do produto ${produto.id}:`,
              error
            );
            return {
              ...produto,
              estoque_lojas: [],
              quantidade_total: 0,
            };
          }
        });

        console.log("✅ Estoque processado com sucesso!");
        setEstoque(produtosComEstoque);
      } else {
        console.log("📭 Nenhum produto encontrado");
        setEstoque([]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar estoque:", error);
      setEstoque([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLojas();
  }, []);

  useEffect(() => {
    if (lojas.length > 0) {
      loadEstoque();
    }
  }, [lojas]);

  // Obter marcas únicas para o filtro
  const uniqueBrands = Array.from(
    new Set(estoque.map((item) => item.marca).filter(Boolean))
  ).sort();

  // Normalização de texto para busca (case/acentos/pontuação)
  function normalizeText(text?: string): string {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-z0-9]+/g, " ") // mantém letras/números e espaços
      .trim();
  }

  // Função para calcular lucro
  function calculateProfit(item: EstoqueItem): number {
    const compra = item.preco_compra || 0;
    const venda = item.preco_venda || 0;
    return venda - compra;
  }

  // Função para obter quantidade de uma loja específica
  function getQuantidadeLoja(item: EstoqueItem, lojaId: number): number {
    if (!item.estoque_lojas || !Array.isArray(item.estoque_lojas)) {
      return 0;
    }

    const estoqueLoja = item.estoque_lojas.find((el) => el.loja_id === lojaId);
    return Number(estoqueLoja?.quantidade) || 0;
  }

  // Função para verificar estoque baixo considerando loja específica
  function isLowStock(item: EstoqueItem, lojaId?: number): boolean {
    if (lojaId) {
      return getQuantidadeLoja(item, lojaId) <= (item.minimo || 0);
    }
    return (item.quantidade_total || 0) <= (item.minimo || 0);
  }

  // Calcular estatísticas considerando loja selecionada
  const totalQuantidade = selectedLoja
    ? estoque.reduce(
        (acc, item) => acc + getQuantidadeLoja(item, selectedLoja),
        0
      )
    : estoque.reduce((acc, item) => acc + (item.quantidade_total || 0), 0);

  const totalPrecoVenda = selectedLoja
    ? estoque.reduce((acc, item) => {
        const qty = getQuantidadeLoja(item, selectedLoja);
        return acc + (item.preco_venda || 0) * qty;
      }, 0)
    : estoque.reduce((acc, item) => {
        const qty = item.quantidade_total || 0;
        return acc + (item.preco_venda || 0) * qty;
      }, 0);

  const totalPrecoCompra = selectedLoja
    ? estoque.reduce((acc, item) => {
        const qty = getQuantidadeLoja(item, selectedLoja);
        return acc + (item.preco_compra || 0) * qty;
      }, 0)
    : estoque.reduce((acc, item) => {
        const qty = item.quantidade_total || 0;
        return acc + (item.preco_compra || 0) * qty;
      }, 0);

  // Calcular lucro potencial total
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
    setFormData({} as FormDataEstoque);
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

    // Criar formData com as quantidades atuais de cada loja
    const formDataWithQuantidades: FormDataEstoque = {
      ...item,
      preco_compra: item.preco_compra || 0,
      preco_venda: item.preco_venda || 0,
      quantidade: item.quantidade || 0,
      minimo: item.minimo || 0,
    };

    // Adicionar quantidades por loja ao formData
    lojas.forEach((loja) => {
      const quantidade = getQuantidadeLoja(item, loja.id);
      formDataWithQuantidades[`quantidade_loja_${loja.id}`] = quantidade;
    });

    setFormData(formDataWithQuantidades);
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
  // Atualizar a função handleSave para trabalhar com estoque por loja
  async function handleSave() {
    if (!formData.descricao) {
      alert("Descrição é obrigatória!");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Iniciando salvamento...");
      console.log("📋 FormData original:", formData);

      let produtoId: number;

      if (isEditing && selectedItem) {
        console.log("✏️ Editando produto ID:", selectedItem.id);

        // Criar objeto apenas com campos válidos da tabela estoque
        const validEstoqueFields = {
          descricao: formData.descricao,
          modelo: formData.modelo || null,
          marca: formData.marca || null,
          compativel: formData.compativel || null,
          minimo: formData.minimo || 0,
          preco_compra: formData.preco_compra || 0,
          preco_venda: formData.preco_venda || 0,
          observacoes: formData.observacoes || null,
          updatedat: new Date().toISOString(),
        };

        // Remover campos undefined/null para evitar problemas
        const cleanedData = Object.fromEntries(
          Object.entries(validEstoqueFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        console.log("🧹 Dados limpos para atualizar produto:", cleanedData);

        // Atualizar produto existente
        try {
          const updateResult = await updateTable(
            "estoque",
            selectedItem.id,
            cleanedData
          );
          console.log("✅ Produto atualizado:", updateResult);
        } catch (updateError) {
          console.error("❌ Erro ao atualizar produto:", updateError);
          console.error("❌ Dados que causaram o erro:", cleanedData);
          throw new Error(
            `Erro ao atualizar produto: ${getErrorMessage(updateError)}`
          );
        }

        produtoId = selectedItem.id;

        // Atualizar quantidades por loja
        console.log("🏪 Atualizando estoque por loja...");
        for (const loja of lojas) {
          try {
            const quantidadeAtual = formData[`quantidade_loja_${loja.id}`];
            console.log(
              `📦 Loja ${loja.nome} (${loja.id}): quantidade = ${quantidadeAtual}`
            );

            if (quantidadeAtual !== undefined) {
              await updateEstoqueLoja(produtoId, loja.id, quantidadeAtual);
              console.log(`✅ Estoque atualizado para loja ${loja.nome}`);
            }
          } catch (estoqueError) {
            console.error(
              `❌ Erro ao atualizar estoque para loja ${loja.nome}:`,
              estoqueError
            );
            // Não parar o processo se uma loja falhar
          }
        }

        // Processar fotos se houver
        if (selectedFiles.length > 0) {
          console.log("📸 Processando fotos...");
          let currentFotoArray = [...currentPhotos];
          for (let i = 0; i < selectedFiles.length; i++) {
            try {
              console.log(
                `📸 Adicionando foto ${i + 1}/${selectedFiles.length}`
              );
              await updateTable(
                "estoque",
                selectedItem.id,
                {}, // Objeto vazio para não interferir com outros campos
                selectedFiles[i],
                currentFotoArray
              );

              const updatedItems = await fetchTable("estoque");
              const updatedItem = updatedItems?.find(
                (item) => item.id === selectedItem.id
              );
              if (updatedItem?.fotourl) {
                currentFotoArray = updatedItem.fotourl;
              }
            } catch (photoError) {
              console.error(`❌ Erro ao adicionar foto ${i + 1}:`, photoError);
              // Continuar mesmo se uma foto falhar
            }
          }
        } else if (
          currentPhotos.length !== (selectedItem.fotourl?.length || 0)
        ) {
          console.log("📸 Atualizando fotos existentes...");
          // Atualizar apenas se as fotos mudaram
          try {
            await updateTable(
              "estoque",
              selectedItem.id,
              {},
              undefined,
              currentPhotos
            );
          } catch (photoError) {
            console.error("❌ Erro ao atualizar fotos:", photoError);
          }
        }
      } else {
        console.log("➕ Criando novo produto...");

        // Criar objeto apenas com campos válidos da tabela estoque
        const validEstoqueFields = {
          descricao: formData.descricao,
          modelo: formData.modelo || null,
          marca: formData.marca || null,
          compativel: formData.compativel || null,
          minimo: formData.minimo || 0,
          preco_compra: formData.preco_compra || 0,
          preco_venda: formData.preco_venda || 0,
          observacoes: formData.observacoes || null,
        };

        // Remover campos undefined/null
        const cleanedData = Object.fromEntries(
          Object.entries(validEstoqueFields).filter(
            ([key, value]) => value !== undefined
          )
        );

        console.log("🧹 Dados limpos para criar produto:", cleanedData);

        // Criar novo produto
        let result;
        try {
          if (selectedFiles.length > 0) {
            console.log("📸 Criando com foto inicial...");
            result = await insertTable(
              "estoque",
              cleanedData,
              selectedFiles[0]
            );
          } else {
            console.log("📝 Criando sem foto...");
            result = await insertTable("estoque", cleanedData);
          }
          console.log("✅ Produto criado:", result);
        } catch (insertError) {
          console.error("❌ Erro ao inserir produto:", insertError);
          throw new Error(
            `Erro ao criar produto: ${getErrorMessage(insertError)}`
          );
        }

        // Buscar o produto recém-criado
        console.log("🔍 Buscando produto recém-criado...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const allItems = await fetchTable("estoque");
        const newItem = allItems
          ?.filter(
            (item) =>
              item.descricao === cleanedData.descricao &&
              item.marca === cleanedData.marca &&
              item.modelo === cleanedData.modelo
          )
          .sort(
            (a, b) =>
              new Date(b.createdat || "").getTime() -
              new Date(a.createdat || "").getTime()
          )[0];

        if (newItem) {
          produtoId = newItem.id;
          console.log("✅ Produto encontrado, ID:", produtoId);

          // Adicionar fotos restantes se houver
          if (selectedFiles.length > 1) {
            console.log("📸 Adicionando fotos restantes...");
            for (let i = 1; i < selectedFiles.length; i++) {
              try {
                const currentItems = await fetchTable("estoque");
                const currentItem = currentItems?.find(
                  (item) => item.id === newItem.id
                );
                const currentFotoArray = currentItem?.fotourl || [];

                console.log(
                  `📸 Adicionando foto ${i + 1}/${selectedFiles.length}`
                );
                await updateTable(
                  "estoque",
                  newItem.id,
                  {},
                  selectedFiles[i],
                  currentFotoArray
                );
                await new Promise((resolve) => setTimeout(resolve, 500));
              } catch (photoError) {
                console.error(
                  `❌ Erro ao adicionar foto ${i + 1}:`,
                  photoError
                );
              }
            }
          }

          // Criar registros de estoque por loja
          console.log("🏪 Criando estoque por loja...");
          for (const loja of lojas) {
            try {
              const quantidade = formData[`quantidade_loja_${loja.id}`] || 0;
              console.log(`📦 Loja ${loja.nome}: quantidade = ${quantidade}`);

              if (quantidade > 0) {
                const estoqueData = {
                  produto_id: produtoId,
                  loja_id: loja.id,
                  quantidade: quantidade,
                };
                console.log("📋 Dados do estoque:", estoqueData);

                await insertTable("estoque_lojas", estoqueData);
                console.log(`✅ Estoque criado para loja ${loja.nome}`);
              }
            } catch (estoqueError) {
              console.error(
                `❌ Erro ao criar estoque para loja ${loja.nome}:`,
                estoqueError
              );
            }
          }
        } else {
          throw new Error("Não foi possível encontrar o produto recém-criado");
        }
      }

      console.log("🔄 Recarregando estoque...");
      await loadEstoque();

      console.log("✅ Salvamento concluído com sucesso!");
      onClose();
      clearForm();
    } catch (error) {
      console.error("❌ Erro ao salvar item:", error);
      alert(`Erro ao salvar item: ${getErrorMessage(error)}`);
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

  // Função para atualizar estoque de uma loja específica
  async function updateEstoqueLoja(
    produtoId: number,
    lojaId: number,
    quantidade: number
  ) {
    try {
      console.log(
        `🔄 Atualizando estoque - Produto: ${produtoId}, Loja: ${lojaId}, Quantidade: ${quantidade}`
      );

      // Buscar todos os registros de estoque_lojas
      const todosEstoqueLojas = await fetchTable("estoque_lojas");
      console.log(
        "📋 Total de registros de estoque por loja:",
        todosEstoqueLojas?.length || 0
      );

      // Filtrar para encontrar o registro específico
      const estoqueExistente = todosEstoqueLojas?.filter(
        (item) => item.produto_id === produtoId && item.loja_id === lojaId
      );

      console.log(
        "🔍 Registros existentes encontrados:",
        estoqueExistente?.length || 0
      );

      if (estoqueExistente && estoqueExistente.length > 0) {
        console.log(
          "✏️ Atualizando registro existente ID:",
          estoqueExistente[0].id
        );

        const updateData = {
          quantidade: quantidade,
          updatedat: new Date().toISOString(),
        };
        console.log("📋 Dados para atualização:", updateData);

        // Atualizar registro existente
        const result = await updateTable(
          "estoque_lojas",
          estoqueExistente[0].id,
          updateData
        );
        console.log("✅ Resultado da atualização:", result);
      } else {
        console.log("➕ Criando novo registro de estoque");

        const insertData = {
          produto_id: produtoId,
          loja_id: lojaId,
          quantidade: quantidade,
        };
        console.log("📋 Dados para inserção:", insertData);

        // Criar novo registro
        const result = await insertTable("estoque_lojas", insertData);
        console.log("✅ Resultado da inserção:", result);
      }
    } catch (error) {
      console.error("❌ Erro detalhado ao atualizar estoque da loja:", {
        produtoId,
        lojaId,
        quantidade,
        error,
      });
      throw error;
    }
  }

  // Exportar itens para arquivo Excel (.xlsx)
  async function exportToExcel(itemsToExport?: EstoqueItem[]) {
    try {
      const source =
        itemsToExport && itemsToExport.length > 0 ? itemsToExport : estoque;

      if (!source || source.length === 0) {
        alert("Nenhum produto no estoque para exportar.");
        return;
      }

      // Cabeçalho: colunas fixas + uma coluna por loja
      const lojaCols = lojas.map((l) => `Loja: ${l.nome}`);
      const header = [
        "ID",
        "Descrição",
        "Marca",
        "Modelo",
        "Observações",
        "Preço Compra",
        "Preço Venda",
        "Lucro Unitário",
        "Quantidade Total",
        ...lojaCols,
      ];

      const aoa: any[] = [header];

      for (const item of source) {
        const row: any[] = [];
        row.push(item.id);
        row.push(item.descricao || "");
        row.push(item.marca || "");
        row.push(item.modelo || "");
        row.push(item.observacoes || "");
        row.push(item.preco_compra || 0);
        row.push(item.preco_venda || 0);
        row.push((item.preco_venda || 0) - (item.preco_compra || 0));
        row.push(item.quantidade_total || 0);

        // Quantidades por loja (na ordem de `lojas`)
        for (const loja of lojas) {
          const q =
            item.estoque_lojas?.find((el) => el.loja_id === loja.id)
              ?.quantidade || 0;
          row.push(Number(q));
        }

        aoa.push(row);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Estoque");

      const now = new Date();
      const fmt = now.toISOString().slice(0, 10).replace(/-/g, "");
      const filename = `estoque_produtos_${fmt}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      throw error;
    }
  }

  // Aplicar filtros e ordenação
  const filteredAndSortedEstoque = estoque
    .filter((item) => {
      // Filtro de busca por texto
      // Busca multi-termos: cada termo precisa existir (parcial) em algum campo
      const tokens = normalizeText(searchTerm).split(" ").filter(Boolean);
      const composite = normalizeText(
        [
          item.id.toString(),
          item.descricao,
          item.modelo,
          item.marca,
          item.compativel,
        ].join(" ")
      );
      const searchMatch =
        tokens.length === 0 || tokens.every((t) => composite.includes(t));

      // Quantidade baseada na loja selecionada
      const quantidade = selectedLoja
        ? getQuantidadeLoja(item, selectedLoja)
        : item.quantidade_total || 0;

      // Filtro de quantidade
      const quantidadeMatch =
        (!filters.minQuantidade ||
          quantidade >= Number(filters.minQuantidade)) &&
        (!filters.maxQuantidade || quantidade <= Number(filters.maxQuantidade));

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

      // Filtro de estoque baixo baseado na loja selecionada
      const estoqueBaixoMatch =
        !filters.estoqueBaixo || isLowStock(item, selectedLoja || undefined);

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
          aValue = selectedLoja
            ? getQuantidadeLoja(a, selectedLoja)
            : a.quantidade_total || 0;
          bValue = selectedLoja
            ? getQuantidadeLoja(b, selectedLoja)
            : b.quantidade_total || 0;
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

  // Paginação
  const totalPages = Math.ceil(
    filteredAndSortedEstoque.length / ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredAndSortedEstoque.slice(startIndex, endIndex);

  // Verificação de loading - mostrar skeleton ou spinner mais específico
  // Verificação de loading - mostrar skeleton ou spinner mais específico
  if (loading && estoque.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardBody className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" label="Carregando dados do estoque..." />
        </div>
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
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          {lojas.length > 0 && (
            <div className="mt-2">
              <Select
                label="Selecionar Loja"
                selectedKeys={
                  selectedLoja
                    ? new Set([selectedLoja.toString()])
                    : new Set(["all"])
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  if (selectedKey === "all") {
                    setSelectedLoja(null);
                  } else {
                    setSelectedLoja(Number(selectedKey));
                  }
                }}
                className="w-64"
                size="sm"
                placeholder="Selecione uma loja"
                items={[
                  { id: "all", nome: "Todas as Lojas" },
                  ...lojas.map((loja) => ({
                    id: loja.id.toString(),
                    nome: loja.nome,
                  })),
                ]}
              >
                {(item) => <SelectItem key={item.id}>{item.nome}</SelectItem>}
              </Select>
            </div>
          )}
        </div>
        {canCreateEstoque && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={safeHandleAdd}
          >
            Novo Item
          </Button>
        )}
        {/* Botão para exportar estoque em Excel - visível para quem pode ver o estoque */}
      </div>

      {/* Estatísticas */}
      <EstoqueStats produtos={filteredAndSortedEstoque} />

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
          {canViewEstoque && (
            <Button
              color="secondary"
              variant="flat"
              startContent={<ChartBarIcon className="w-4 h-4" />}
              onPress={() => {
                exportToExcel(filteredAndSortedEstoque).catch((err) => {
                  console.error("Erro ao exportar Excel:", err);
                  alert("Erro ao gerar o arquivo Excel.");
                });
              }}
              className="ml-2"
            >
              Exportar Excel
            </Button>
          )}

          {(searchTerm ||
            Object.values(filters).some(
              (v) => v !== "" && v !== "descricao" && v !== "asc" && v !== false
            )) && (
            <Button variant="flat" color="warning" onPress={clearFilters}>
              Limpar
            </Button>
          )}

          {/* Alternar visualização: Grade ou Lista */}
          <div className="ml-auto flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "grid" ? "solid" : "flat"}
              color={viewMode === "grid" ? "primary" : "default"}
              onPress={() => setViewMode("grid")}
              aria-label="Exibir em grade"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "list" ? "solid" : "flat"}
              color={viewMode === "list" ? "primary" : "default"}
              onPress={() => setViewMode("list")}
              aria-label="Exibir em lista"
            >
              <ListBulletIcon className="w-4 h-4" />
            </Button>
          </div>
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
          {viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((item) => (
                <EstoqueCard
                  key={item.id}
                  produto={item}
                  lojas={lojas}
                  onEdit={safeHandleEdit}
                  onDelete={safeHandleDelete}
                  canEdit={canEditEstoque}
                  canDelete={canDeleteEstoque}
                />
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
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-default-200">
                    <th className="py-2 pr-3">Foto</th>
                    <th className="py-2 pr-3">Descrição</th>
                    <th className="py-2 pr-3">Marca</th>
                    <th className="py-2 pr-3">Modelo</th>
                    <th className="py-2 pr-3">Quantidade</th>
                    <th className="py-2 pr-3">Compra</th>
                    <th className="py-2 pr-3">Venda</th>
                    <th className="py-2 pr-3">Lucro</th>
                    <th className="py-2 pr-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => {
                    const foto =
                      item.fotourl && item.fotourl.length > 0
                        ? item.fotourl[0]
                        : null;
                    const quantidade = selectedLoja
                      ? getQuantidadeLoja(item, selectedLoja)
                      : item.quantidade_total || 0;
                    const compra = item.preco_compra || 0;
                    const venda = item.preco_venda || 0;
                    const lucro = venda - compra;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-default-100 hover:bg-default-50/40"
                      >
                        <td className="py-2 pr-3">
                          {foto ? (
                            <img
                              src={foto}
                              alt={item.descricao}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-default-200 flex items-center justify-center">
                              <CubeIcon className="w-6 h-6 text-default-500" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-3 font-medium">
                          {item.descricao}
                        </td>
                        <td className="py-2 pr-3">{item.marca || "-"}</td>
                        <td className="py-2 pr-3">{item.modelo || "-"}</td>
                        <td className="py-2 pr-3">{quantidade}</td>
                        <td className="py-2 pr-3">
                          {compra.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="py-2 pr-3">
                          {venda.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="py-2 pr-3">
                          {lucro.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              isDisabled={!canEditEstoque}
                              onPress={() => safeHandleEdit(item)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              isDisabled={!canDeleteEstoque}
                              onPress={() => safeHandleDelete(item.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAndSortedEstoque.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center py-8 text-default-500"
                      >
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
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

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
                  <>
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
                  </>
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

                {/* Estoque por Loja */}
                {isEditing && selectedItem && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Estoque por Loja
                    </label>
                    <div className="space-y-3 p-4  rounded-lg">
                      {lojas.map((loja) => {
                        // Buscar quantidade do formData primeiro, senão do item original
                        const quantidadeFormData =
                          formData[`quantidade_loja_${loja.id}`];
                        const quantidadeOriginal = getQuantidadeLoja(
                          selectedItem,
                          loja.id
                        );
                        const quantidade =
                          quantidadeFormData !== undefined
                            ? quantidadeFormData
                            : quantidadeOriginal;

                        return (
                          <div
                            key={loja.id}
                            className="flex items-center gap-3"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{loja.nome}</p>
                              <p className="text-sm text-gray-500">
                                {loja.endereco}
                              </p>
                            </div>
                            <Input
                              type="number"
                              placeholder="0"
                              value={quantidade.toString()}
                              onChange={(e) => {
                                const novaQuantidade =
                                  Number(e.target.value) || 0;
                                // Apenas atualizar o formData, não salvar no banco ainda
                                setFormData({
                                  ...formData,
                                  [`quantidade_loja_${loja.id}`]:
                                    novaQuantidade,
                                });
                              }}
                              className="w-24"
                              size="sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantidade para novo item */}
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quantidade Inicial por Loja
                    </label>
                    <div className="space-y-3 p-4  rounded-lg">
                      {lojas.map((loja) => (
                        <div key={loja.id} className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{loja.nome}</p>
                            <p className="text-sm text-gray-500">
                              {loja.endereco}
                            </p>
                          </div>
                          <Input
                            type="number"
                            placeholder="0"
                            value={
                              formData[
                                `quantidade_loja_${loja.id}`
                              ]?.toString() || ""
                            }
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                [`quantidade_loja_${loja.id}`]:
                                  Number(e.target.value) || 0,
                              });
                            }}
                            className="w-24"
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
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
