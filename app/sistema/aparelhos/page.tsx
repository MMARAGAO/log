"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Autocomplete,
  AutocompleteItem,
  Image,
  Pagination,
} from "@heroui/react";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  CubeIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  DocumentIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  FunnelIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import type {
  EstoqueAparelho,
  VendaAparelho,
  Cliente,
  Usuario,
  Loja,
  StatusAparelho,
  FormaPagamento,
  StatusVenda,
} from "@/types/aparelhos";
import {
  formatarIMEI,
  validarIMEI,
  consultarIMEI,
  calcularValorFinal,
  formatarMoeda,
  formatarDataHora,
} from "@/utils/aparelhos";
import {
  DocumentCurrencyDollarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  IMEIScannerModal,
  LogsModal,
  CadastroVendaModal,
  LogAtividade,
} from "@/components/aparelhos";

export default function AparelhosPage() {
  const [activeTab, setActiveTab] = useState("estoque");
  const [estoque, setEstoque] = useState<EstoqueAparelho[]>([]);
  const [vendas, setVendas] = useState<VendaAparelho[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "cadastro" | "venda" | "detalhes" | "detalhes-venda" | "editar-venda"
  >("cadastro");
  const [selectedAparelho, setSelectedAparelho] =
    useState<EstoqueAparelho | null>(null);
  const [selectedVenda, setSelectedVenda] = useState<VendaAparelho | null>(
    null
  );

  // Paginação
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Form States - Cadastro
  const [formCadastro, setFormCadastro] = useState<Partial<EstoqueAparelho>>({
    marca: "",
    modelo: "",
    imei: "",
    serial: "",
    cor: "",
    capacidade: "",
    estado: "usado",
    status: "disponivel",
    bateria: undefined,
    preco_compra: undefined,
    preco_venda: 0,
    garantia_fornecedor_meses: 0,
    loja_id: undefined,
    fornecedor_id: undefined,
    observacoes: "",
    acessorios: [],
    defeitos: [],
    fotos: [],
  });

  // Form States - Venda
  const [formVenda, setFormVenda] = useState<Partial<VendaAparelho>>({
    cliente_nome: "",
    valor_aparelho: 0,
    desconto: 0,
    valor_final: 0,
    forma_pagamento: "pix",
    parcelas: 1,
    status: "pendente",
    garantia_meses: 3,
    aparelho_estado: "usado",
    aparelho_acessorios: [],
    aparelho_defeitos: [],
    aparelho_fotos: [],
    checklist_fotos: [],
  });

  // Upload de fotos
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Carrossel de fotos
  const [carouselIndex, setCarouselIndex] = useState<{ [key: number]: number }>(
    {}
  );
  const [modalCarouselIndex, setModalCarouselIndex] = useState(0);
  const [formFotosCarouselIndex, setFormFotosCarouselIndex] = useState(0); // Para fotos do formulário de cadastro
  const [checklistFotosCarouselIndex, setChecklistFotosCarouselIndex] =
    useState(0); // Para fotos do checklist
  const [vendaFotosCarouselIndex, setVendaFotosCarouselIndex] = useState(0); // Para fotos do aparelho na venda

  // Estados para Logs de Atividades
  const [logs, setLogs] = useState<LogAtividade[]>([]);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Estados para Leitor de IMEI com Câmera
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  useEffect(() => {
    loadData();
    checkTableExists();
  }, []);

  // Funções do carrossel de fotos
  const handlePrevPhoto = (itemId: number, totalFotos: number) => {
    setCarouselIndex((prev) => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) - 1 + totalFotos) % totalFotos,
    }));
  };

  const handleNextPhoto = (itemId: number, totalFotos: number) => {
    setCarouselIndex((prev) => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % totalFotos,
    }));
  };

  const handlePrevModalPhoto = (totalFotos: number) => {
    setModalCarouselIndex((prev) => (prev - 1 + totalFotos) % totalFotos);
  };

  const handleNextModalPhoto = (totalFotos: number) => {
    setModalCarouselIndex((prev) => (prev + 1) % totalFotos);
  };

  // Função para adicionar log de atividade
  const adicionarLog = (
    tipo: LogAtividade["tipo"],
    acao: string,
    detalhes: string,
    dados?: { cliente?: string; usuario?: string; extra?: any }
  ) => {
    const novoLog: LogAtividade = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo,
      acao,
      detalhes,
      cliente: dados?.cliente,
      usuario: dados?.usuario,
      timestamp: new Date(),
      dados: dados?.extra,
    };

    setLogs((prev) => [novoLog, ...prev]); // Adiciona no início para mostrar os mais recentes primeiro
    console.log(`📝 LOG [${tipo}]:`, acao, detalhes);
  };

  // Função para abrir o modal de scanner IMEI
  const abrirCameraIMEI = () => {
    console.log("🔵 Abrindo modal de câmera");
    setIsCameraModalOpen(true);
  };

  // Função callback quando o IMEI é detectado
  const handleIMEIDetected = async (imei: string) => {
    console.log("📱 IMEI detectado:", imei);

    // Consultar informações do IMEI online (opcional)
    toast.loading("Consultando base de dados do IMEI...", {
      id: "imei-lookup",
    });

    try {
      const infoIMEI = await consultarIMEI(imei);
      console.log("📡 Informações do IMEI:", infoIMEI);

      // Preencher campos automaticamente
      setFormCadastro({
        ...formCadastro,
        imei: imei,
        marca: infoIMEI.marca || formCadastro.marca,
        modelo: infoIMEI.modelo || formCadastro.modelo,
      });

      // Mostrar resultado
      if (infoIMEI.marca && infoIMEI.modelo) {
        toast.success(
          `IMEI detectado: ${formatarIMEI(imei)}\n${infoIMEI.marca} ${infoIMEI.modelo}`,
          {
            id: "imei-lookup",
            duration: 3000,
          }
        );
      } else {
        toast.success(`IMEI detectado: ${formatarIMEI(imei)}`, {
          id: "imei-lookup",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Erro ao consultar IMEI:", error);
      // Mesmo com erro, preenche o IMEI
      setFormCadastro({
        ...formCadastro,
        imei: imei,
      });
      toast.success(`IMEI detectado: ${formatarIMEI(imei)}`, {
        id: "imei-lookup",
        duration: 2000,
      });
    }
  };

  const checkTableExists = async () => {
    try {
      const { data, error } = await supabase
        .from("estoque_aparelhos")
        .select("count")
        .limit(1);

      if (error) {
        console.error(
          "❌ Tabela estoque_aparelhos NÃO existe ou há erro de permissão:",
          error
        );
        toast.error(
          "ERRO: Tabela estoque_aparelhos não encontrada! Execute o script SQL primeiro."
        );
      } else {
        console.log("✅ Tabela estoque_aparelhos existe e está acessível");
      }
    } catch (error) {
      console.error("Erro ao verificar tabela:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEstoque(),
        loadVendas(),
        loadClientes(),
        loadUsuarios(),
        loadLojas(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadEstoque = async () => {
    console.log("📦 Carregando estoque...");
    const { data, error } = await supabase
      .from("estoque_aparelhos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao carregar estoque:", error);
      toast.error(`Erro ao carregar estoque: ${error.message}`);
      return;
    }
    console.log("✅ Estoque carregado:", data);
    console.log("🖼️ Verificando fotos no primeiro item:", data?.[0]?.fotos);
    setEstoque(data || []);
  };

  const loadVendas = async () => {
    const { data, error } = await supabase
      .from("vendas_aparelhos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar vendas:", error);
      return;
    }
    setVendas(data || []);
  };

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, email, telefone, doc")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar clientes:", error);
      return;
    }
    setClientes(data || []);
  };

  const loadUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("uuid, nome, email, nickname")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar usuários:", error);
      return;
    }
    setUsuarios(data || []);
  };

  const loadLojas = async () => {
    const { data, error } = await supabase
      .from("lojas")
      .select("id, nome, endereco, telefone")
      .order("nome");

    if (error) {
      console.error("Erro ao carregar lojas:", error);
      return;
    }
    setLojas(data || []);
  };

  const handleUploadFotos = async (
    files: FileList,
    tipo: "aparelho" | "termo" | "checklist"
  ) => {
    setUploadingPhotos(true);
    const urls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${tipo}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("vendas-aparelhos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("vendas-aparelhos").getPublicUrl(filePath);

        urls.push(publicUrl);
      }

      toast.success(`${files.length} foto(s) enviada(s) com sucesso!`);
      return urls;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload das fotos");
      return [];
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleCadastrarAparelho = async () => {
    console.log("🚀 Iniciando cadastro de aparelho...", formCadastro);

    if (
      !formCadastro.marca ||
      !formCadastro.modelo ||
      !formCadastro.preco_venda
    ) {
      toast.error("Preencha os campos obrigatórios");
      console.log("❌ ERRO: Campos obrigatórios não preenchidos!");
      return;
    }

    // Validar IMEI apenas se fornecido e se for uma string válida
    if (formCadastro.imei && formCadastro.imei.length > 0) {
      const imeiValido = validarIMEI(formCadastro.imei);
      console.log("Validação IMEI:", formCadastro.imei, "Válido:", imeiValido);
      if (!imeiValido) {
        toast.error("IMEI inválido");
        return;
      }
    }

    setLoading(true);
    console.log("⏳ Loading ativado");

    try {
      console.log("🔐 Buscando usuário autenticado...");
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        console.error("❌ Erro ao buscar usuário:", userError);
        throw new Error("Erro ao buscar usuário autenticado");
      }

      console.log("✅ Usuário autenticado:", userData.user?.id);

      const aparelho = {
        ...formCadastro,
        usuario_cadastro_id: userData.user?.id,
      };

      console.log("📦 Dados para salvar:", aparelho);
      console.log("🖼️ Fotos que serão salvas:", aparelho.fotos);

      if (selectedAparelho) {
        // Atualizar
        console.log("📝 Atualizando aparelho ID:", selectedAparelho.id);
        const { data, error } = await supabase
          .from("estoque_aparelhos")
          .update(aparelho)
          .eq("id", selectedAparelho.id)
          .select();

        console.log("✅ Resultado da atualização:", { data, error });

        if (error) {
          console.error("❌ Erro na atualização:", error);
          throw error;
        }
        toast.success("Aparelho atualizado com sucesso!");
      } else {
        // Criar
        console.log("➕ Inserindo novo aparelho...");
        const { data, error } = await supabase
          .from("estoque_aparelhos")
          .insert(aparelho)
          .select();

        console.log("✅ Resultado da inserção:", { data, error });

        if (error) {
          console.error("❌ Erro na inserção:", error);
          throw error;
        }

        // Adicionar log de cadastro
        adicionarLog(
          "cadastro",
          "Aparelho Cadastrado",
          `${formCadastro.marca} ${formCadastro.modelo} adicionado ao estoque`,
          {
            extra: {
              marca: formCadastro.marca,
              modelo: formCadastro.modelo,
              imei: formCadastro.imei,
            },
          }
        );

        toast.success("Aparelho cadastrado com sucesso!");
      }

      console.log("🔄 Recarregando estoque...");
      await loadEstoque();
      console.log("✅ Estoque recarregado!");

      console.log("❌ Fechando modal...");
      handleCloseModal();
      console.log("✅ Modal fechado!");
    } catch (error: any) {
      console.error("❌ Erro completo ao cadastrar aparelho:", error);
      console.error("Stack trace:", error.stack);

      // Log de erro
      adicionarLog(
        "erro",
        "Erro ao Cadastrar Aparelho",
        error.message || "Erro desconhecido",
        { extra: { marca: formCadastro.marca, modelo: formCadastro.modelo } }
      );

      toast.error(error.message || "Erro ao cadastrar aparelho");
    } finally {
      setLoading(false);
    }
  };

  const handleVenderAparelho = async () => {
    if (!formVenda.cliente_nome || !formVenda.valor_aparelho) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const venda = {
        ...formVenda,
        vendedor_id: userData.user?.id,
        estoque_aparelho_id: selectedAparelho?.id,
      };

      // Inserir a venda e retornar o UUID criado
      const { data: vendaData, error } = await supabase
        .from("vendas_aparelhos")
        .insert(venda)
        .select("uuid")
        .single();

      if (error) throw error;

      console.log("✅ Venda criada com UUID:", vendaData?.uuid);

      // Atualizar o aparelho para marcar como vendido
      if (selectedAparelho?.id && vendaData?.uuid) {
        console.log("🔄 Atualizando aparelho ID:", selectedAparelho.id);
        const { error: updateError } = await supabase
          .from("estoque_aparelhos")
          .update({
            venda_id: vendaData.uuid,
            status: "vendido",
          })
          .eq("id", selectedAparelho.id);

        if (updateError) {
          console.error(
            "❌ Erro ao atualizar status do aparelho:",
            updateError
          );
          toast.error(
            "Venda criada, mas não foi possível atualizar o status do aparelho"
          );
        } else {
          console.log(
            "✅ Aparelho atualizado com sucesso para status: vendido"
          );
          // Atualizar state local do aparelho
          setEstoque((prevEstoque) =>
            prevEstoque.map((a) =>
              a.id === selectedAparelho.id
                ? { ...a, status: "vendido", venda_id: vendaData.uuid }
                : a
            )
          );
        }
      }

      // Adicionar log de venda
      adicionarLog(
        "venda",
        "Venda Realizada",
        `Aparelho ${selectedAparelho?.marca} ${selectedAparelho?.modelo} vendido`,
        {
          cliente: formVenda.cliente_nome,
          extra: {
            aparelho: `${selectedAparelho?.marca} ${selectedAparelho?.modelo}`,
            valor: formVenda.valor_aparelho,
            forma_pagamento: formVenda.forma_pagamento,
          },
        }
      );

      toast.success("Venda realizada com sucesso!");
      // Atualizar apenas as vendas, o estoque já foi atualizado localmente
      await loadVendas();
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao realizar venda:", error);

      // Log de erro
      adicionarLog(
        "erro",
        "Erro ao Realizar Venda",
        error.message || "Erro desconhecido",
        { cliente: formVenda.cliente_nome }
      );

      toast.error(error.message || "Erro ao realizar venda");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAparelho = async (id: number) => {
    if (!confirm("Deseja realmente excluir este aparelho?")) return;

    setLoading(true);
    try {
      // Verificar se o aparelho está em alguma venda
      const { data: vendas, error: checkError } = await supabase
        .from("vendas_aparelhos")
        .select("uuid")
        .eq("estoque_aparelho_id", id)
        .limit(1);

      if (checkError) throw checkError;

      if (vendas && vendas.length > 0) {
        toast.error(
          "Não é possível excluir este aparelho pois ele está vinculado a uma ou mais vendas. Exclua as vendas primeiro.",
          { duration: 5000 }
        );
        setLoading(false);
        return;
      }

      // Deletar o aparelho
      const { error } = await supabase
        .from("estoque_aparelhos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Atualizar state removendo o aparelho localmente (mais rápido que recarregar)
      setEstoque((prevEstoque) => prevEstoque.filter((a) => a.id !== id));

      toast.success("Aparelho excluído com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir aparelho:", error);

      // Tratamento específico para erro 409 (conflito)
      if (error.code === "23503" || error.message?.includes("foreign key")) {
        toast.error(
          "Este aparelho está vinculado a outros registros e não pode ser excluído. Remova as dependências primeiro.",
          { duration: 5000 }
        );
      } else {
        toast.error(error.message || "Erro ao excluir aparelho");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (
    type: "cadastro" | "venda" | "detalhes",
    aparelho?: EstoqueAparelho
  ) => {
    setModalType(type);
    setSelectedAparelho(aparelho || null);
    setModalCarouselIndex(0); // Resetar carrossel do modal
    setFormFotosCarouselIndex(0); // Resetar carrossel de fotos do formulário
    setChecklistFotosCarouselIndex(0); // Resetar carrossel de fotos do checklist

    if (type === "cadastro" && aparelho) {
      setFormCadastro(aparelho);
    } else if (type === "venda" && aparelho) {
      setFormVenda({
        ...formVenda,
        aparelho_marca: aparelho.marca,
        aparelho_modelo: aparelho.modelo,
        aparelho_imei: aparelho.imei,
        aparelho_cor: aparelho.cor,
        aparelho_capacidade: aparelho.capacidade,
        aparelho_estado: aparelho.estado,
        aparelho_bateria: aparelho.bateria,
        valor_aparelho: aparelho.preco_venda,
        valor_final: aparelho.preco_venda,
        aparelho_fotos: aparelho.fotos || [],
      });
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAparelho(null);
    setFormCadastro({
      marca: "",
      modelo: "",
      imei: "",
      serial: "",
      cor: "",
      capacidade: "",
      estado: "usado",
      status: "disponivel",
      bateria: undefined,
      preco_compra: undefined,
      preco_venda: 0,
      garantia_fornecedor_meses: 0,
      loja_id: undefined,
      fornecedor_id: undefined,
      observacoes: "",
      acessorios: [],
      defeitos: [],
      fotos: [],
    });
    setFormVenda({
      cliente_nome: "",
      valor_aparelho: 0,
      desconto: 0,
      valor_final: 0,
      forma_pagamento: "pix",
      parcelas: 1,
      status: "pendente",
      garantia_meses: 3,
      aparelho_estado: "usado",
      aparelho_acessorios: [],
      aparelho_defeitos: [],
      aparelho_fotos: [],
      checklist_fotos: [],
    });
  };

  const handleOpenDetalhesVenda = (venda: VendaAparelho) => {
    setSelectedVenda(venda);
    setModalType("detalhes-venda");
    setModalCarouselIndex(0); // Resetar carrossel
    setVendaFotosCarouselIndex(0); // Resetar carrossel de fotos da venda
    setIsModalOpen(true);
  };

  const handleOpenEditarVenda = (venda: VendaAparelho) => {
    setSelectedVenda(venda);
    setFormVenda(venda);
    setModalType("editar-venda");
    setChecklistFotosCarouselIndex(0); // Resetar carrossel de checklist
    setIsModalOpen(true);
  };

  const handleSalvarEdicaoVenda = async () => {
    if (
      !selectedVenda ||
      !formVenda.cliente_nome ||
      !formVenda.valor_aparelho
    ) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("vendas_aparelhos")
        .update(formVenda)
        .eq("uuid", selectedVenda.uuid);

      if (error) throw error;

      // Atualizar state localmente (mais rápido que recarregar)
      setVendas((prevVendas) =>
        prevVendas.map((v) =>
          v.uuid === selectedVenda.uuid ? { ...v, ...formVenda } : v
        )
      );

      // Adicionar log de edição
      adicionarLog("edicao", "Venda Atualizada", `Dados da venda editados`, {
        cliente: formVenda.cliente_nome,
        extra: { uuid: selectedVenda.uuid },
      });

      toast.success("Venda atualizada com sucesso!");
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao atualizar venda:", error);

      // Log de erro
      adicionarLog(
        "erro",
        "Erro ao Atualizar Venda",
        error.message || "Erro desconhecido",
        { cliente: formVenda.cliente_nome }
      );

      toast.error(error.message || "Erro ao atualizar venda");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenda = async (uuid: string) => {
    console.log("🗑️ Iniciando exclusão da venda:", uuid);
    if (!confirm("Deseja realmente excluir esta venda?")) {
      console.log("❌ Exclusão cancelada pelo usuário");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Verificando dependências...");
      // Fazer todas as verificações em paralelo para melhor performance
      const [
        { data: aparelhos, error: checkAparelho },
        { data: caixaMovimentacoes, error: checkCaixa },
      ] = await Promise.all([
        supabase
          .from("estoque_aparelhos")
          .select("id")
          .eq("venda_id", uuid)
          .limit(1),
        supabase
          .from("caixa_aparelhos_movimentacoes")
          .select("id")
          .eq("venda_aparelho_uuid", uuid)
          .limit(1),
      ]);

      console.log("📊 Resultado das verificações:", {
        aparelhos,
        caixaMovimentacoes,
      });

      // Verificar erros nas consultas
      if (checkAparelho) {
        console.error("❌ Erro ao verificar aparelhos:", checkAparelho);
        throw checkAparelho;
      }
      if (checkCaixa) {
        console.error("❌ Erro ao verificar caixa:", checkCaixa);
        throw checkCaixa;
      }

      // Verificar dependências
      if (aparelhos && aparelhos.length > 0) {
        console.warn(
          "⚠️ Aparelho vinculado encontrado, limpando vínculo automaticamente...",
          aparelhos
        );

        // Limpar o vínculo do aparelho automaticamente
        const { error: updateError } = await supabase
          .from("estoque_aparelhos")
          .update({ venda_id: null, status: "disponivel" })
          .eq("venda_id", uuid);

        if (updateError) {
          console.error("❌ Erro ao limpar vínculo do aparelho:", updateError);
          toast.error("Erro ao limpar vínculo do aparelho. Tente novamente.", {
            duration: 5000,
          });
          setLoading(false);
          return;
        }

        console.log("✅ Vínculo do aparelho limpo com sucesso!");
      }

      if (caixaMovimentacoes && caixaMovimentacoes.length > 0) {
        console.warn(
          "⚠️ Venda bloqueada: movimentações de caixa",
          caixaMovimentacoes
        );
        toast.error(
          "Não é possível excluir esta venda pois ela está vinculada a movimentações de caixa. Remova as movimentações primeiro.",
          { duration: 5000 }
        );
        setLoading(false);
        return;
      }

      console.log(
        "✅ Nenhuma dependência encontrada, prosseguindo com exclusão..."
      );
      // Deletar a venda
      const { error } = await supabase
        .from("vendas_aparelhos")
        .delete()
        .eq("uuid", uuid);

      if (error) {
        console.error("❌ Erro ao deletar venda:", error);
        throw error;
      }

      console.log("✅ Venda deletada do banco com sucesso!");
      // Atualizar state removendo a venda localmente (mais rápido que recarregar)
      const vendaDeletada = vendas.find((v) => v.uuid === uuid);
      setVendas((prevVendas) => prevVendas.filter((v) => v.uuid !== uuid));
      console.log("✅ State atualizado!");

      // Adicionar log de exclusão
      adicionarLog("exclusao", "Venda Excluída", `Venda removida do sistema`, {
        cliente: vendaDeletada?.cliente_nome,
        extra: { uuid },
      });

      toast.success("Venda excluída com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir venda:", error);

      // Log de erro
      adicionarLog(
        "erro",
        "Erro ao Excluir Venda",
        error.message || "Erro desconhecido",
        { extra: { uuid } }
      );

      // Tratamento específico para erro de chave estrangeira
      if (error.code === "23503") {
        if (error.details?.includes("estoque_aparelhos")) {
          toast.error(
            "Esta venda está vinculada a um aparelho no estoque. Atualize ou remova o vínculo do aparelho primeiro.",
            { duration: 5000 }
          );
        } else if (error.details?.includes("caixa_aparelhos")) {
          toast.error(
            "Esta venda está vinculada a movimentações de caixa. Remova as movimentações primeiro.",
            { duration: 5000 }
          );
        } else {
          toast.error(
            "Esta venda está vinculada a outros registros e não pode ser excluída. Remova as dependências primeiro.",
            { duration: 5000 }
          );
        }
      } else {
        toast.error(error.message || "Erro ao excluir venda");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredEstoque = estoque.filter(
    (item) =>
      item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.imei?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedEstoque = filteredEstoque.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      disponivel: "success",
      reservado: "warning",
      vendido: "default",
      em_reparo: "primary",
      defeito: "danger",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      disponivel: "Disponível",
      reservado: "Reservado",
      vendido: "Vendido",
      em_reparo: "Em Reparo",
      defeito: "Defeito",
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Aparelhos</h1>
          <p className="text-gray-600 mt-1">
            Cadastro, estoque e vendas de aparelhos celulares
          </p>
        </div>
        <div className="lg:flex lg:items-center lg:gap-4 gap-2 flex flex-col">
          <Button
            color="secondary"
            variant="flat"
            startContent={<ClipboardDocumentListIcon className="w-5 h-5" />}
            onPress={() => setIsLogsModalOpen(true)}
          >
            Ver Logs ({logs.length})
          </Button>
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() => handleOpenModal("cadastro")}
          >
            Novo Aparelho
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircleIcon className="text-2xl text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold">
                {estoque.filter((e) => e.status === "disponivel").length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-3 bg-warning-100 rounded-lg">
              <ExclamationTriangleIcon className="text-2xl text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reservados</p>
              <p className="text-2xl font-bold">
                {estoque.filter((e) => e.status === "reservado").length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <ShoppingCartIcon className="text-2xl text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendidos</p>
              <p className="text-2xl font-bold">
                {estoque.filter((e) => e.status === "vendido").length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-3">
            <div className="p-3 bg-success-100 rounded-lg">
              <DocumentCurrencyDollarIcon className="text-2xl text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Estoque</p>
              <p className="text-2xl font-bold">
                {formatarMoeda(
                  estoque
                    .filter((e) => e.status === "disponivel")
                    .reduce((acc, e) => acc + (e.preco_venda || 0), 0)
                )}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-4"
      >
        <Tab key="estoque" title="Estoque" />
        <Tab key="vendas" title="Vendas" />
      </Tabs>

      {/* Busca */}
      <div className="mb-4">
        <Input
          placeholder="Buscar por marca, modelo ou IMEI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<MagnifyingGlassIcon className="w-5 h-5" />}
          isClearable
          onClear={() => setSearchTerm("")}
        />
      </div>

      {/* Grid de Cards - Estoque */}
      {activeTab === "estoque" && (
        <>
          {paginatedEstoque.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <DevicePhoneMobileIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Nenhum aparelho cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEstoque.map((item) => {
                console.log(`🖼️ Card ${item.id}: fotos =`, item.fotos);
                return (
                  <Card key={item.id} className="w-full">
                    <CardBody className="p-4">
                      {/* Imagem ou Placeholder com Carrossel */}
                      <div className="relative w-full h-48 mb-3 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.fotos && item.fotos.length > 0 ? (
                          <>
                            <img
                              src={item.fotos[carouselIndex[item.id!] || 0]}
                              alt={`${item.marca} ${item.modelo}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(
                                  `❌ Erro ao carregar imagem do card ${item.id}:`,
                                  item.fotos?.[carouselIndex[item.id!] || 0]
                                );
                                console.error("Evento de erro:", e);
                                // Esconde a imagem quebrada e mostra o ícone
                                const img = e.target as HTMLImageElement;
                                img.style.display = "none";
                                const placeholder =
                                  img.nextElementSibling as HTMLElement;
                                if (placeholder)
                                  placeholder.style.display = "block";
                              }}
                              onLoad={() => {
                                console.log(
                                  `✅ Imagem carregada com sucesso no card ${item.id}`
                                );
                              }}
                            />
                            <DevicePhoneMobileIcon
                              className="w-20 h-20 text-gray-300"
                              style={{ display: "none" }}
                            />

                            {/* Controles do Carrossel */}
                            {item.fotos.length > 1 && (
                              <>
                                {/* Botão Anterior */}
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="flat"
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white"
                                  onPress={() =>
                                    handlePrevPhoto(
                                      item.id!,
                                      item.fotos!.length
                                    )
                                  }
                                >
                                  <ChevronLeftIcon className="w-4 h-4" />
                                </Button>

                                {/* Botão Próximo */}
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="flat"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white"
                                  onPress={() =>
                                    handleNextPhoto(
                                      item.id!,
                                      item.fotos!.length
                                    )
                                  }
                                >
                                  <ChevronRightIcon className="w-4 h-4" />
                                </Button>

                                {/* Indicador de posição */}
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                                  {(carouselIndex[item.id!] || 0) + 1} /{" "}
                                  {item.fotos.length}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <DevicePhoneMobileIcon className="w-20 h-20 text-gray-300" />
                        )}
                        {/* Badge de Status */}
                        <div className="absolute top-2 right-2">
                          <Chip
                            color={getStatusColor(item.status || "")}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusLabel(item.status || "")}
                          </Chip>
                        </div>
                      </div>

                      {/* Informações do Aparelho */}
                      <div className="space-y-2">
                        {/* Marca e Modelo */}
                        <div>
                          <p className="font-bold text-lg truncate">
                            {item.marca}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {item.modelo}
                          </p>
                        </div>

                        {/* IMEI */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">IMEI:</span>
                          <code className="text-xs font-mono">
                            {item.imei ? formatarIMEI(item.imei) : "-"}
                          </code>
                        </div>

                        {/* Cor e Capacidade */}
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="dot">
                            {item.cor || "Sem cor"}
                          </Chip>
                          <span className="text-sm text-gray-600">
                            {item.capacidade || "-"}
                          </span>
                        </div>

                        {/* Estado */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Estado:</span>
                          <Chip size="sm" variant="flat">
                            {item.estado?.toUpperCase()}
                          </Chip>
                        </div>

                        {/* Preço */}
                        <div className="pt-2 border-t">
                          <p className="text-2xl font-bold text-primary">
                            {formatarMoeda(item.preco_venda)}
                          </p>
                        </div>
                      </div>
                    </CardBody>

                    {/* Ações */}
                    <CardFooter className="p-2 pt-0 flex gap-1 justify-between">
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleOpenModal("detalhes", item)}
                        className="flex-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Ver
                      </Button>
                      {item.status === "disponivel" && (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          onPress={() => handleOpenModal("venda", item)}
                          className="flex-1"
                        >
                          <ShoppingCartIcon className="w-4 h-4" />
                          Vender
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleOpenModal("cadastro", item)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isIconOnly
                        onPress={() => handleDeleteAparelho(item.id!)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="flex justify-center mt-6">
            <Pagination
              total={Math.ceil(filteredEstoque.length / rowsPerPage)}
              page={page}
              onChange={setPage}
            />
          </div>
        </>
      )}

      {/* Grid de Cards - Vendas */}
      {activeTab === "vendas" && (
        <>
          {vendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Nenhuma venda realizada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendas.map((venda) => (
                <Card key={venda.uuid} className="w-full">
                  <CardBody className="p-4">
                    {/* Header com Data e Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Data da Venda</p>
                        <p className="text-sm font-semibold">
                          {venda.created_at
                            ? formatarDataHora(venda.created_at)
                            : "-"}
                        </p>
                      </div>
                      <Chip
                        color={venda.status === "pago" ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {venda.status?.toUpperCase()}
                      </Chip>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Cliente</p>
                      <p className="font-bold">{venda.cliente_nome}</p>
                      <p className="text-sm text-gray-600">
                        {venda.cliente_telefone || "-"}
                      </p>
                    </div>

                    {/* Informações do Aparelho */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Aparelho</p>
                      <p className="font-bold">
                        {venda.aparelho_marca} {venda.aparelho_modelo}
                      </p>
                      <code className="text-xs font-mono text-gray-600">
                        {venda.aparelho_imei
                          ? formatarIMEI(venda.aparelho_imei)
                          : "-"}
                      </code>
                    </div>

                    {/* Valor e Pagamento */}
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Valor Final:
                        </span>
                        <span className="text-xl font-bold text-success">
                          {formatarMoeda(venda.valor_final)}
                        </span>
                      </div>
                      {venda.desconto > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Desconto:
                          </span>
                          <span className="text-sm text-danger">
                            - {formatarMoeda(venda.desconto)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Chip size="sm" variant="dot">
                          {venda.forma_pagamento?.toUpperCase()}
                        </Chip>
                        {venda.parcelas > 1 && (
                          <span className="text-sm text-gray-600">
                            {venda.parcelas}x de{" "}
                            {formatarMoeda(venda.valor_final / venda.parcelas)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardBody>

                  {/* Ações */}
                  <CardFooter className="p-2 pt-0 flex gap-1">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="flex-1"
                      onPress={() => handleOpenDetalhesVenda(venda)}
                    >
                      <EyeIcon className="w-4 h-4" />
                      Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="warning"
                      className="flex-1"
                      onPress={() => handleOpenEditarVenda(venda)}
                    >
                      <PencilIcon className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      isIconOnly
                      onPress={() => handleDeleteVenda(venda.uuid!)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Cadastro/Venda */}
      <CadastroVendaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        modalType={modalType}
        selectedAparelho={selectedAparelho}
        selectedVenda={selectedVenda}
        formCadastro={formCadastro}
        setFormCadastro={setFormCadastro}
        formVenda={formVenda}
        setFormVenda={setFormVenda}
        clientes={clientes}
        lojas={lojas}
        loading={loading}
        onCadastrar={handleCadastrarAparelho}
        onVender={handleVenderAparelho}
        onSalvarEdicaoVenda={handleSalvarEdicaoVenda}
        onAbrirCameraIMEI={abrirCameraIMEI}
        onUploadFotos={handleUploadFotos}
        uploadingPhotos={uploadingPhotos}
        modalCarouselIndex={modalCarouselIndex}
        setModalCarouselIndex={setModalCarouselIndex}
        formFotosCarouselIndex={formFotosCarouselIndex}
        setFormFotosCarouselIndex={setFormFotosCarouselIndex}
        checklistFotosCarouselIndex={checklistFotosCarouselIndex}
        setChecklistFotosCarouselIndex={setChecklistFotosCarouselIndex}
        vendaFotosCarouselIndex={vendaFotosCarouselIndex}
        setVendaFotosCarouselIndex={setVendaFotosCarouselIndex}
        onOpenEditarVenda={handleOpenEditarVenda}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      {/* Modal de Logs de Atividades */}
      <LogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Modal de Leitura de IMEI com Câmera */}
      <IMEIScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onIMEIDetected={handleIMEIDetected}
      />
    </div>
  );
}
