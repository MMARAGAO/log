"use client";

import { useEffect, useState, useMemo } from "react";
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
  Select,
  SelectItem,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentArrowDownIcon,
  UserIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import DataHoje from "@/components/data";
import { PDFGenerator } from "@/components/PDFGenerator";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

interface Ordem {
  id: number;
  modelo: string;
  cor?: string;
  defeito?: string;
  diagnostico?: string;
  entrada?: string;
  saida?: string;
  forma_pagamento?: string;
  status: string;
  garantia: boolean;
  periodo_garantia?: string;
  observacoes?: string;
  prazo?: string;
  prioridade: string;
  tecnico_responsavel?: string;
  valor?: number;
  id_cliente?: number;
  fotourl?: string[];
  created_at?: string;
  updated_at?: string;
}

interface FilterState {
  orderBy: string;
  orderDirection: "asc" | "desc";
  status: string;
  prioridade: string;
  garantia: string; // "", "sim", "nao"
  dataEntradaDe: string;
  dataEntradaAte: string;
  dataPrazoDe: string;
  dataPrazoAte: string;
  valorMin: string;
  valorMax: string;
  cliente: string;
}

const STATUS_OPTIONS = [
  { key: "aguardando", label: "Aguardando" },
  { key: "em_andamento", label: "Em Andamento" },
  { key: "aguardando_peca", label: "Aguardando Peça" },
  { key: "concluido", label: "Concluído" },
  { key: "entregue", label: "Entregue" },
  { key: "cancelado", label: "Cancelado" },
];

const PRIORIDADE_OPTIONS = [
  { key: "baixa", label: "Baixa" },
  { key: "normal", label: "Normal" },
  { key: "alta", label: "Alta" },
  { key: "urgente", label: "Urgente" },
];

const FORMA_PAGAMENTO = [
  { key: "dinheiro", label: "Dinheiro" },
  { key: "cartao_debito", label: "Cartão Débito" },
  { key: "cartao_credito", label: "Cartão Crédito" },
  { key: "pix", label: "PIX" },
  { key: "transferencia", label: "Transferência" },
  { key: "cheque", label: "Cheque" },
];

const ORDER_OPTIONS = [
  { key: "id", label: "ID" },
  { key: "modelo", label: "Modelo" },
  { key: "status", label: "Status" },
  { key: "prioridade", label: "Prioridade" },
  { key: "valor", label: "Valor" },
  { key: "entrada", label: "Entrada" },
  { key: "prazo", label: "Prazo" },
  { key: "tecnico_responsavel", label: "Técnico" },
  { key: "created_at", label: "Criado" },
  { key: "updated_at", label: "Atualizado" },
];

const ITEMS_PER_PAGE = 12;

// Carrossel de fotos (igual abordagem estoque)
function PhotoCarousel({
  photos,
  altBase,
  className,
}: {
  photos: string[];
  altBase: string;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [photos]);

  if (!photos || photos.length === 0) {
    return (
      <div
        className={`bg-default-100 flex items-center justify-center ${className}`}
      >
        <WrenchScrewdriverIcon className="w-16 h-16 text-default-400" />
      </div>
    );
  }

  const next = () => setIdx((p) => (p + 1) % photos.length);
  const prev = () => setIdx((p) => (p - 1 + photos.length) % photos.length);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={photos[idx]}
        alt={`${altBase} - Foto ${idx + 1}`}
        className="object-contain w-full h-full rounded-xl transition-opacity"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {photos.length > 1 && (
        <>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
            onPress={prev}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
            onPress={next}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === idx
                    ? "bg-white scale-110"
                    : "bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {idx + 1}/{photos.length}
          </div>
          <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <PhotoIcon className="w-3 h-3" />
            {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

// Carrossel modal para remover fotos existentes/novas
function ModalPhotoCarousel({
  photos,
  onRemove,
  title,
}: {
  photos: string[];
  onRemove: (index: number) => void;
  title: string;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
  }, [photos]);

  if (!photos || photos.length === 0) return null;

  const next = () => setIdx((p) => (p + 1) % photos.length);
  const prev = () => setIdx((p) => (p - 1 + photos.length) % photos.length);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{title}</label>
      <div className="relative overflow-hidden w-full h-48 bg-default-100 rounded-lg mb-3">
        <img
          src={photos[idx]}
          alt={`${title} ${idx + 1}`}
          className="object-contain w-full h-full"
        />
        <Button
          isIconOnly
          size="sm"
          color="danger"
          variant="solid"
          className="absolute top-2 right-2 z-20"
          onPress={() => {
            onRemove(idx);
            if (idx >= photos.length - 1 && photos.length > 1) {
              setIdx(photos.length - 2);
            }
          }}
        >
          <XMarkIcon className="w-3 h-3" />
        </Button>
        {photos.length > 1 && (
          <>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
              onPress={prev}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 min-w-8 bg-black/60 text-white hover:bg-black/80 z-10"
              onPress={next}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              {idx + 1}/{photos.length}
            </div>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((p, i) => (
            <button
              key={p + i}
              onClick={() => setIdx(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                i === idx
                  ? "border-primary-500 scale-105"
                  : "border-default-300 hover:border-default-400"
              }`}
            >
              <img
                src={p}
                alt={`thumb-${i}`}
                className="w-full h-full object-cover rounded"
              />
              {i === idx && (
                <div className="absolute inset-0 bg-primary-500/20 rounded" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState<Partial<Ordem>>({
    status: "aguardando",
    prioridade: "normal",
    garantia: false,
  });
  const [valorInput, setValorInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<Ordem | null>(null);

  // Fotos
  const [currentFotos, setCurrentFotos] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Busca / filtros / paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    orderBy: "id",
    orderDirection: "desc",
    status: "",
    prioridade: "",
    garantia: "",
    dataEntradaDe: "",
    dataEntradaAte: "",
    dataPrazoDe: "",
    dataPrazoAte: "",
    valorMin: "",
    valorMax: "",
    cliente: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuthStore();

  // Controle de permissões
  const acessos = user?.permissoes?.acessos;
  const permOrdens = acessos?.ordens;
  const canViewOrdens = !!permOrdens?.ver_ordens;
  const canCreateOrdens = !!permOrdens?.criar_ordens;
  const canEditOrdens = !!permOrdens?.editar_ordens;
  const canDeleteOrdens = !!permOrdens?.deletar_ordens;
  const canPdfOrdens = !!permOrdens?.pdf_ordens;

  async function loadData() {
    setLoading(true);
    try {
      const [od, cl] = await Promise.all([
        fetchTable("ordens"),
        fetchTable("clientes"),
      ]);
      setOrdens(od || []);
      setClientes(cl || []);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Helpers
  function getClienteNome(id?: number) {
    if (!id) return "";
    return clientes.find((c) => c.id === id)?.nome || "";
  }

  function statusColor(s: string) {
    switch (s) {
      case "aguardando":
        return "warning";
      case "em_andamento":
        return "primary";
      case "aguardando_peca":
        return "secondary";
      case "concluido":
      case "entregue":
        return "success";
      case "cancelado":
        return "danger";
      default:
        return "default";
    }
  }

  function prioridadeColor(p: string) {
    switch (p) {
      case "baixa":
        return "default";
      case "normal":
        return "primary";
      case "alta":
        return "warning";
      case "urgente":
        return "danger";
      default:
        return "default";
    }
  }

  // Estatísticas
  const totalOrdens = ordens.length;
  const totalValor = ordens.reduce((acc, o) => acc + (o.valor || 0), 0);
  const concluidas = ordens.filter((o) => o.status === "concluido").length;
  const pendentes = ordens.filter(
    (o) =>
      o.status !== "concluido" &&
      o.status !== "entregue" &&
      o.status !== "cancelado"
  ).length;

  // Filtro + busca
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ordens
      .filter((o) => {
        // Busca texto
        const searchMatch =
          !q ||
          [
            `#${o.id}`,
            o.modelo,
            o.cor,
            o.defeito,
            o.diagnostico,
            o.status,
            o.prioridade,
            o.tecnico_responsavel,
            getClienteNome(o.id_cliente),
          ]
            .filter(Boolean)
            .some((v) => v!.toString().toLowerCase().includes(q));

        if (!searchMatch) return false;

        // Filtros
        if (filters.status && o.status !== filters.status) return false;
        if (filters.prioridade && o.prioridade !== filters.prioridade)
          return false;
        if (filters.garantia === "sim" && !o.garantia) return false;
        if (filters.garantia === "nao" && o.garantia) return false;
        if (filters.cliente && `${o.id_cliente}` !== filters.cliente)
          return false;

        // Datas
        if (filters.dataEntradaDe && o.entrada) {
          if (new Date(o.entrada) < new Date(filters.dataEntradaDe))
            return false;
        }
        if (filters.dataEntradaAte && o.entrada) {
          const end = new Date(filters.dataEntradaAte);
          end.setHours(23, 59, 59, 999);
          if (new Date(o.entrada) > end) return false;
        }

        if (filters.dataPrazoDe && o.prazo) {
          if (new Date(o.prazo) < new Date(filters.dataPrazoDe)) return false;
        }
        if (filters.dataPrazoAte && o.prazo) {
          const end = new Date(filters.dataPrazoAte);
          end.setHours(23, 59, 59, 999);
          if (new Date(o.prazo) > end) return false;
        }

        // Valor
        const vMin =
          filters.valorMin && filters.valorMin !== ""
            ? currencyToNumber(filters.valorMin)
            : null;
        const vMax =
          filters.valorMax && filters.valorMax !== ""
            ? currencyToNumber(filters.valorMax)
            : null;

        if (vMin !== null && (o.valor || 0) < vMin) return false;
        if (vMax !== null && (o.valor || 0) > vMax) return false;

        return true;
      })
      .sort((a, b) => {
        const dir = filters.orderDirection === "asc" ? 1 : -1;
        function val(o: Ordem) {
          switch (filters.orderBy) {
            case "id":
              return o.id;
            case "modelo":
              return o.modelo?.toLowerCase() || "";
            case "status":
              return o.status || "";
            case "prioridade":
              return o.prioridade || "";
            case "valor":
              return o.valor || 0;
            case "entrada":
              return o.entrada ? new Date(o.entrada).getTime() : 0;
            case "prazo":
              return o.prazo ? new Date(o.prazo).getTime() : 0;
            case "tecnico_responsavel":
              return o.tecnico_responsavel?.toLowerCase() || "";
            case "created_at":
              return o.created_at ? new Date(o.created_at).getTime() : 0;
            case "updated_at":
              return o.updated_at ? new Date(o.updated_at).getTime() : 0;
            default:
              return o.id;
          }
        }
        const av = val(a);
        const bv = val(b);
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
  }, [ordens, searchTerm, filters, clientes]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, end);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Form handlers
  function openNew() {
    setIsEditing(false);
    setSelectedOrdem(null);
    setFormData({
      status: "aguardando",
      prioridade: "normal",
      garantia: false,
    });
    setValorInput("");
    setCurrentFotos([]);
    setSelectedFiles([]);
    setPreviewUrls([]);
    onOpen();
  }

  function edit(o: Ordem) {
    console.log("📝 EDIT - Ordem recebida do banco:", o);
    console.log("📝 EDIT - Chaves da ordem:", Object.keys(o));

    setIsEditing(true);
    setSelectedOrdem(o);

    // Copia APENAS os campos válidos da ordem, ignorando campos extras de JOINs
    const novoFormData = {
      id: o.id,
      modelo: o.modelo || "",
      cor: o.cor || "",
      defeito: o.defeito || "",
      diagnostico: o.diagnostico || "",
      entrada: o.entrada || "",
      saida: o.saida || "",
      forma_pagamento: o.forma_pagamento || "",
      status: o.status,
      garantia: o.garantia,
      periodo_garantia: o.periodo_garantia || "",
      observacoes: o.observacoes || "",
      prazo: o.prazo || "",
      prioridade: o.prioridade,
      tecnico_responsavel: o.tecnico_responsavel || "",
      id_cliente: o.id_cliente,
      // NÃO copiar: nome, created_at, updated_at, ou qualquer outro campo extra
    };

    console.log("📝 EDIT - FormData que será definido:", novoFormData);
    console.log("📝 EDIT - Chaves do formData:", Object.keys(novoFormData));

    setFormData(novoFormData);
    setValorInput(o.valor ? numberToCurrencyInput(o.valor) : "");
    setCurrentFotos(o.fotourl || []);
    setSelectedFiles([]);
    setPreviewUrls([]);
    onOpen();
  }

  function removeCurrentPhoto(index: number) {
    setCurrentFotos((prev) => prev.filter((_, i) => i !== index));
  }
  function removePreviewPhoto(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
  }

  // Handlers com verificação de permissão
  function safeOpenNew() {
    if (!canCreateOrdens) {
      alert("Você não possui permissão para criar ordens de serviço.");
      return;
    }
    openNew();
  }

  function safeEdit(ordem: Ordem) {
    if (!canEditOrdens) {
      alert("Você não possui permissão para editar ordens de serviço.");
      return;
    }
    edit(ordem);
  }

  async function safeHandleDelete(id: number) {
    if (!canDeleteOrdens) {
      alert("Você não possui permissão para deletar ordens de serviço.");
      return;
    }
    await handleDelete(id);
  }

  function safeGerarPDF(ordem: Ordem) {
    if (!canPdfOrdens) {
      alert("Você não possui permissão para gerar PDF das ordens.");
      return;
    }
    gerarPDF(ordem);
  }

  async function handleSave() {
    if (!formData.modelo) {
      alert("Modelo é obrigatório.");
      return;
    }

    // Verificação de permissão
    if (isEditing && !canEditOrdens) {
      alert("Você não possui permissão para editar ordens de serviço.");
      return;
    }
    if (!isEditing && !canCreateOrdens) {
      alert("Você não possui permissão para criar ordens de serviço.");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 INÍCIO handleSave - formData atual:", formData);
      console.log("🔍 Chaves no formData:", Object.keys(formData));

      const valorNumber = valorInput ? currencyToNumber(valorInput) : 0;

      // Lista de campos válidos da tabela ordens (sem campos extras de JOINs)
      const camposValidos = [
        "modelo",
        "cor",
        "defeito",
        "diagnostico",
        "entrada",
        "saida",
        "forma_pagamento",
        "status",
        "garantia",
        "periodo_garantia",
        "observacoes",
        "prazo",
        "prioridade",
        "tecnico_responsavel",
        "valor",
        "id_cliente",
        "fotourl",
      ];

      const baseData: any = {
        modelo: formData.modelo,
        status: formData.status || "aguardando",
        garantia: !!formData.garantia,
        prioridade: formData.prioridade || "normal",
        valor: valorNumber,
      };

      // Adiciona campos opcionais apenas se tiverem valor
      if (formData.cor) baseData.cor = formData.cor;
      if (formData.defeito) baseData.defeito = formData.defeito;
      if (formData.diagnostico) baseData.diagnostico = formData.diagnostico;
      if (formData.entrada) baseData.entrada = formData.entrada;
      if (formData.saida) baseData.saida = formData.saida;
      if (formData.forma_pagamento)
        baseData.forma_pagamento = formData.forma_pagamento;
      if (formData.periodo_garantia)
        baseData.periodo_garantia = formData.periodo_garantia;
      if (formData.observacoes) baseData.observacoes = formData.observacoes;
      if (formData.prazo) baseData.prazo = formData.prazo;
      if (formData.tecnico_responsavel)
        baseData.tecnico_responsavel = formData.tecnico_responsavel;
      if (formData.id_cliente) baseData.id_cliente = formData.id_cliente;

      // Remove qualquer campo inválido que possa ter sido copiado do formData
      Object.keys(baseData).forEach((key) => {
        if (!camposValidos.includes(key)) {
          console.warn(`⚠️ Removendo campo inválido: ${key}`, baseData[key]);
          delete baseData[key];
        }
      });

      console.log("📋 Dados que serão enviados:", baseData);

      if (isEditing && selectedOrdem) {
        // Atualiza dados + fotos (adicionando uma a uma se múltiplas)
        if (selectedFiles.length > 0) {
          // Atualiza os dados na primeira foto
          await updateTable(
            "ordens",
            selectedOrdem.id,
            baseData,
            selectedFiles[0],
            currentFotos
          );

          // Busca o estado atualizado
          let updated = await fetchTable("ordens");
          let ord = updated.find((oo: Ordem) => oo.id === selectedOrdem.id);
          let currentArray = ord?.fotourl || [...currentFotos];

          // Adiciona as fotos restantes (apenas upload, sem atualizar outros campos)
          for (let i = 1; i < selectedFiles.length; i++) {
            await updateTable(
              "ordens",
              selectedOrdem.id,
              {}, // Objeto vazio é OK aqui pois estamos apenas adicionando foto
              selectedFiles[i],
              currentArray
            );
            // Busca estado real após cada upload
            updated = await fetchTable("ordens");
            ord = updated.find((oo: Ordem) => oo.id === selectedOrdem.id);
            currentArray = ord?.fotourl || currentArray;
            // Pequeno delay para evitar race conditions
            await new Promise((r) => setTimeout(r, 300));
          }
        } else {
          await updateTable(
            "ordens",
            selectedOrdem.id,
            baseData,
            undefined,
            currentFotos
          );
        }
      } else {
        // Inserção
        if (selectedFiles.length === 0) {
          await insertTable("ordens", baseData);
        } else {
          // cria com primeira
          await insertTable("ordens", baseData, selectedFiles[0]);
          if (selectedFiles.length > 1) {
            await new Promise((r) => setTimeout(r, 800));
            const all = await fetchTable("ordens");
            // heurística: pega última criada com mesmo modelo + valor
            const rec = [...all]
              .filter(
                (oo: Ordem) =>
                  oo.modelo === baseData.modelo &&
                  (oo.valor || 0) === baseData.valor
              )
              .sort(
                (a, b) =>
                  new Date(b.created_at || 0).getTime() -
                  new Date(a.created_at || 0).getTime()
              )[0];
            if (rec) {
              for (let i = 1; i < selectedFiles.length; i++) {
                const freshAll = await fetchTable("ordens");
                const fresh = freshAll.find((oo: Ordem) => oo.id === rec.id);
                const arr = fresh?.fotourl || [];
                await updateTable("ordens", rec.id, {}, selectedFiles[i], arr);
                await new Promise((r) => setTimeout(r, 400));
              }
            }
          }
        }
      }
      await loadData();
      onClose();
    } catch (e: any) {
      console.error("❌ Erro completo:", e);
      console.error("❌ Mensagem:", e?.message);
      console.error("❌ Detalhes:", e?.details);
      console.error("❌ Hint:", e?.hint);
      console.error("❌ Code:", e?.code);

      let errorMsg = "Erro ao salvar ordem.";
      if (e?.message) {
        errorMsg += "\n" + e.message;
      }
      if (e?.details) {
        errorMsg += "\nDetalhes: " + e.details;
      }
      if (e?.hint) {
        errorMsg += "\nDica: " + e.hint;
      }

      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta OS?")) return;
    setLoading(true);
    try {
      await deleteTable("ordens", id);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir.");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilters({
      orderBy: "id",
      orderDirection: "desc",
      status: "",
      prioridade: "",
      garantia: "",
      dataEntradaDe: "",
      dataEntradaAte: "",
      dataPrazoDe: "",
      dataPrazoAte: "",
      valorMin: "",
      valorMax: "",
      cliente: "",
    });
    setSearchTerm("");
  }

  function gerarPDF(o: Ordem) {
    const cliente = clientes.find((c) => c.id === o.id_cliente);
    PDFGenerator.gerar({
      ordem: o,
      cliente,
      statusLabel:
        STATUS_OPTIONS.find((s) => s.key === o.status)?.label || o.status,
      prioridadeLabel:
        PRIORIDADE_OPTIONS.find((p) => p.key === o.prioridade)?.label ||
        o.prioridade,
      formaPagamentoLabel:
        FORMA_PAGAMENTO.find((f) => f.key === o.forma_pagamento)?.label ||
        o.forma_pagamento,
    });
  }

  // Verificação de loading/erro
  if (loading && !isOpen) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" label="Carregando ordens..." />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <p className="text-danger">Erro: {erro}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Bloqueio de visualização
  if (!canViewOrdens) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between lg:items-end mb-6">
          <div>
            <h1 className="lg:text-3xl text-xl text-nowrap font-bold">
              Ordens de Serviço
            </h1>
            <p className="text-sm text-default-500">
              Gestão completa das ordens
            </p>
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
              Você não possui permissão para visualizar ordens de serviço.
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
      <div className="flex justify-between lg:items-end mb-6">
        <div>
          <h1 className="lg:text-3xl text-xl text-nowrap font-bold">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-default-500">Gestão completa das ordens</p>
        </div>
        <DataHoje />
      </div>

      {/* Estatísticas - sempre visível se pode ver ordens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="p-4 flex gap-3 items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-default-500">Total</p>
              <p className="text-2xl font-bold text-primary-600 text-center">
                {totalOrdens}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 flex gap-3 items-center">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-default-500">Valor (Somatório)</p>
              <p className="text-xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalValor)}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 flex gap-3 items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-default-500">Concluídas</p>
              <p className="text-2xl font-bold text-blue-600 text-center">
                {concluidas}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 flex gap-3 items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-default-500">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600 text-center">
                {pendentes}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Busca e filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Buscar por #ID, modelo, cliente, técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
            className="flex-1"
          />
          <Button
            variant={showFilters ? "solid" : "flat"}
            color={showFilters ? "primary" : "default"}
            startContent={<FunnelIcon className="w-4 h-4" />}
            onPress={() => setShowFilters((p) => !p)}
          >
            Filtros
          </Button>
          {(searchTerm ||
            Object.entries(filters).some(
              ([k, v]) =>
                !["orderBy", "orderDirection"].includes(k) &&
                v !== "" &&
                v !== null
            )) && (
            <Button variant="flat" color="warning" onPress={clearFilters}>
              Limpar
            </Button>
          )}
          {canCreateOrdens && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={safeOpenNew}
            >
              Nova OS
            </Button>
          )}
        </div>

        {showFilters && (
          <Card>
            <CardBody className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {/* Ordenação */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <div className="flex gap-2">
                    <Select
                      selectedKeys={[filters.orderBy]}
                      onSelectionChange={(keys) =>
                        setFilters((prev) => ({
                          ...prev,
                          orderBy: Array.from(keys)[0] as string,
                        }))
                      }
                      size="sm"
                    >
                      {ORDER_OPTIONS.map((o) => (
                        <SelectItem key={o.key}>{o.label}</SelectItem>
                      ))}
                    </Select>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          orderDirection:
                            prev.orderDirection === "asc" ? "desc" : "asc",
                        }))
                      }
                    >
                      {filters.orderDirection === "asc" ? (
                        <ArrowUpIcon className="w-4 h-4" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    placeholder="Todos"
                    selectedKeys={filters.status ? [filters.status] : []}
                    onSelectionChange={(keys) =>
                      setFilters((p) => ({
                        ...p,
                        status: Array.from(keys)[0] as string,
                      }))
                    }
                    size="sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.key}>{s.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Prioridade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select
                    placeholder="Todas"
                    selectedKeys={
                      filters.prioridade ? [filters.prioridade] : []
                    }
                    onSelectionChange={(keys) =>
                      setFilters((p) => ({
                        ...p,
                        prioridade: Array.from(keys)[0] as string,
                      }))
                    }
                    size="sm"
                  >
                    {PRIORIDADE_OPTIONS.map((p) => (
                      <SelectItem key={p.key}>{p.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Garantia */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Garantia</label>
                  <Select
                    placeholder="Todas"
                    selectedKeys={filters.garantia ? [filters.garantia] : []}
                    onSelectionChange={(keys) =>
                      setFilters((p) => ({
                        ...p,
                        garantia: Array.from(keys)[0] as string,
                      }))
                    }
                    size="sm"
                  >
                    <SelectItem key="sim">Com garantia</SelectItem>
                    <SelectItem key="nao">Sem garantia</SelectItem>
                  </Select>
                </div>

                {/* Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Select
                    placeholder="Todos"
                    selectedKeys={filters.cliente ? [filters.cliente] : []}
                    onSelectionChange={(keys) =>
                      setFilters((p) => ({
                        ...p,
                        cliente: Array.from(keys)[0] as string,
                      }))
                    }
                    size="sm"
                  >
                    {clientes.map((c) => (
                      <SelectItem key={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Valor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor (R$)</label>
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      placeholder="Min"
                      value={filters.valorMin}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          valorMin: currencyMask(e.target.value),
                        }))
                      }
                    />
                    <Input
                      size="sm"
                      placeholder="Max"
                      value={filters.valorMax}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          valorMax: currencyMask(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Entrada De / Até */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entrada (De)</label>
                  <Input
                    size="sm"
                    type="date"
                    value={filters.dataEntradaDe}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        dataEntradaDe: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Entrada (Até)</label>
                  <Input
                    size="sm"
                    type="date"
                    value={filters.dataEntradaAte}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        dataEntradaAte: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Prazo De / Até */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prazo (De)</label>
                  <Input
                    size="sm"
                    type="date"
                    value={filters.dataPrazoDe}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        dataPrazoDe: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prazo (Até)</label>
                  <Input
                    size="sm"
                    type="date"
                    value={filters.dataPrazoAte}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        dataPrazoAte: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Info paginação */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-default-500">
          Mostrando {filtered.length === 0 ? 0 : start + 1} a{" "}
          {Math.min(end, filtered.length)} de {filtered.length} OS
          {(searchTerm ||
            Object.entries(filters).some(
              ([k, v]) => !["orderBy", "orderDirection"].includes(k) && v !== ""
            )) &&
            ` (filtrado de ${ordens.length})`}
        </p>
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

      {/* Lista */}
      {loading && !isOpen ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((o) => (
            <Card key={o.id} className="w-full">
              <CardBody>
                <PhotoCarousel
                  photos={o.fotourl || []}
                  altBase={`OS ${o.id}`}
                  className="w-full bg-default-100 h-56 rounded-xl"
                />
                <div className="flex items-center justify-between mb-3 mt-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        OS #{o.id} - {o.modelo}
                      </h3>
                      <p className="text-small text-default-500">
                        Cliente: {getClienteNome(o.id_cliente) || "—"}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={statusColor(o.status)}
                        >
                          {
                            STATUS_OPTIONS.find((s) => s.key === o.status)
                              ?.label
                          }
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={prioridadeColor(o.prioridade)}
                        >
                          {
                            PRIORIDADE_OPTIONS.find(
                              (p) => p.key === o.prioridade
                            )?.label
                          }
                        </Chip>
                        {o.garantia && (
                          <Chip size="sm" variant="flat" color="success">
                            Garantia
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>

                  {(canPdfOrdens || canEditOrdens || canDeleteOrdens) && (
                    <div className="flex gap-2">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            startContent={
                              <EllipsisVerticalIcon className="w-5 h-5" />
                            }
                          />
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownSection title="Ações">
                            {canPdfOrdens ? (
                              <DropdownItem
                                key={`pdf-${o.id}`}
                                onPress={() => safeGerarPDF(o)}
                                startContent={
                                  <DocumentArrowDownIcon className="w-5 h-5 text-secondary" />
                                }
                              >
                                Gerar PDF
                              </DropdownItem>
                            ) : null}

                            {canEditOrdens ? (
                              <DropdownItem
                                key={`edit-${o.id}`}
                                onPress={() => safeEdit(o)}
                                startContent={
                                  <PencilIcon className="w-5 h-5 text-primary" />
                                }
                              >
                                Editar
                              </DropdownItem>
                            ) : null}

                            {canDeleteOrdens ? (
                              <DropdownItem
                                key={`delete-${o.id}`}
                                onPress={() => safeHandleDelete(o.id)}
                                className="text-danger"
                                startContent={
                                  <TrashIcon className="w-5 h-5 text-danger" />
                                }
                              >
                                Deletar
                              </DropdownItem>
                            ) : null}
                          </DropdownSection>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  )}
                </div>

                <Divider className="my-3" />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-default-400" />
                    <span>
                      Entrada:{" "}
                      {o.entrada
                        ? new Date(o.entrada).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  {o.prazo && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-default-400" />
                      <span>
                        Prazo: {new Date(o.prazo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {o.valor ? (
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-default-400" />
                      <span>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(o.valor)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-default-400" />
                      <span>—</span>
                    </div>
                  )}
                  {o.tecnico_responsavel && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-default-400" />
                      <span>{o.tecnico_responsavel}</span>
                    </div>
                  )}
                </div>

                {o.defeito && (
                  <div className="mt-3 text-sm">
                    <strong>Defeito:</strong> {o.defeito}
                  </div>
                )}
                {o.diagnostico && (
                  <div className="mt-2 text-sm">
                    <strong>Diagnóstico:</strong> {o.diagnostico}
                  </div>
                )}
                {o.observacoes && (
                  <div className="mt-2 text-sm text-default-500">
                    <strong>Obs:</strong> {o.observacoes}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-8 text-default-500 col-span-full">
              Nenhuma OS encontrada
            </div>
          )}
        </div>
      )}

      {/* Paginação inferior */}
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

      {/* Modal - só abre se tiver permissão */}
      {(canCreateOrdens || canEditOrdens) && (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="3xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>{isEditing ? "Editar OS" : "Nova OS"}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Modelo / Equipamento *"
                  value={formData.modelo || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, modelo: e.target.value }))
                  }
                  isRequired
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cor"
                    value={formData.cor || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, cor: e.target.value }))
                    }
                  />
                  <Input
                    label="Técnico Responsável"
                    value={formData.tecnico_responsavel || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        tecnico_responsavel: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Data Entrada"
                    type="date"
                    value={formData.entrada || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, entrada: e.target.value }))
                    }
                  />
                  <Input
                    label="Prazo"
                    type="date"
                    value={formData.prazo || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, prazo: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Data Saída"
                    type="date"
                    value={formData.saida || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, saida: e.target.value }))
                    }
                  />
                  <Input
                    label="Valor"
                    placeholder="R$ 0,00"
                    value={valorInput}
                    onChange={(e) =>
                      setValorInput(currencyMask(e.target.value))
                    }
                    startContent={
                      <CurrencyDollarIcon className="w-4 h-4 text-default-400" />
                    }
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Select
                    label="Status"
                    selectedKeys={[formData.status || "aguardando"]}
                    onSelectionChange={(keys) =>
                      setFormData((p) => ({
                        ...p,
                        status: Array.from(keys)[0] as string,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.key}>{s.label}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Prioridade"
                    selectedKeys={[formData.prioridade || "normal"]}
                    onSelectionChange={(keys) =>
                      setFormData((p) => ({
                        ...p,
                        prioridade: Array.from(keys)[0] as string,
                      }))
                    }
                  >
                    {PRIORIDADE_OPTIONS.map((p) => (
                      <SelectItem key={p.key}>{p.label}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Forma Pagamento"
                    selectedKeys={
                      formData.forma_pagamento ? [formData.forma_pagamento] : []
                    }
                    onSelectionChange={(keys) =>
                      setFormData((p) => ({
                        ...p,
                        forma_pagamento: Array.from(keys)[0] as string,
                      }))
                    }
                    placeholder="Selecione"
                  >
                    {FORMA_PAGAMENTO.map((f) => (
                      <SelectItem key={f.key}>{f.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Autocomplete
                    label="Cliente"
                    placeholder="Digite para buscar"
                    selectedKey={
                      formData.id_cliente
                        ? formData.id_cliente.toString()
                        : undefined
                    }
                    defaultItems={clientes}
                    onSelectionChange={(key) =>
                      setFormData((p) => ({
                        ...p,
                        id_cliente: key ? parseInt(key as string) : undefined,
                      }))
                    }
                    allowsCustomValue={false}
                    isClearable
                  >
                    {(item: any) => (
                      <AutocompleteItem key={item.id.toString()}>
                        {item.nome}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                  <Select
                    label="Garantia"
                    selectedKeys={[formData.garantia ? "sim" : "nao"]}
                    onSelectionChange={(keys) =>
                      setFormData((p) => ({
                        ...p,
                        garantia: Array.from(keys)[0] === "sim",
                      }))
                    }
                  >
                    <SelectItem key="sim">Sim</SelectItem>
                    <SelectItem key="nao">Não</SelectItem>
                  </Select>
                </div>

                {formData.garantia && (
                  <Input
                    label="Período Garantia"
                    placeholder="Ex: 90 dias"
                    value={formData.periodo_garantia || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        periodo_garantia: e.target.value,
                      }))
                    }
                  />
                )}

                <Textarea
                  label="Defeito Relatado"
                  minRows={2}
                  value={formData.defeito || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, defeito: e.target.value }))
                  }
                />
                <Textarea
                  label="Diagnóstico"
                  minRows={2}
                  value={formData.diagnostico || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, diagnostico: e.target.value }))
                  }
                />
                <Textarea
                  label="Observações"
                  minRows={2}
                  value={formData.observacoes || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, observacoes: e.target.value }))
                  }
                />

                {/* Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adicionar Fotos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>

                {/* Fotos atuais */}
                {currentFotos.length > 0 && (
                  <ModalPhotoCarousel
                    photos={currentFotos}
                    onRemove={removeCurrentPhoto}
                    title="Fotos Atuais"
                  />
                )}

                {/* Novas fotos */}
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
