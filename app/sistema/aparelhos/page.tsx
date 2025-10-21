"use client";

import { useState, useEffect, useRef } from "react";
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
  Spinner,
} from "@heroui/react";
import toast from "react-hot-toast";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader } from "@zxing/browser";
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

// Tipo para os logs de atividades
type LogAtividade = {
  id: string;
  tipo: "cadastro" | "venda" | "edicao" | "exclusao" | "erro";
  acao: string;
  detalhes: string;
  cliente?: string;
  usuario?: string;
  timestamp: Date;
  dados?: any;
};

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
  const [filtroTipoLog, setFiltroTipoLog] = useState<string>("todos");
  const [filtroDataLog, setFiltroDataLog] = useState<string>("");
  const [filtroClienteLog, setFiltroClienteLog] = useState<string>("");
  const [searchLog, setSearchLog] = useState<string>("");

  // Estados para Leitor de IMEI com Câmera
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isScanningIMEI, setIsScanningIMEI] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false); // Novo estado para controle de permissão
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
    null
  );
  const [lastDetectedText, setLastDetectedText] = useState<string>("");
  const [scanMode, setScanMode] = useState<"ocr" | "barcode">("ocr"); // Modo de leitura: OCR ou código de barras
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    loadData();
    checkTableExists();
  }, []);

  // Iniciar leitura automática quando o modo de código de barras for ativado
  useEffect(() => {
    if (isCameraModalOpen && scanMode === "barcode" && videoRef.current) {
      // Aguardar um pouco para a câmera iniciar
      const timer = setTimeout(() => {
        iniciarLeituraAutomatica();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCameraModalOpen, scanMode]);

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

  // Funções para Leitor de IMEI com Câmera
  const abrirCameraIMEI = () => {
    console.log("🔵 Abrindo modal de câmera");
    setIsCameraModalOpen(true);
  };

  const solicitarPermissaoCamera = async () => {
    setIsRequestingCamera(true);
    console.log("� Solicitando acesso à câmera...");

    try {
      // Verificar se a API de mídia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(
          "Câmera não disponível. Use HTTPS ou um navegador compatível."
        );
        // NÃO fechar o modal - deixar usuário ver a mensagem
        setIsRequestingCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Câmera traseira
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Valores ideais, mas aceita o que a câmera suportar
        },
      });

      console.log("✅ Câmera acessada com sucesso");
      setCameraStream(stream);
      setIsRequestingCamera(false);

      // Aguardar o vídeo estar disponível
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => {
            console.error("Erro ao reproduzir vídeo:", e);
          });
        }
      }, 100);
    } catch (error: any) {
      console.error("❌ Erro ao acessar câmera:", error);
      console.error("Nome do erro:", error.name);
      console.error("Mensagem:", error.message);

      setIsRequestingCamera(false);

      // Mensagens específicas para diferentes erros
      if (error.name === "NotAllowedError") {
        toast.error("Permissão de câmera negada. Habilite nas configurações.");
      } else if (error.name === "NotFoundError") {
        toast.error("Nenhuma câmera encontrada no dispositivo.");
      } else if (error.name === "OverconstrainedError") {
        toast.error(
          "Câmera não suporta a resolução solicitada. Tentando com configurações básicas..."
        );
        // Tentar novamente com configurações mais simples
        setTimeout(() => solicitarPermissaoCameraBasica(), 1000);
      } else if (
        error.name === "NotSupportedError" ||
        error.name === "TypeError"
      ) {
        toast.error(
          "Câmera não suportada. Use HTTPS ou digite o IMEI manualmente."
        );
      } else {
        toast.error(
          `Erro ao acessar câmera: ${error.message || "Desconhecido"}`
        );
      }

      // NÃO fechar o modal automaticamente, deixar usuário decidir
    }
  };

  // Função alternativa com configurações mínimas para câmeras com limitações
  const solicitarPermissaoCameraBasica = async () => {
    console.log("📱 Tentando com configurações básicas da câmera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Apenas câmera traseira
        },
      });

      console.log("✅ Câmera acessada com configurações básicas");
      setCameraStream(stream);
      setIsRequestingCamera(false);
      toast.success("Câmera ativada com sucesso!");

      // Aguardar o vídeo estar disponível
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => {
            console.error("Erro ao reproduzir vídeo:", e);
          });
        }
      }, 100);
    } catch (error: any) {
      console.error("❌ Erro mesmo com configurações básicas:", error);
      toast.error(
        "Não foi possível acessar a câmera. Tente digitar manualmente."
      );
      setIsRequestingCamera(false);
    }
  };

  const fecharCameraIMEI = () => {
    console.log("🔴 fecharCameraIMEI chamado - Fechando modal");
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (barcodeReaderRef.current) {
      barcodeReaderRef.current = null;
    }
    setIsCameraModalOpen(false);
    setIsScanningIMEI(false);
    setLastCapturedImage(null);
    setLastDetectedText("");
    setIsRequestingCamera(false); // Resetar também o estado de solicitação
  };

  const iniciarLeituraAutomatica = async () => {
    console.log("📊 Iniciando leitura automática de código de barras...");

    if (!videoRef.current) {
      toast.error("Erro: Câmera não inicializada");
      return;
    }

    try {
      if (!barcodeReaderRef.current) {
        barcodeReaderRef.current = new BrowserMultiFormatReader();
        // Configurar hints para melhorar detecção de códigos pequenos
        console.log(
          "🔧 Configurando scanner com modo TRY_HARDER para códigos pequenos"
        );
        const hints = new Map();
        hints.set(2, true); // TRY_HARDER - mais preciso mas mais lento
        barcodeReaderRef.current.hints = hints;
      }

      // Leitura contínua
      barcodeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const codigoBarras = result.getText();
            console.log("📊 Código detectado:", codigoBarras);

            // Filtrar apenas códigos com 15 dígitos
            if (/^\d{15}$/.test(codigoBarras)) {
              console.log("✅ Código de 15 dígitos encontrado:", codigoBarras);

              // Capturar imagem para preview
              if (canvasRef.current && videoRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext("2d");
                if (context) {
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  setLastCapturedImage(canvas.toDataURL("image/png"));
                }
              }

              setLastDetectedText(`✓ IMEI detectado:\n${codigoBarras}`);

              // Preencher no campo IMEI
              setFormCadastro((prev) => ({ ...prev, imei: codigoBarras }));

              toast.success(`IMEI ${codigoBarras} detectado!`, {
                id: "scanning",
              });

              // Parar leitura e fechar modal após sucesso
              barcodeReaderRef.current = null;
              setTimeout(() => fecharCameraIMEI(), 1000);
            } else {
              console.log(
                `⚠️ Código ignorado (não tem 15 dígitos): ${codigoBarras}`
              );
            }
          }

          if (error && error.name !== "NotFoundException") {
            console.error("❌ Erro na leitura:", error);
          }
        }
      );

      toast.loading(
        "📊 Escaneando... Se o código for pequeno, aproxime BEM da câmera",
        {
          id: "scanning",
          duration: 15000, // Toast fica por 15 segundos
        }
      );
    } catch (error: any) {
      console.error("❌ Erro ao iniciar leitura automática:", error);
      toast.error("Erro ao iniciar scanner", { id: "scanning" });
    }
  };

  const lerCodigoBarras = async () => {
    // Esta função agora apenas inicia a leitura automática
    iniciarLeituraAutomatica();
  };

  const capturarCodigoBarrasManual = async () => {
    console.log("📊 Captura manual de código de barras...");

    if (!videoRef.current) {
      toast.error("Erro: Câmera não inicializada");
      return;
    }

    setIsScanningIMEI(true);
    toast.loading("Lendo código de barras...", { id: "scanning" });

    try {
      if (!barcodeReaderRef.current) {
        barcodeReaderRef.current = new BrowserMultiFormatReader();
      }

      // Leitura única (não contínua)
      const result = await barcodeReaderRef.current.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current
      );

      const codigoBarras = result.getText();
      console.log("📊 Código detectado:", codigoBarras);

      // Filtrar apenas códigos com 15 dígitos
      if (/^\d{15}$/.test(codigoBarras)) {
        console.log("✅ Código de 15 dígitos encontrado:", codigoBarras);

        // Capturar imagem para preview
        if (canvasRef.current && videoRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            setLastCapturedImage(canvas.toDataURL("image/png"));
          }
        }

        setLastDetectedText(`✓ IMEI detectado:\n${codigoBarras}`);

        // Preencher no campo IMEI
        setFormCadastro((prev) => ({ ...prev, imei: codigoBarras }));

        toast.success(`IMEI ${codigoBarras} detectado!`, { id: "scanning" });

        // Fechar modal após sucesso
        setTimeout(() => fecharCameraIMEI(), 1000);
      } else {
        console.log(`⚠️ Código ignorado (não tem 15 dígitos): ${codigoBarras}`);
        setLastDetectedText(
          `⚠️ Código encontrado mas não tem 15 dígitos:\n${codigoBarras}\n\nTente novamente posicionando apenas o IMEI.`
        );
        toast.error("Código encontrado mas não é um IMEI válido", {
          id: "scanning",
        });
      }
    } catch (error: any) {
      console.error("❌ Erro ao ler código de barras:", error);
      if (error.name === "NotFoundException") {
        toast.error("Nenhum código de barras encontrado", { id: "scanning" });
      } else {
        toast.error("Erro ao ler código de barras", { id: "scanning" });
      }
    } finally {
      setIsScanningIMEI(false);
    }
  };

  const capturarELerIMEI = async () => {
    // Verificar qual modo está ativo
    if (scanMode === "barcode") {
      return capturarCodigoBarrasManual();
    }

    console.log("🎯 Iniciando captura de IMEI com OCR...");

    if (!videoRef.current || !canvasRef.current) {
      console.error("❌ Refs não disponíveis:", {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
      });
      toast.error("Erro: Câmera não inicializada");
      return;
    }

    setIsScanningIMEI(true);
    toast.loading("Lendo IMEI...", { id: "scanning" });

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      console.log("📹 Vídeo dimensões:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
      });

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Vídeo não está pronto. Aguarde a câmera carregar.");
      }

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Não foi possível obter contexto do canvas");
      }

      // Configurar canvas com dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar frame atual do vídeo no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Pré-processar imagem para melhorar OCR
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Primeira passada: Converter para escala de cinza
      const grayValues: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        grayValues.push(gray);
      }

      // Calcular threshold usando método de Otsu simplificado
      const avgGray = grayValues.reduce((a, b) => a + b, 0) / grayValues.length;
      const threshold = avgGray; // Usar média como threshold

      // Segunda passada: Aplicar threshold binário (preto e branco puro)
      for (let i = 0; i < data.length; i += 4) {
        const gray = grayValues[i / 4];

        // Se o fundo é escuro (como sua foto), inverter as cores
        // Texto branco em fundo preto -> Texto preto em fundo branco
        const binaryValue = gray > threshold ? 255 : 0;

        // Aumentar contraste adicional
        const finalValue = binaryValue > 127 ? 255 : 0;

        data[i] = data[i + 1] = data[i + 2] = finalValue;
      }

      context.putImageData(imageData, 0, 0);

      // Salvar imagem processada para preview
      const capturedImageUrl = canvas.toDataURL("image/png");
      setLastCapturedImage(capturedImageUrl);

      console.log("✅ Frame capturado e processado no canvas");

      // Criar worker do Tesseract
      console.log("🔄 Carregando Tesseract...");
      toast.loading("Carregando OCR...", { id: "scanning" });

      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          console.log("Tesseract:", m);
          if (m.status === "recognizing text") {
            toast.loading(`Lendo texto... ${Math.round(m.progress * 100)}%`, {
              id: "scanning",
            });
          }
        },
      });

      // Configurar para reconhecer apenas números
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
      });

      console.log("✅ Worker criado, iniciando reconhecimento...");

      // Reconhecer texto na imagem
      const {
        data: { text },
      } = await worker.recognize(canvas);

      await worker.terminate();

      console.log("📝 Texto detectado:", text);

      // Extrair números (IMEI tem 15 dígitos)
      const numeros = text.replace(/\D/g, "");
      console.log("🔢 Números extraídos:", numeros);
      console.log("📏 Total de números:", numeros.length);

      // Tentar encontrar todas as sequências de 15 dígitos usando janela deslizante
      let imeiCandidatos: string[] = [];

      if (numeros.length >= 15) {
        console.log("⚠️ Extraindo todas as janelas de 15 dígitos...");
        for (let i = 0; i <= numeros.length - 15; i++) {
          const candidato = numeros.substring(i, i + 15);
          imeiCandidatos.push(candidato);
        }
      }

      console.log(
        `🎯 ${imeiCandidatos.length} candidatos de 15 dígitos encontrados`
      );
      if (imeiCandidatos.length > 0) {
        console.log("Candidatos:", imeiCandidatos.slice(0, 5)); // Mostra os 5 primeiros
      }

      // Filtrar apenas candidatos válidos usando algoritmo Luhn
      const imeiValidos = imeiCandidatos.filter((imei) => validarIMEI(imei));
      console.log(
        `✓ ${imeiValidos.length} IMEI(s) válido(s) encontrado(s):`,
        imeiValidos
      );

      // Atualizar display com informações úteis
      if (imeiValidos.length > 0) {
        setLastDetectedText(
          `✓ ${imeiValidos.length} IMEI(s) válido(s):\n${imeiValidos.map((i) => formatarIMEI(i)).join("\n")}`
        );
      } else if (imeiCandidatos.length > 0) {
        setLastDetectedText(
          `❌ ${imeiCandidatos.length} candidatos testados\nNenhum válido\n\n${numeros.length} dígitos: ${numeros.substring(0, 35)}${numeros.length > 35 ? "..." : ""}`
        );
      } else if (numeros.length > 0) {
        setLastDetectedText(
          `${numeros.length} dígitos detectados\n(precisa 15 para IMEI)\n\nNúmeros: ${numeros}`
        );
      } else {
        setLastDetectedText("Nenhum número detectado");
      }

      if (imeiValidos.length > 0) {
        const imeiDetectado = imeiValidos[0]; // Pega o primeiro válido
        console.log("📱 IMEI selecionado:", imeiDetectado);

        if (imeiValidos.length > 1) {
          console.warn("⚠️ Múltiplos IMEIs válidos encontrados:", imeiValidos);
          toast.success(
            `${imeiValidos.length} IMEIs detectados. Usando o primeiro: ${formatarIMEI(imeiDetectado)}`,
            { id: "scanning", duration: 3000 }
          );
        }

        // Consultar informações do IMEI online (opcional)
        toast.loading("Consultando base de dados do IMEI...", {
          id: "scanning",
        });

        const infoIMEI = await consultarIMEI(imeiDetectado);
        console.log("📡 Informações do IMEI:", infoIMEI);

        // Usar o primeiro IMEI válido
        setIsScanningIMEI(false);

        // Preencher campos automaticamente se tiver informações
        setFormCadastro({
          ...formCadastro,
          imei: imeiDetectado,
          marca: infoIMEI.marca || formCadastro.marca,
          modelo: infoIMEI.modelo || formCadastro.modelo,
        });

        // Mostrar resultado
        if (infoIMEI.marca && infoIMEI.modelo) {
          toast.success(
            `IMEI detectado: ${formatarIMEI(imeiDetectado)}\n${infoIMEI.marca} ${infoIMEI.modelo}`,
            {
              id: "scanning",
              duration: 3000,
            }
          );
        } else {
          toast.success(`IMEI detectado: ${formatarIMEI(imeiDetectado)}`, {
            id: "scanning",
            duration: 2000,
          });
        }

        // Fechar modal após pequeno delay para mostrar o sucesso
        setTimeout(() => {
          fecharCameraIMEI();
        }, 500);
      } else {
        // Nenhum IMEI válido encontrado
        let mensagem = "";

        if (numeros.length === 0) {
          mensagem =
            "Nenhum número detectado. Certifique-se que o IMEI está visível e bem iluminado.";
        } else if (numeros.length < 15) {
          mensagem = `Detectado apenas ${numeros.length} dígitos. IMEI precisa ter 15. Ajuste o foco e tente novamente.`;
        } else {
          mensagem = `Detectado ${numeros.length} dígitos mas nenhum IMEI válido. ${imeiCandidatos.length} candidatos testados.`;
          console.warn(
            "❌ Candidatos testados mas inválidos:",
            imeiCandidatos.slice(0, 3)
          );
        }

        toast.error(mensagem, { id: "scanning", duration: 5000 });
        setIsScanningIMEI(false);
      }
    } catch (error: any) {
      console.error("❌ Erro ao processar imagem:", error);
      toast.error(`Erro: ${error.message || "Tente novamente"}`, {
        id: "scanning",
        duration: 4000,
      });
      setIsScanningIMEI(false);
    } finally {
      // Não resetar isScanningIMEI aqui, já foi feito acima
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
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-between">
                <div>
                  {modalType === "cadastro" &&
                    (selectedAparelho ? "Editar Aparelho" : "Novo Aparelho")}
                  {modalType === "venda" && "Realizar Venda"}
                  {modalType === "detalhes" && "Detalhes do Aparelho"}
                  {modalType === "detalhes-venda" && "Detalhes da Venda"}
                  {modalType === "editar-venda" && "Editar Venda"}
                </div>
              </ModalHeader>
              <ModalBody>
                {modalType === "cadastro" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Marca *"
                      placeholder="Ex: Apple, Samsung, Xiaomi"
                      value={formCadastro.marca}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          marca: e.target.value,
                        })
                      }
                      isRequired
                    />
                    <Input
                      label="Modelo *"
                      placeholder="Ex: iPhone 13, Galaxy S21"
                      value={formCadastro.modelo}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          modelo: e.target.value,
                        })
                      }
                      isRequired
                    />
                    <div className="flex gap-2 items-end">
                      <Input
                        label="IMEI"
                        placeholder="000000000000000"
                        value={formCadastro.imei}
                        onChange={(e) =>
                          setFormCadastro({
                            ...formCadastro,
                            imei: e.target.value,
                          })
                        }
                        description="15 dígitos"
                        className="flex-1"
                      />
                      <Button
                        isIconOnly
                        color="primary"
                        variant="flat"
                        onPress={() => {
                          console.log("🟢 Botão de câmera clicado!");
                          abrirCameraIMEI();
                        }}
                        className="mb-6"
                        title="Ler IMEI com câmera (requer HTTPS)"
                      >
                        <CameraIcon className="w-5 h-5" />
                      </Button>
                    </div>
                    <Input
                      label="Serial"
                      placeholder="Número de série"
                      value={formCadastro.serial}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          serial: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Cor"
                      placeholder="Ex: Preto, Branco, Azul"
                      value={formCadastro.cor}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          cor: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Capacidade"
                      placeholder="Ex: 128GB, 256GB"
                      value={formCadastro.capacidade}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          capacidade: e.target.value,
                        })
                      }
                    />
                    <Select
                      label="Estado *"
                      selectedKeys={[formCadastro.estado || "usado"]}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          estado: e.target.value as any,
                        })
                      }
                      isRequired
                    >
                      <SelectItem key="novo">Novo</SelectItem>
                      <SelectItem key="seminovo">Seminovo</SelectItem>
                      <SelectItem key="usado">Usado</SelectItem>
                    </Select>
                    <Select
                      label="Status *"
                      selectedKeys={[formCadastro.status || "disponivel"]}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          status: e.target.value as any,
                        })
                      }
                      isRequired
                    >
                      <SelectItem key="disponivel">Disponível</SelectItem>
                      <SelectItem key="reservado">Reservado</SelectItem>
                      <SelectItem key="em_reparo">Em Reparo</SelectItem>
                      <SelectItem key="defeito">Defeito</SelectItem>
                    </Select>
                    <Input
                      label="Bateria (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={formCadastro.bateria?.toString()}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          bateria: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Preço de Compra"
                      type="number"
                      startContent={<span>R$</span>}
                      value={formCadastro.preco_compra?.toString()}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          preco_compra: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Preço de Venda *"
                      type="number"
                      startContent={<span>R$</span>}
                      value={formCadastro.preco_venda?.toString()}
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          preco_venda: parseFloat(e.target.value) || 0,
                        })
                      }
                      isRequired
                    />
                    <Select
                      label="Loja"
                      selectedKeys={
                        formCadastro.loja_id
                          ? [formCadastro.loja_id.toString()]
                          : []
                      }
                      onChange={(e) =>
                        setFormCadastro({
                          ...formCadastro,
                          loja_id: parseInt(e.target.value),
                        })
                      }
                    >
                      {lojas.map((loja) => (
                        <SelectItem key={loja.id}>{loja.nome}</SelectItem>
                      ))}
                    </Select>
                    <div className="md:col-span-2">
                      <Textarea
                        label="Observações"
                        placeholder="Informações adicionais sobre o aparelho"
                        value={formCadastro.observacoes}
                        onChange={(e) =>
                          setFormCadastro({
                            ...formCadastro,
                            observacoes: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Fotos do Aparelho
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          color="primary"
                          variant="flat"
                          startContent={<PhotoIcon className="w-5 h-5" />}
                          onPress={() =>
                            document
                              .getElementById("upload-fotos-aparelho")
                              ?.click()
                          }
                        >
                          Selecionar Fotos
                        </Button>
                        <span className="text-sm text-gray-500">
                          {formCadastro.fotos && formCadastro.fotos.length > 0
                            ? `${formCadastro.fotos.length} foto(s) selecionada(s)`
                            : "Nenhuma foto selecionada"}
                        </span>
                      </div>
                      <input
                        id="upload-fotos-aparelho"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files) {
                            console.log("📸 Iniciando upload de fotos...");
                            const urls = await handleUploadFotos(
                              e.target.files,
                              "aparelho"
                            );
                            console.log("✅ URLs recebidas do upload:", urls);
                            const novasfotos = [
                              ...(formCadastro.fotos || []),
                              ...urls,
                            ];
                            console.log(
                              "📦 Atualizando formCadastro.fotos:",
                              novasfotos
                            );
                            setFormCadastro({
                              ...formCadastro,
                              fotos: novasfotos,
                            });
                            console.log(
                              "✅ FormCadastro atualizado! Total de fotos:",
                              novasfotos.length
                            );
                          }
                        }}
                        className="hidden"
                      />
                      {formCadastro.fotos && formCadastro.fotos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Fotos Selecionadas ({formCadastro.fotos.length})
                          </p>

                          {/* Carrossel de Fotos */}
                          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                            {/* Imagem Principal */}
                            <div className="relative w-full h-80 flex items-center justify-center">
                              <img
                                src={formCadastro.fotos[formFotosCarouselIndex]}
                                alt={`Foto ${formFotosCarouselIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                              />

                              {/* Botão de Deletar Foto */}
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                className="absolute top-4 right-4"
                                onPress={() => {
                                  const newFotos = formCadastro.fotos?.filter(
                                    (_, i) => i !== formFotosCarouselIndex
                                  );
                                  setFormCadastro({
                                    ...formCadastro,
                                    fotos: newFotos,
                                  });
                                  // Ajustar índice se necessário
                                  if (
                                    formFotosCarouselIndex >=
                                    (newFotos?.length || 0)
                                  ) {
                                    setFormFotosCarouselIndex(
                                      Math.max(0, (newFotos?.length || 1) - 1)
                                    );
                                  }
                                }}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>

                              {/* Controles do Carrossel */}
                              {formCadastro.fotos.length > 1 && (
                                <>
                                  {/* Botão Anterior */}
                                  <Button
                                    isIconOnly
                                    size="lg"
                                    variant="flat"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                    onPress={() =>
                                      setFormFotosCarouselIndex(
                                        (prev) =>
                                          (prev -
                                            1 +
                                            formCadastro.fotos!.length) %
                                          formCadastro.fotos!.length
                                      )
                                    }
                                  >
                                    <ChevronLeftIcon className="w-6 h-6" />
                                  </Button>

                                  {/* Botão Próximo */}
                                  <Button
                                    isIconOnly
                                    size="lg"
                                    variant="flat"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                    onPress={() =>
                                      setFormFotosCarouselIndex(
                                        (prev) =>
                                          (prev + 1) %
                                          formCadastro.fotos!.length
                                      )
                                    }
                                  >
                                    <ChevronRightIcon className="w-6 h-6" />
                                  </Button>

                                  {/* Indicador de posição */}
                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                    {formFotosCarouselIndex + 1} /{" "}
                                    {formCadastro.fotos.length}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Miniaturas */}
                            {formCadastro.fotos.length > 1 && (
                              <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                                {formCadastro.fotos.map((url, idx) => (
                                  <button
                                    key={idx}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                      idx === formFotosCarouselIndex
                                        ? "border-primary scale-110"
                                        : "border-gray-300 opacity-60 hover:opacity-100"
                                    }`}
                                    onClick={() =>
                                      setFormFotosCarouselIndex(idx)
                                    }
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
                    </div>
                  </div>
                )}

                {modalType === "venda" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 p-4 bg-gray-100 rounded-lg">
                      <h3 className="font-semibold mb-2">
                        Aparelho Selecionado
                      </h3>
                      <p>
                        <strong>Marca:</strong> {formVenda.aparelho_marca}
                      </p>
                      <p>
                        <strong>Modelo:</strong> {formVenda.aparelho_modelo}
                      </p>
                      <p>
                        <strong>IMEI:</strong>{" "}
                        {formVenda.aparelho_imei
                          ? formatarIMEI(formVenda.aparelho_imei)
                          : "-"}
                      </p>
                      <p>
                        <strong>Valor:</strong>{" "}
                        {formatarMoeda(formVenda.valor_aparelho || 0)}
                      </p>
                    </div>

                    <Autocomplete
                      label="Cliente *"
                      placeholder="Buscar cliente..."
                      onSelectionChange={(key) => {
                        const cliente = clientes.find(
                          (c) => c.id.toString() === key
                        );
                        if (cliente) {
                          setFormVenda({
                            ...formVenda,
                            cliente_id: cliente.id,
                            cliente_nome: cliente.nome,
                            cliente_cpf: cliente.doc,
                            cliente_telefone: cliente.telefone,
                            cliente_email: cliente.email,
                          });
                        }
                      }}
                      isRequired
                    >
                      {clientes.map((cliente) => (
                        <AutocompleteItem key={cliente.id}>
                          {cliente.nome}
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>

                    <Input
                      label="Telefone"
                      value={formVenda.cliente_telefone}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          cliente_telefone: e.target.value,
                        })
                      }
                    />

                    <Input
                      label="E-mail"
                      type="email"
                      value={formVenda.cliente_email}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          cliente_email: e.target.value,
                        })
                      }
                    />

                    <Input
                      label="Valor do Aparelho *"
                      type="number"
                      startContent={<span>R$</span>}
                      value={formVenda.valor_aparelho?.toString()}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || 0;
                        setFormVenda({
                          ...formVenda,
                          valor_aparelho: valor,
                          valor_final: calcularValorFinal(
                            valor,
                            formVenda.desconto || 0
                          ),
                        });
                      }}
                      isRequired
                    />

                    <Input
                      label="Desconto"
                      type="number"
                      startContent={<span>R$</span>}
                      value={formVenda.desconto?.toString()}
                      onChange={(e) => {
                        const desconto = parseFloat(e.target.value) || 0;
                        setFormVenda({
                          ...formVenda,
                          desconto,
                          valor_final: calcularValorFinal(
                            formVenda.valor_aparelho || 0,
                            desconto
                          ),
                        });
                      }}
                    />

                    <Input
                      label="Valor Final"
                      type="number"
                      startContent={<span>R$</span>}
                      value={formVenda.valor_final?.toString()}
                      isReadOnly
                      className="font-bold"
                    />

                    <Select
                      label="Forma de Pagamento *"
                      selectedKeys={[formVenda.forma_pagamento || "pix"]}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          forma_pagamento: e.target.value as any,
                        })
                      }
                      isRequired
                    >
                      <SelectItem key="dinheiro">Dinheiro</SelectItem>
                      <SelectItem key="pix">PIX</SelectItem>
                      <SelectItem key="debito">Débito</SelectItem>
                      <SelectItem key="credito">Crédito</SelectItem>
                      <SelectItem key="carteira_digital">
                        Carteira Digital
                      </SelectItem>
                      <SelectItem key="misto">Misto</SelectItem>
                    </Select>

                    <Input
                      label="Parcelas"
                      type="number"
                      min="1"
                      value={formVenda.parcelas?.toString()}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          parcelas: parseInt(e.target.value) || 1,
                        })
                      }
                    />

                    <Input
                      label="Garantia (meses)"
                      type="number"
                      min="0"
                      value={formVenda.garantia_meses?.toString()}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          garantia_meses: parseInt(e.target.value) || 3,
                        })
                      }
                    />

                    <Select
                      label="Loja"
                      selectedKeys={
                        formVenda.loja_id ? [formVenda.loja_id.toString()] : []
                      }
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          loja_id: parseInt(e.target.value),
                        })
                      }
                    >
                      {lojas.map((loja) => (
                        <SelectItem key={loja.id}>{loja.nome}</SelectItem>
                      ))}
                    </Select>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Termo de Venda (PDF/Imagem)
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          color="secondary"
                          variant="flat"
                          startContent={
                            <DocumentTextIcon className="w-5 h-5" />
                          }
                          onPress={() =>
                            document
                              .getElementById("upload-termo-venda")
                              ?.click()
                          }
                        >
                          Selecionar Termo
                        </Button>
                        <span className="text-sm text-gray-500">
                          {formVenda.termo_venda_url
                            ? "✓ Termo anexado"
                            : "Nenhum termo anexado"}
                        </span>
                      </div>
                      <input
                        id="upload-termo-venda"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={async (e) => {
                          if (e.target.files) {
                            const urls = await handleUploadFotos(
                              e.target.files,
                              "termo"
                            );
                            setFormVenda({
                              ...formVenda,
                              termo_venda_url: urls[0],
                            });
                          }
                        }}
                        className="hidden"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Fotos do Checklist
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          color="success"
                          variant="flat"
                          startContent={<PhotoIcon className="w-5 h-5" />}
                          onPress={() =>
                            document
                              .getElementById("upload-checklist-fotos")
                              ?.click()
                          }
                        >
                          Selecionar Fotos
                        </Button>
                        <span className="text-sm text-gray-500">
                          {formVenda.checklist_fotos &&
                          formVenda.checklist_fotos.length > 0
                            ? `${formVenda.checklist_fotos.length} foto(s) selecionada(s)`
                            : "Nenhuma foto selecionada"}
                        </span>
                      </div>
                      <input
                        id="upload-checklist-fotos"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files) {
                            const urls = await handleUploadFotos(
                              e.target.files,
                              "checklist"
                            );
                            setFormVenda({
                              ...formVenda,
                              checklist_fotos: [
                                ...(formVenda.checklist_fotos || []),
                                ...urls,
                              ],
                            });
                          }
                        }}
                        className="hidden"
                      />
                      {formVenda.checklist_fotos &&
                        formVenda.checklist_fotos.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                              Fotos do Checklist (
                              {formVenda.checklist_fotos.length})
                            </p>

                            {/* Carrossel de Fotos do Checklist */}
                            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                              {/* Imagem Principal */}
                              <div className="relative w-full h-80 flex items-center justify-center">
                                <img
                                  src={
                                    formVenda.checklist_fotos[
                                      checklistFotosCarouselIndex
                                    ]
                                  }
                                  alt={`Checklist ${checklistFotosCarouselIndex + 1}`}
                                  className="max-w-full max-h-full object-contain"
                                />

                                {/* Botão de Deletar Foto */}
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="danger"
                                  className="absolute top-4 right-4"
                                  onPress={() => {
                                    const newFotos =
                                      formVenda.checklist_fotos?.filter(
                                        (_, i) =>
                                          i !== checklistFotosCarouselIndex
                                      );
                                    setFormVenda({
                                      ...formVenda,
                                      checklist_fotos: newFotos,
                                    });
                                    // Ajustar índice se necessário
                                    if (
                                      checklistFotosCarouselIndex >=
                                      (newFotos?.length || 0)
                                    ) {
                                      setChecklistFotosCarouselIndex(
                                        Math.max(0, (newFotos?.length || 1) - 1)
                                      );
                                    }
                                  }}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </Button>

                                {/* Controles do Carrossel */}
                                {formVenda.checklist_fotos.length > 1 && (
                                  <>
                                    {/* Botão Anterior */}
                                    <Button
                                      isIconOnly
                                      size="lg"
                                      variant="flat"
                                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                      onPress={() =>
                                        setChecklistFotosCarouselIndex(
                                          (prev) =>
                                            (prev -
                                              1 +
                                              formVenda.checklist_fotos!
                                                .length) %
                                            formVenda.checklist_fotos!.length
                                        )
                                      }
                                    >
                                      <ChevronLeftIcon className="w-6 h-6" />
                                    </Button>

                                    {/* Botão Próximo */}
                                    <Button
                                      isIconOnly
                                      size="lg"
                                      variant="flat"
                                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                      onPress={() =>
                                        setChecklistFotosCarouselIndex(
                                          (prev) =>
                                            (prev + 1) %
                                            formVenda.checklist_fotos!.length
                                        )
                                      }
                                    >
                                      <ChevronRightIcon className="w-6 h-6" />
                                    </Button>

                                    {/* Indicador de posição */}
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                      {checklistFotosCarouselIndex + 1} /{" "}
                                      {formVenda.checklist_fotos.length}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Miniaturas */}
                              {formVenda.checklist_fotos.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                                  {formVenda.checklist_fotos.map((url, idx) => (
                                    <button
                                      key={idx}
                                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === checklistFotosCarouselIndex
                                          ? "border-primary scale-110"
                                          : "border-gray-300 opacity-60 hover:opacity-100"
                                      }`}
                                      onClick={() =>
                                        setChecklistFotosCarouselIndex(idx)
                                      }
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
                    </div>

                    <div className="md:col-span-2">
                      <Textarea
                        label="Observações"
                        placeholder="Informações adicionais sobre a venda"
                        value={formVenda.aparelho_observacoes}
                        onChange={(e) =>
                          setFormVenda({
                            ...formVenda,
                            aparelho_observacoes: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {modalType === "detalhes" && selectedAparelho && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Marca</p>
                        <p className="font-semibold">
                          {selectedAparelho.marca}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Modelo</p>
                        <p className="font-semibold">
                          {selectedAparelho.modelo}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">IMEI</p>
                        <p className="font-mono">
                          {selectedAparelho.imei
                            ? formatarIMEI(selectedAparelho.imei)
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Serial</p>
                        <p className="font-mono">
                          {selectedAparelho.serial || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cor</p>
                        <p>{selectedAparelho.cor || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Capacidade</p>
                        <p>{selectedAparelho.capacidade || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estado</p>
                        <Chip size="sm">
                          {selectedAparelho.estado?.toUpperCase()}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Chip
                          color={getStatusColor(selectedAparelho.status || "")}
                          size="sm"
                        >
                          {getStatusLabel(selectedAparelho.status || "")}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Preço de Venda</p>
                        <p className="font-semibold text-lg">
                          {formatarMoeda(selectedAparelho.preco_venda)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bateria</p>
                        <p>
                          {selectedAparelho.bateria
                            ? `${selectedAparelho.bateria}%`
                            : "-"}
                        </p>
                      </div>
                    </div>

                    {selectedAparelho.observacoes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Observações
                        </p>
                        <p className="p-3 bg-gray-100 rounded">
                          {selectedAparelho.observacoes}
                        </p>
                      </div>
                    )}

                    {selectedAparelho.fotos &&
                      selectedAparelho.fotos.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            Fotos do Aparelho ({selectedAparelho.fotos.length})
                          </p>

                          {/* Carrossel de Fotos Grande */}
                          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                            {/* Imagem Principal */}
                            <div className="relative w-full h-96 flex items-center justify-center">
                              <img
                                src={selectedAparelho.fotos[modalCarouselIndex]}
                                alt={`Foto ${modalCarouselIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  console.error(
                                    `❌ Erro ao carregar foto ${modalCarouselIndex + 1} no modal:`,
                                    selectedAparelho.fotos?.[modalCarouselIndex]
                                  );
                                }}
                                onLoad={() => {
                                  console.log(
                                    `✅ Foto ${modalCarouselIndex + 1} carregada com sucesso no modal`
                                  );
                                }}
                              />

                              {/* Controles do Carrossel */}
                              {selectedAparelho.fotos.length > 1 && (
                                <>
                                  {/* Botão Anterior */}
                                  <Button
                                    isIconOnly
                                    size="lg"
                                    variant="flat"
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                    onPress={() =>
                                      handlePrevModalPhoto(
                                        selectedAparelho.fotos!.length
                                      )
                                    }
                                  >
                                    <ChevronLeftIcon className="w-6 h-6" />
                                  </Button>

                                  {/* Botão Próximo */}
                                  <Button
                                    isIconOnly
                                    size="lg"
                                    variant="flat"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                    onPress={() =>
                                      handleNextModalPhoto(
                                        selectedAparelho.fotos!.length
                                      )
                                    }
                                  >
                                    <ChevronRightIcon className="w-6 h-6" />
                                  </Button>

                                  {/* Indicador de posição */}
                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
                                    {modalCarouselIndex + 1} /{" "}
                                    {selectedAparelho.fotos.length}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Miniaturas */}
                            {selectedAparelho.fotos.length > 1 && (
                              <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                                {selectedAparelho.fotos.map((url, idx) => (
                                  <button
                                    key={idx}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                      idx === modalCarouselIndex
                                        ? "border-primary scale-110"
                                        : "border-gray-300 opacity-60 hover:opacity-100"
                                    }`}
                                    onClick={() => setModalCarouselIndex(idx)}
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
                  </div>
                )}

                {/* Modal de Detalhes da Venda */}
                {modalType === "detalhes-venda" && selectedVenda && (
                  <div className="space-y-6">
                    {/* Informações da Venda */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-bold">
                          Informações da Venda
                        </h3>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Data da Venda
                            </p>
                            <p className="font-semibold">
                              {selectedVenda.created_at
                                ? formatarDataHora(selectedVenda.created_at)
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <Chip
                              color={
                                selectedVenda.status === "pago"
                                  ? "success"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {selectedVenda.status?.toUpperCase()}
                            </Chip>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Vendedor</p>
                            <p className="font-semibold">
                              {usuarios.find(
                                (u) => u.uuid === selectedVenda.vendedor_id
                              )?.nome || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Loja</p>
                            <p className="font-semibold">
                              {lojas.find((l) => l.id === selectedVenda.loja_id)
                                ?.nome || "-"}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Informações do Cliente */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-bold">Cliente</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">Nome</p>
                            <p className="font-semibold text-lg">
                              {selectedVenda.cliente_nome}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">CPF</p>
                            <p>{selectedVenda.cliente_cpf || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Telefone</p>
                            <p>{selectedVenda.cliente_telefone || "-"}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">E-mail</p>
                            <p>{selectedVenda.cliente_email || "-"}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Informações do Aparelho */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-bold">Aparelho Vendido</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600">Modelo</p>
                            <p className="font-bold text-lg">
                              {selectedVenda.aparelho_marca}{" "}
                              {selectedVenda.aparelho_modelo}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">IMEI</p>
                            <code className="font-mono">
                              {selectedVenda.aparelho_imei
                                ? formatarIMEI(selectedVenda.aparelho_imei)
                                : "-"}
                            </code>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Serial</p>
                            <code className="font-mono">
                              {selectedVenda.aparelho_serial || "-"}
                            </code>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Cor</p>
                            <p>{selectedVenda.aparelho_cor || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Capacidade</p>
                            <p>{selectedVenda.aparelho_capacidade || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Estado</p>
                            <Chip size="sm">
                              {selectedVenda.aparelho_estado?.toUpperCase()}
                            </Chip>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Bateria</p>
                            <p>
                              {selectedVenda.aparelho_bateria
                                ? `${selectedVenda.aparelho_bateria}%`
                                : "-"}
                            </p>
                          </div>
                          {selectedVenda.aparelho_acessorios &&
                            selectedVenda.aparelho_acessorios.length > 0 && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600 mb-2">
                                  Acessórios
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedVenda.aparelho_acessorios.map(
                                    (acc, idx) => (
                                      <Chip key={idx} size="sm" variant="flat">
                                        {acc}
                                      </Chip>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {selectedVenda.aparelho_observacoes && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600">
                                Observações
                              </p>
                              <p className="p-3 bg-gray-100 rounded">
                                {selectedVenda.aparelho_observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>

                    {/* Informações Financeiras */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-bold">Valores</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">
                              Valor do Aparelho:
                            </span>
                            <span className="font-semibold text-lg">
                              {formatarMoeda(selectedVenda.valor_aparelho)}
                            </span>
                          </div>
                          {selectedVenda.desconto > 0 && (
                            <div className="flex justify-between items-center text-danger">
                              <span>Desconto:</span>
                              <span className="font-semibold">
                                - {formatarMoeda(selectedVenda.desconto)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-3 border-t-2">
                            <span className="text-lg font-bold">
                              Valor Final:
                            </span>
                            <span className="text-2xl font-bold text-success">
                              {formatarMoeda(selectedVenda.valor_final)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t">
                            <span className="text-gray-600">
                              Forma de Pagamento:
                            </span>
                            <Chip size="sm" variant="flat">
                              {selectedVenda.forma_pagamento?.toUpperCase()}
                            </Chip>
                          </div>
                          {selectedVenda.parcelas > 1 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Parcelas:</span>
                              <span className="font-semibold">
                                {selectedVenda.parcelas}x de{" "}
                                {formatarMoeda(
                                  selectedVenda.valor_final /
                                    selectedVenda.parcelas
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>

                    {/* Garantia */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-bold">Garantia</h3>
                      </CardHeader>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Período</p>
                            <p className="font-semibold">
                              {selectedVenda.garantia_meses} meses
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Validade</p>
                            <p className="font-semibold">
                              {selectedVenda.garantia_expira_em
                                ? new Date(
                                    selectedVenda.garantia_expira_em
                                  ).toLocaleDateString("pt-BR")
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Fotos do Aparelho */}
                    {selectedVenda.aparelho_fotos &&
                      selectedVenda.aparelho_fotos.length > 0 && (
                        <Card>
                          <CardHeader>
                            <h3 className="text-lg font-bold">
                              Fotos do Aparelho (
                              {selectedVenda.aparelho_fotos.length})
                            </h3>
                          </CardHeader>
                          <CardBody>
                            {/* Carrossel de Fotos do Aparelho */}
                            <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                              {/* Imagem Principal */}
                              <div className="relative w-full h-96 flex items-center justify-center">
                                <img
                                  src={
                                    selectedVenda.aparelho_fotos[
                                      vendaFotosCarouselIndex
                                    ]
                                  }
                                  alt={`Foto ${vendaFotosCarouselIndex + 1}`}
                                  className="max-w-full max-h-full object-contain cursor-pointer"
                                  onClick={() =>
                                    window.open(
                                      selectedVenda.aparelho_fotos![
                                        vendaFotosCarouselIndex
                                      ],
                                      "_blank"
                                    )
                                  }
                                />

                                {/* Controles do Carrossel */}
                                {selectedVenda.aparelho_fotos.length > 1 && (
                                  <>
                                    {/* Botão Anterior */}
                                    <Button
                                      isIconOnly
                                      size="lg"
                                      variant="flat"
                                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                      onPress={() =>
                                        setVendaFotosCarouselIndex(
                                          (prev) =>
                                            (prev -
                                              1 +
                                              selectedVenda.aparelho_fotos!
                                                .length) %
                                            selectedVenda.aparelho_fotos!.length
                                        )
                                      }
                                    >
                                      <ChevronLeftIcon className="w-6 h-6" />
                                    </Button>

                                    {/* Botão Próximo */}
                                    <Button
                                      isIconOnly
                                      size="lg"
                                      variant="flat"
                                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white hover:bg-black/90"
                                      onPress={() =>
                                        setVendaFotosCarouselIndex(
                                          (prev) =>
                                            (prev + 1) %
                                            selectedVenda.aparelho_fotos!.length
                                        )
                                      }
                                    >
                                      <ChevronRightIcon className="w-6 h-6" />
                                    </Button>

                                    {/* Indicador de posição */}
                                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                      {vendaFotosCarouselIndex + 1} /{" "}
                                      {selectedVenda.aparelho_fotos.length}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Miniaturas */}
                              {selectedVenda.aparelho_fotos.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto bg-gray-200">
                                  {selectedVenda.aparelho_fotos.map(
                                    (url, idx) => (
                                      <button
                                        key={idx}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                          idx === vendaFotosCarouselIndex
                                            ? "border-primary scale-110"
                                            : "border-gray-300 opacity-60 hover:opacity-100"
                                        }`}
                                        onClick={() =>
                                          setVendaFotosCarouselIndex(idx)
                                        }
                                      >
                                        <img
                                          src={url}
                                          alt={`Miniatura ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      )}
                  </div>
                )}

                {/* Modal de Edição da Venda */}
                {modalType === "editar-venda" && selectedVenda && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cliente - Nome somente leitura pois vem do autocomplete */}
                    <Input
                      label="Cliente"
                      value={formVenda.cliente_nome}
                      isReadOnly
                      className="font-medium"
                    />
                    <Input
                      label="CPF"
                      value={formVenda.cliente_cpf || ""}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          cliente_cpf: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Telefone"
                      value={formVenda.cliente_telefone || ""}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          cliente_telefone: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="E-mail"
                      value={formVenda.cliente_email || ""}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          cliente_email: e.target.value,
                        })
                      }
                    />

                    {/* Valores */}
                    <Input
                      label="Valor do Aparelho *"
                      type="number"
                      value={formVenda.valor_aparelho?.toString() || "0"}
                      onChange={(e) => {
                        const valor = parseFloat(e.target.value) || 0;
                        setFormVenda({
                          ...formVenda,
                          valor_aparelho: valor,
                          valor_final: calcularValorFinal(
                            valor,
                            formVenda.desconto || 0
                          ),
                        });
                      }}
                      isRequired
                    />
                    <Input
                      label="Desconto"
                      type="number"
                      value={formVenda.desconto?.toString() || "0"}
                      onChange={(e) => {
                        const desconto = parseFloat(e.target.value) || 0;
                        setFormVenda({
                          ...formVenda,
                          desconto,
                          valor_final: calcularValorFinal(
                            formVenda.valor_aparelho || 0,
                            desconto
                          ),
                        });
                      }}
                    />
                    <Input
                      label="Valor Final"
                      type="number"
                      value={formVenda.valor_final?.toString() || "0"}
                      isReadOnly
                      classNames={{ input: "font-bold text-lg" }}
                    />

                    {/* Pagamento */}
                    <Select
                      label="Forma de Pagamento"
                      selectedKeys={[formVenda.forma_pagamento || "pix"]}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          forma_pagamento: e.target.value as FormaPagamento,
                        })
                      }
                    >
                      <SelectItem key="dinheiro">Dinheiro</SelectItem>
                      <SelectItem key="pix">PIX</SelectItem>
                      <SelectItem key="debito">Débito</SelectItem>
                      <SelectItem key="credito">Crédito</SelectItem>
                      <SelectItem key="carteira_digital">
                        Carteira Digital
                      </SelectItem>
                    </Select>

                    {formVenda.forma_pagamento === "credito" && (
                      <Input
                        label="Parcelas"
                        type="number"
                        min="1"
                        value={formVenda.parcelas?.toString() || "1"}
                        onChange={(e) =>
                          setFormVenda({
                            ...formVenda,
                            parcelas: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    )}

                    <Select
                      label="Status do Pagamento"
                      selectedKeys={[formVenda.status || "pendente"]}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          status: e.target.value as StatusVenda,
                        })
                      }
                    >
                      <SelectItem key="pendente">Pendente</SelectItem>
                      <SelectItem key="pago">Pago</SelectItem>
                      <SelectItem key="cancelado">Cancelado</SelectItem>
                      <SelectItem key="estornado">Estornado</SelectItem>
                    </Select>

                    <Input
                      label="Garantia (meses)"
                      type="number"
                      value={formVenda.garantia_meses?.toString() || "3"}
                      onChange={(e) =>
                        setFormVenda({
                          ...formVenda,
                          garantia_meses: parseInt(e.target.value) || 3,
                        })
                      }
                    />

                    <div className="md:col-span-2">
                      <Textarea
                        label="Observações"
                        value={formVenda.aparelho_observacoes || ""}
                        onChange={(e) =>
                          setFormVenda({
                            ...formVenda,
                            aparelho_observacoes: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                {modalType === "cadastro" && (
                  <Button
                    color="primary"
                    onPress={handleCadastrarAparelho}
                    isLoading={loading}
                  >
                    {selectedAparelho ? "Atualizar" : "Cadastrar"}
                  </Button>
                )}
                {modalType === "venda" && (
                  <Button
                    color="success"
                    onPress={handleVenderAparelho}
                    isLoading={loading}
                  >
                    Finalizar Venda
                  </Button>
                )}
                {modalType === "detalhes-venda" && (
                  <Button
                    color="primary"
                    onPress={() => {
                      if (selectedVenda) {
                        handleOpenEditarVenda(selectedVenda);
                      }
                    }}
                  >
                    Editar Venda
                  </Button>
                )}
                {modalType === "editar-venda" && (
                  <Button
                    color="success"
                    onPress={handleSalvarEdicaoVenda}
                    isLoading={loading}
                  >
                    Salvar Alterações
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Logs de Atividades */}
      <Modal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-6 h-6" />
              <span>Histórico de Atividades</span>
            </div>
            <p className="text-sm font-normal text-gray-500">
              {logs.length} registro(s) encontrado(s)
            </p>
          </ModalHeader>
          <ModalBody>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
              <Select
                label="Tipo de Ação"
                placeholder="Todos"
                selectedKeys={filtroTipoLog === "todos" ? [] : [filtroTipoLog]}
                onChange={(e) => setFiltroTipoLog(e.target.value || "todos")}
                startContent={<FunnelIcon className="w-4 h-4" />}
              >
                <SelectItem key="todos">Todos</SelectItem>
                <SelectItem key="cadastro">Cadastros</SelectItem>
                <SelectItem key="venda">Vendas</SelectItem>
                <SelectItem key="edicao">Edições</SelectItem>
                <SelectItem key="exclusao">Exclusões</SelectItem>
                <SelectItem key="erro">Erros</SelectItem>
              </Select>

              <Input
                label="Data"
                type="date"
                value={filtroDataLog}
                onChange={(e) => setFiltroDataLog(e.target.value)}
              />

              <Input
                label="Cliente"
                placeholder="Filtrar por cliente..."
                value={filtroClienteLog}
                onChange={(e) => setFiltroClienteLog(e.target.value)}
              />

              <Input
                label="Buscar"
                placeholder="Buscar em detalhes..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
              />
            </div>

            {/* Lista de Logs */}
            <div className="space-y-2">
              {logs
                .filter((log) => {
                  // Filtro por tipo
                  if (filtroTipoLog !== "todos" && log.tipo !== filtroTipoLog)
                    return false;

                  // Filtro por data
                  if (filtroDataLog) {
                    const logDate = new Date(log.timestamp)
                      .toISOString()
                      .split("T")[0];
                    if (logDate !== filtroDataLog) return false;
                  }

                  // Filtro por cliente
                  if (
                    filtroClienteLog &&
                    !log.cliente
                      ?.toLowerCase()
                      .includes(filtroClienteLog.toLowerCase())
                  ) {
                    return false;
                  }

                  // Busca em detalhes
                  if (
                    searchLog &&
                    !log.detalhes
                      .toLowerCase()
                      .includes(searchLog.toLowerCase()) &&
                    !log.acao.toLowerCase().includes(searchLog.toLowerCase())
                  ) {
                    return false;
                  }

                  return true;
                })
                .map((log) => (
                  <Card
                    key={log.id}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        log.tipo === "venda"
                          ? "#10b981"
                          : log.tipo === "cadastro"
                            ? "#3b82f6"
                            : log.tipo === "edicao"
                              ? "#f59e0b"
                              : log.tipo === "exclusao"
                                ? "#ef4444"
                                : "#6b7280",
                    }}
                  >
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Chip
                              size="sm"
                              color={
                                log.tipo === "venda"
                                  ? "success"
                                  : log.tipo === "cadastro"
                                    ? "primary"
                                    : log.tipo === "edicao"
                                      ? "warning"
                                      : log.tipo === "exclusao"
                                        ? "danger"
                                        : "default"
                              }
                            >
                              {log.tipo.toUpperCase()}
                            </Chip>
                            <span className="font-semibold">{log.acao}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {log.detalhes}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>
                              📅 {formatarDataHora(log.timestamp.toISOString())}
                            </span>
                            {log.cliente && (
                              <span>👤 Cliente: {log.cliente}</span>
                            )}
                            {log.usuario && (
                              <span>👨‍💼 Usuário: {log.usuario}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}

              {logs.filter((log) => {
                if (filtroTipoLog !== "todos" && log.tipo !== filtroTipoLog)
                  return false;
                if (filtroDataLog) {
                  const logDate = new Date(log.timestamp)
                    .toISOString()
                    .split("T")[0];
                  if (logDate !== filtroDataLog) return false;
                }
                if (
                  filtroClienteLog &&
                  !log.cliente
                    ?.toLowerCase()
                    .includes(filtroClienteLog.toLowerCase())
                ) {
                  return false;
                }
                if (
                  searchLog &&
                  !log.detalhes
                    .toLowerCase()
                    .includes(searchLog.toLowerCase()) &&
                  !log.acao.toLowerCase().includes(searchLog.toLowerCase())
                ) {
                  return false;
                }
                return true;
              }).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Nenhum log encontrado</p>
                  <p className="text-sm">
                    Ajuste os filtros ou realize ações no sistema
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => {
                if (confirm("Deseja realmente limpar todos os logs?")) {
                  setLogs([]);
                  toast.success("Logs limpos com sucesso!");
                }
              }}
            >
              Limpar Logs
            </Button>
            <Button color="primary" onPress={() => setIsLogsModalOpen(false)}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Leitura de IMEI com Câmera */}
      <Modal
        isOpen={isCameraModalOpen}
        onClose={fecharCameraIMEI}
        size="4xl"
        backdrop="blur"
        scrollBehavior="outside"
        isDismissable={false}
        hideCloseButton={false}
        classNames={{
          base: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="bg-gray-700 dark:bg-gray-600 p-2.5 rounded-xl">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {scanMode === "ocr"
                      ? "Scanner de IMEI"
                      : "Leitor de Código de Barras"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    {scanMode === "ocr"
                      ? "Detecção automática usando OCR"
                      : "Leitura automática de códigos de barras"}
                  </p>
                </div>
              </div>
              <Chip
                color={cameraStream ? "success" : "warning"}
                variant="flat"
                size="sm"
                startContent={
                  cameraStream ? (
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-warning" />
                  )
                }
              >
                {cameraStream ? "Câmera Ativa" : "Câmera Inativa"}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-6">
              {/* Seletor de modo de leitura */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant={scanMode === "ocr" ? "solid" : "flat"}
                  color={scanMode === "ocr" ? "primary" : "default"}
                  onPress={() => setScanMode("ocr")}
                  className="flex-1 max-w-xs"
                >
                  📝 Números (OCR)
                </Button>
                <Button
                  size="sm"
                  variant={scanMode === "barcode" ? "solid" : "flat"}
                  color={scanMode === "barcode" ? "primary" : "default"}
                  onPress={() => setScanMode("barcode")}
                  className="flex-1 max-w-xs"
                >
                  📊 Código de Barras
                </Button>
              </div>

              {/* Dica especial para códigos pequenos */}
              {scanMode === "barcode" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">💡</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                        Dica para Códigos Pequenos
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Aproxime BEM o código da câmera (5-10cm) e mantenha
                        firme. Use boa iluminação!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instrucções rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-700 dark:bg-gray-600 text-white rounded-lg p-2 text-xl font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        Posicione
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {scanMode === "ocr"
                          ? "IMEI dentro do quadro"
                          : "Código de barras no centro"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-700 dark:bg-gray-600 text-white rounded-lg p-2 text-xl font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        Foque
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {scanMode === "ocr"
                          ? "Aguarde imagem nítida"
                          : "Se pequeno, APROXIME BEM da câmera"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-700 dark:bg-gray-600 text-white rounded-lg p-2 text-xl font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        Capture
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Clique no botão abaixo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview da câmera */}
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-700 min-h-[500px]">
                {/* Botão para ativar câmera se não estiver ativa */}
                {!cameraStream && !isRequestingCamera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-50 pointer-events-auto">
                    <div className="text-center space-y-4 p-8 pointer-events-auto">
                      <div className="text-6xl mb-4">📷</div>
                      <h3 className="text-white text-xl font-bold">
                        Câmera Desativada
                      </h3>
                      <p className="text-gray-300 text-sm max-w-md">
                        Clique no botão abaixo para ativar a câmera e começar a
                        escanear
                      </p>
                      <Button
                        color="primary"
                        size="lg"
                        onPress={() => {
                          console.log("🟢 Botão Ativar Câmera clicado!");
                          solicitarPermissaoCamera();
                        }}
                        className="mt-4 pointer-events-auto cursor-pointer"
                        startContent={<CameraIcon className="w-5 h-5" />}
                      >
                        Ativar Câmera
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading quando estiver solicitando permissão */}
                {isRequestingCamera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-50">
                    <div className="text-center space-y-4 p-8">
                      <Spinner size="lg" color="primary" />
                      <p className="text-white text-lg font-semibold">
                        Solicitando permissão da câmera...
                      </p>
                      <p className="text-gray-300 text-sm">
                        Permita o acesso nas configurações do navegador
                      </p>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay de guia modernizado - só aparece quando a câmera está ativa */}
                {cameraStream && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {/* Cantos do scanner */}
                    <div className="relative w-3/4 h-1/2">
                      {/* Canto superior esquerdo */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-white/70 rounded-tl-xl"></div>
                      {/* Canto superior direito */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-white/70 rounded-tr-xl"></div>
                      {/* Canto inferior esquerdo */}
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-white/70 rounded-bl-xl"></div>
                      {/* Canto inferior direito */}
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-white/70 rounded-br-xl"></div>

                      {/* Linha de scan animada */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div
                          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse shadow-lg shadow-white/30"
                          style={{ top: "50%" }}
                        ></div>
                      </div>

                      {/* Label central */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/20 text-white/60 px-6 py-3 rounded-xl font-bold text-lg shadow-xl backdrop-blur-sm border border-white/20">
                          {scanMode === "ocr"
                            ? "📱 Posicione o IMEI aqui"
                            : "📊 Posicione o código de barras aqui"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicadores de status nos cantos - só aparece quando a câmera está ativa */}
                {cameraStream && (
                  <>
                    <div className="absolute top-4 left-4 z-30">
                      <Chip
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={
                          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        }
                      >
                        {scanMode === "barcode" ? "ESCANEANDO" : "AO VIVO"}
                      </Chip>
                    </div>
                    <div className="absolute top-4 right-4 z-30">
                      <Chip size="sm" variant="flat" color="warning">
                        15 dígitos
                      </Chip>
                    </div>
                  </>
                )}

                {/* Botão de captura estilo câmera de celular - só aparece quando a câmera está ativa */}
                {cameraStream && (
                  <div className="absolute bottom-8 inset-x-0 flex items-center justify-center z-30">
                    {/* Botão de reset (miniatura à esquerda) - posicionado absolutamente */}
                    {lastCapturedImage && (
                      <button
                        onClick={() => {
                          setLastCapturedImage(null);
                          setLastDetectedText("");
                          toast.success("Pronto para nova captura!");
                        }}
                        className="absolute left-8 w-12 h-12 rounded-lg overflow-hidden border-2 border-white/80 shadow-lg backdrop-blur-sm bg-white/20 hover:scale-110 transition-transform"
                      >
                        <img
                          src={lastCapturedImage}
                          alt="Última captura"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}

                    {/* Botão principal de captura - estilo iPhone - sempre centralizado */}
                    <button
                      onClick={capturarELerIMEI}
                      disabled={isScanningIMEI}
                      className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Anel externo */}
                      <div className="w-20 h-20 rounded-full border-4 border-white/90 shadow-2xl backdrop-blur-md bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {/* Círculo interno */}
                        <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center group-active:scale-90 transition-transform">
                          {isScanningIMEI ? (
                            <Spinner size="sm" color="default" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-200"></div>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Texto de ajuda no modo barcode */}
                    {scanMode === "barcode" && !isScanningIMEI && (
                      <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2 text-white text-sm text-center backdrop-blur-sm bg-black/30 px-4 py-2 rounded-full">
                        Escaneando... ou clique para capturar
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resultado do OCR */}
              {lastDetectedText && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                    <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                      📸 RESULTADO DA LEITURA
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        OCR - Texto Detectado
                      </p>
                      {lastDetectedText.includes("✓") ? (
                        <Chip size="sm" color="success" variant="flat">
                          ✓ Válido
                        </Chip>
                      ) : lastDetectedText.includes("❌") ? (
                        <Chip size="sm" color="danger" variant="flat">
                          ✗ Inválido
                        </Chip>
                      ) : (
                        <Chip size="sm" color="warning" variant="flat">
                          ⚠ Incompleto
                        </Chip>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-950 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                      <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 whitespace-pre-line break-all">
                        {lastDetectedText}
                      </p>
                    </div>

                    {/* Dicas rápidas */}
                    {!lastDetectedText.includes("✓") && (
                      <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                        <p className="font-semibold text-xs text-orange-800 dark:text-orange-300 mb-2">
                          💡 Não funcionou?
                        </p>
                        <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
                          <li>• Aproxime ou afaste a câmera</li>
                          <li>• Melhore a iluminação</li>
                          <li>• Limpe a lente da câmera</li>
                          <li>• Digite manualmente se necessário</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button
              color="danger"
              variant="light"
              onPress={fecharCameraIMEI}
              size="lg"
              className="font-semibold"
              startContent={<XMarkIcon className="w-5 h-5" />}
            >
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
