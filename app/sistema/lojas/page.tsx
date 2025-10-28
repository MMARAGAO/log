"use client";

import { useEffect, useState } from "react";
import { fetchTable } from "@/lib/fetchTable";
import { insertTable } from "@/lib/insertTable";
import { updateTable } from "@/lib/updateTable";
import { deleteTable } from "@/lib/deleteTable";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authZustand";
import { phoneMask } from "@/utils/maskInput";
import {
  Card,
  CardBody,
  Input,
  Button,
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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import DataHoje from "@/components/data";

interface Loja {
  id: number;
  nome: string;
  descricao?: string;
  endereco?: string;
  telefone?: string;
  fotourl?: string[];
  createdat?: string;
  updatedat?: string;
}

const ITEMS_PER_PAGE = 9;

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
        <BuildingStorefrontIcon className="w-16 h-16 text-gray-400" />
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
        className="object-cover w-full h-full rounded-xl transition-opacity duration-300"
        onError={(e) => {
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
    </div>
  );
}

// Componente do Carrossel de Fotos para o Modal
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
          className="object-cover w-full h-full"
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
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
              onPress={prevPhoto}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>

            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
              onPress={nextPhoto}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>

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

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
  const [formData, setFormData] = useState<Partial<Loja>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para o modal de exclusão
  const [lojaParaDeletar, setLojaParaDeletar] = useState<Loja | null>(null);
  const [dadosRelacionados, setDadosRelacionados] = useState<{
    caixas: number;
    estoque: number;
    transfOrigem: number;
    transfDestino: number;
    vendas: number;
  } | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permLojas = acessos?.lojas;
  const canViewLojas = !!permLojas?.ver_lojas;
  const canCreateLojas = !!permLojas?.criar_lojas;
  const canEditLojas = !!permLojas?.editar_lojas;
  const canDeleteLojas = !!permLojas?.deletar_lojas;

  // Carregar lojas
  async function loadLojas() {
    setLoading(true);
    try {
      const data = await fetchTable("lojas");
      setLojas(data || []);
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canViewLojas) {
      loadLojas();
    }
  }, [canViewLojas]);

  // Filtro de busca
  const filteredLojas = lojas.filter((loja) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      loja.nome?.toLowerCase().includes(search) ||
      loja.descricao?.toLowerCase().includes(search) ||
      loja.endereco?.toLowerCase().includes(search) ||
      loja.telefone?.includes(search)
    );
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredLojas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredLojas.slice(startIndex, endIndex);

  // Reset página quando buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Limpar formulário
  function clearForm() {
    setFormData({});
    setSelectedFiles([]);
    setPreviewUrls([]);
    setCurrentPhotos([]);
    setSelectedLoja(null);
    setIsEditing(false);
  }

  // Adicionar nova loja
  function handleAdd() {
    if (!canCreateLojas) {
      alert("Você não possui permissão para criar lojas.");
      return;
    }
    clearForm();
    onOpen();
  }

  // Editar loja
  function handleEdit(loja: Loja) {
    if (!canEditLojas) {
      alert("Você não possui permissão para editar lojas.");
      return;
    }
    setSelectedLoja(loja);
    setFormData({ ...loja });
    setCurrentPhotos(loja.fotourl || []);
    setIsEditing(true);
    onOpen();
  }

  // Deletar loja
  async function handleDelete(id: number) {
    if (!canDeleteLojas) {
      alert("Você não possui permissão para deletar lojas.");
      return;
    }

    const loja = lojas.find((l) => l.id === id);
    if (!loja) return;

    setLoading(true);
    try {
      // Verificar se existem registros relacionados e contar quantos
      const { count: countCaixas } = await supabase
        .from("caixa")
        .select("id", { count: "exact", head: true })
        .eq("loja_id", id);

      const { count: countEstoque } = await supabase
        .from("estoque_lojas")
        .select("id", { count: "exact", head: true })
        .eq("loja_id", id);

      const { count: countTransfOrigem } = await supabase
        .from("transferencias")
        .select("id", { count: "exact", head: true })
        .eq("loja_origem_id", id);

      const { count: countTransfDestino } = await supabase
        .from("transferencias")
        .select("id", { count: "exact", head: true })
        .eq("loja_destino_id", id);

      const { count: countVendas } = await supabase
        .from("vendas")
        .select("id", { count: "exact", head: true })
        .eq("loja_id", id);

      // Verificar se tem dados relacionados
      const temDados =
        (countCaixas ?? 0) > 0 ||
        (countEstoque ?? 0) > 0 ||
        (countTransfOrigem ?? 0) > 0 ||
        (countTransfDestino ?? 0) > 0 ||
        (countVendas ?? 0) > 0;

      if (temDados) {
        // Mostrar modal com os detalhes
        setLojaParaDeletar(loja);
        setDadosRelacionados({
          caixas: countCaixas ?? 0,
          estoque: countEstoque ?? 0,
          transfOrigem: countTransfOrigem ?? 0,
          transfDestino: countTransfDestino ?? 0,
          vendas: countVendas ?? 0,
        });
        onDeleteModalOpen();
      } else {
        // Se não houver dados relacionados, confirmar exclusão simples
        if (confirm(`Tem certeza que deseja excluir a loja "${loja.nome}"?`)) {
          await executarExclusao(id, loja.nome);
        }
      }
    } catch (error: any) {
      console.error("❌ Erro ao verificar dados relacionados:", error);
      alert(
        "Erro ao verificar dados relacionados!\n\n" +
          (error?.message || "Erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // Executar a exclusão em cascata
  async function executarExclusao(id: number, nomeLoja: string) {
    setLoading(true);
    try {
      // Buscar todos os dados para deletar
      const { data: caixas } = await supabase
        .from("caixa")
        .select("id")
        .eq("loja_id", id);

      const { data: estoqueLojas } = await supabase
        .from("estoque_lojas")
        .select("id")
        .eq("loja_id", id);

      const { data: transferenciasOrigem } = await supabase
        .from("transferencias")
        .select("id")
        .eq("loja_origem_id", id);

      const { data: transferenciasDestino } = await supabase
        .from("transferencias")
        .select("id")
        .eq("loja_destino_id", id);

      const { data: vendas } = await supabase
        .from("vendas")
        .select("id")
        .eq("loja_id", id);

      console.log("🗑️ Iniciando exclusão em cascata da loja:", nomeLoja);

      // 1. Deletar vendas
      if (vendas && vendas.length > 0) {
        console.log(`🗑️ Deletando ${vendas.length} venda(s)...`);
        for (const venda of vendas) {
          await deleteTable("vendas", venda.id);
        }
      }

      // 2. Deletar caixas
      if (caixas && caixas.length > 0) {
        console.log(`🗑️ Deletando ${caixas.length} registro(s) de caixa...`);
        for (const caixa of caixas) {
          await deleteTable("caixa", caixa.id);
        }
      }

      // 3. Deletar transferências como origem
      if (transferenciasOrigem && transferenciasOrigem.length > 0) {
        console.log(
          `🗑️ Deletando ${transferenciasOrigem.length} transferência(s) como origem...`
        );
        for (const transf of transferenciasOrigem) {
          await deleteTable("transferencias", transf.id);
        }
      }

      // 4. Deletar transferências como destino
      if (transferenciasDestino && transferenciasDestino.length > 0) {
        console.log(
          `🗑️ Deletando ${transferenciasDestino.length} transferência(s) como destino...`
        );
        for (const transf of transferenciasDestino) {
          await deleteTable("transferencias", transf.id);
        }
      }

      // 5. Deletar estoque_lojas
      if (estoqueLojas && estoqueLojas.length > 0) {
        console.log(
          `🗑️ Deletando ${estoqueLojas.length} produto(s) do estoque...`
        );
        for (const estoque of estoqueLojas) {
          await deleteTable("estoque_lojas", estoque.id);
        }
      }

      // 6. Finalmente, deletar a loja
      console.log("🗑️ Deletando a loja...");
      await deleteTable("lojas", id);

      console.log("✅ Exclusão em cascata concluída com sucesso!");

      // Fechar modal e atualizar lista
      onDeleteModalClose();
      await loadLojas();
    } catch (error: any) {
      console.error("❌ Erro ao deletar loja:", error);
      alert(
        "❌ Erro ao deletar loja!\n\n" +
          (error?.message || error?.details || "Erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  // Confirmar exclusão do modal
  function confirmarExclusao() {
    if (lojaParaDeletar) {
      executarExclusao(lojaParaDeletar.id, lojaParaDeletar.nome);
    }
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

  // Salvar loja
  async function handleSave() {
    if (!formData.nome) {
      alert("Nome da loja é obrigatório!");
      return;
    }

    // Verificação de permissão
    if (isEditing && !canEditLojas) {
      alert("Você não possui permissão para editar lojas.");
      return;
    }
    if (!isEditing && !canCreateLojas) {
      alert("Você não possui permissão para criar lojas.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && selectedLoja) {
        // Atualizar loja existente
        if (selectedFiles.length > 0) {
          // Adicionar novas fotos uma por uma
          let currentFotoArray = [...currentPhotos];

          for (let i = 0; i < selectedFiles.length; i++) {
            await updateTable(
              "lojas",
              selectedLoja.id,
              i === 0 ? formData : {}, // Atualizar dados apenas na primeira chamada
              selectedFiles[i],
              currentFotoArray
            );

            // Buscar a loja atualizada para pegar o array correto
            const updatedLojas = await fetchTable("lojas");
            const updatedLoja = updatedLojas.find(
              (loja) => loja.id === selectedLoja.id
            );
            if (updatedLoja?.fotourl) {
              currentFotoArray = updatedLoja.fotourl;
            }
          }
        } else {
          // Apenas atualizar dados sem adicionar fotos
          await updateTable(
            "lojas",
            selectedLoja.id,
            formData,
            undefined,
            currentPhotos
          );
        }
      } else {
        // Criar nova loja
        if (selectedFiles.length === 0) {
          // Criar loja sem fotos
          await insertTable("lojas", formData);
        } else {
          // Criar loja com fotos
          // Inserir loja com a primeira foto
          await insertTable("lojas", formData, selectedFiles[0]);

          if (selectedFiles.length > 1) {
            // Aguardar para garantir que a loja foi criada
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Buscar a loja recém-criada
            const allLojas = await fetchTable("lojas");
            const newLoja = allLojas
              .filter(
                (loja) =>
                  loja.nome === formData.nome &&
                  loja.endereco === formData.endereco
              )
              .sort(
                (a, b) =>
                  new Date(b.createdat || "").getTime() -
                  new Date(a.createdat || "").getTime()
              )[0];

            if (newLoja) {
              // Adicionar fotos restantes uma por uma
              for (let i = 1; i < selectedFiles.length; i++) {
                // Buscar o estado atual da loja antes de cada upload
                const currentLojas = await fetchTable("lojas");
                const currentLoja = currentLojas.find(
                  (loja) => loja.id === newLoja.id
                );
                const currentFotoArray = currentLoja?.fotourl || [];

                await updateTable(
                  "lojas",
                  newLoja.id,
                  {}, // Não atualizar outros dados
                  selectedFiles[i],
                  currentFotoArray
                );

                // Aguardar entre uploads
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }
          }
        }
      }

      // Recarregar dados
      await loadLojas();
      onClose();
      clearForm();
    } catch (error) {
      console.error("Erro ao salvar loja:", error);
      alert("Erro ao salvar loja!");
    } finally {
      setLoading(false);
    }
  }

  // Verificação de loading
  if (loading && !isOpen) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando lojas..." />
      </div>
    );
  }

  // Bloqueio de visualização
  if (!canViewLojas) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold">Lojas</h1>
            <p>Gerencie as lojas da empresa</p>
          </div>
          <DataHoje />
        </div>

        <Card className="border-danger-200">
          <CardBody className="text-center py-12">
            <div className="mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 text-danger mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-danger text-sm mb-4">
              Você não possui permissão para visualizar lojas.
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
      {/* Cabeçalho */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lojas</h1>
          <p>Gerencie as lojas da empresa</p>
        </div>
        <DataHoje />
      </div>

      {/* Card de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <BuildingStorefrontIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Total de Lojas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lojas.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <PhotoIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Com Fotos</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    lojas.filter(
                      (loja) => loja.fotourl && loja.fotourl.length > 0
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <MapPinIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-default-500">Com Endereço</p>
                <p className="text-2xl font-bold text-purple-600">
                  {lojas.filter((loja) => loja.endereco).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Busca e botão adicionar */}
      <div className="flex gap-4 items-center mb-6">
        <Input
          placeholder="Buscar por nome, descrição, endereço ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
          className="flex-1"
        />

        {canCreateLojas && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-4 h-4" />}
            onPress={handleAdd}
          >
            Nova Loja
          </Button>
        )}
      </div>

      {/* Informações da paginação */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-default-500">
          Mostrando {startIndex + 1} a{" "}
          {Math.min(endIndex, filteredLojas.length)} de {filteredLojas.length}{" "}
          lojas
          {searchTerm && ` (filtrado de ${lojas.length} total)`}
        </p>

        {totalPages > 1 && (
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            size="sm"
          />
        )}
      </div>

      {/* Grid de lojas */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((loja) => (
          <Card key={loja.id} className="w-full">
            <CardBody>
              {/* Carrossel de Fotos */}
              <PhotoCarousel
                photos={loja.fotourl || []}
                itemName={loja.nome}
                className="w-full bg-gray-200 h-48 rounded-xl"
              />

              <div className="flex items-start justify-between mb-3 mt-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{loja.nome}</h3>
                  {loja.descricao && (
                    <p className="text-small text-default-500 mt-1">
                      {loja.descricao}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {loja.fotourl && loja.fotourl.length > 0 && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={<PhotoIcon className="w-3 h-3 mr-1" />}
                      >
                        {loja.fotourl.length} foto
                        {loja.fotourl.length > 1 ? "s" : ""}
                      </Chip>
                    )}
                  </div>
                </div>

                {(canEditLojas || canDeleteLojas) && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {canEditLojas ? (
                        <DropdownItem
                          key="edit"
                          startContent={<PencilIcon className="w-4 h-4" />}
                          onPress={() => handleEdit(loja)}
                        >
                          Editar
                        </DropdownItem>
                      ) : null}
                      {canDeleteLojas ? (
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<TrashIcon className="w-4 h-4" />}
                          onPress={() => handleDelete(loja.id)}
                        >
                          Deletar
                        </DropdownItem>
                      ) : null}
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>

              <Divider className="my-3" />

              <div className="space-y-2 text-sm">
                {loja.endereco && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-default-400" />
                    <span className="truncate">{loja.endereco}</span>
                  </div>
                )}
                {loja.telefone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-default-400" />
                    <span>{loja.telefone}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}

        {filteredLojas.length === 0 && !loading && (
          <div className="text-center py-8 text-default-500 col-span-full">
            {searchTerm
              ? "Nenhuma loja encontrada com os filtros aplicados"
              : "Nenhuma loja cadastrada"}
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
          />
        </div>
      )}

      {/* Modal */}
      {(canCreateLojas || canEditLojas) && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>{isEditing ? "Editar Loja" : "Nova Loja"}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Nome */}
                <Input
                  label="Nome da Loja *"
                  placeholder="Digite o nome da loja"
                  value={formData.nome || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  isRequired
                />

                {/* Descrição */}
                <Textarea
                  label="Descrição"
                  placeholder="Breve descrição da loja..."
                  value={formData.descricao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                />

                {/* Endereço */}
                <Input
                  label="Endereço"
                  placeholder="Endereço completo da loja"
                  value={formData.endereco || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                  startContent={
                    <MapPinIcon className="w-4 h-4 text-default-400" />
                  }
                />

                {/* Telefone */}
                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefone: phoneMask(e.target.value),
                    })
                  }
                  startContent={
                    <PhoneIcon className="w-4 h-4 text-default-400" />
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

      {/* Modal de Confirmação de Exclusão em Cascata */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        size="2xl"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20">
            <ExclamationTriangleIcon className="w-6 h-6 text-danger-600" />
            <span className="text-danger-800 dark:text-danger-400">
              ⚠️ Exclusão em Cascata
            </span>
          </ModalHeader>
          <ModalBody className="py-6">
            {lojaParaDeletar && dadosRelacionados && (
              <div className="space-y-4">
                {/* Aviso principal */}
                <Card className="bg-danger-50 dark:bg-danger-900/10 border-2 border-danger-200 dark:border-danger-800">
                  <CardBody>
                    <p className="text-center font-semibold text-danger-800 dark:text-danger-400">
                      Você está prestes a excluir a loja:
                    </p>
                    <p className="text-center text-xl font-bold text-danger-900 dark:text-danger-300 mt-2">
                      {lojaParaDeletar.nome}
                    </p>
                  </CardBody>
                </Card>

                {/* Lista de dados relacionados */}
                <div>
                  <p className="font-semibold mb-3 text-default-700">
                    Esta loja possui os seguintes dados relacionados:
                  </p>
                  <div className="space-y-2">
                    {dadosRelacionados.vendas > 0 && (
                      <Card className="border-l-4 border-l-danger-500">
                        <CardBody className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-danger-100 dark:bg-danger-900/30 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-danger-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                              </div>
                              <span className="font-medium">Vendas</span>
                            </div>
                            <Chip color="danger" variant="flat" size="lg">
                              {dadosRelacionados.vendas}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {dadosRelacionados.caixas > 0 && (
                      <Card className="border-l-4 border-l-warning-500">
                        <CardBody className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-warning-100 dark:bg-warning-900/30 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-warning-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                              </div>
                              <span className="font-medium">
                                Registros de Caixa
                              </span>
                            </div>
                            <Chip color="warning" variant="flat" size="lg">
                              {dadosRelacionados.caixas}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {dadosRelacionados.estoque > 0 && (
                      <Card className="border-l-4 border-l-primary-500">
                        <CardBody className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-primary-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              </div>
                              <span className="font-medium">
                                Produtos em Estoque
                              </span>
                            </div>
                            <Chip color="primary" variant="flat" size="lg">
                              {dadosRelacionados.estoque}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {(dadosRelacionados.transfOrigem > 0 ||
                      dadosRelacionados.transfDestino > 0) && (
                      <Card className="border-l-4 border-l-secondary-500">
                        <CardBody className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-secondary-100 dark:bg-secondary-900/30 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-secondary-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                  />
                                </svg>
                              </div>
                              <span className="font-medium">
                                Transferências
                              </span>
                            </div>
                            <Chip color="secondary" variant="flat" size="lg">
                              {dadosRelacionados.transfOrigem +
                                dadosRelacionados.transfDestino}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Aviso final */}
                <Card className="bg-danger-100 dark:bg-danger-900/20 border border-danger-300 dark:border-danger-700">
                  <CardBody>
                    <div className="flex gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-bold text-danger-800 dark:text-danger-400">
                          ATENÇÃO: Esta ação é irreversível!
                        </p>
                        <p className="text-sm text-danger-700 dark:text-danger-500">
                          Todos os dados listados acima serão{" "}
                          <strong>excluídos permanentemente</strong> do sistema.
                          Esta operação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onDeleteModalClose();
                setLojaParaDeletar(null);
                setDadosRelacionados(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={confirmarExclusao}
              isLoading={loading}
              startContent={<TrashIcon className="w-4 h-4" />}
            >
              Excluir Tudo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
