"use client";

import { useRef, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Spinner,
} from "@heroui/react";
import { CameraIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { createWorker } from "tesseract.js";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface IMEIScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIMEIDetected: (imei: string) => void;
}

export default function IMEIScannerModal({
  isOpen,
  onClose,
  onIMEIDetected,
}: IMEIScannerModalProps) {
  const [isScanningIMEI, setIsScanningIMEI] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
    null
  );
  const [lastDetectedText, setLastDetectedText] = useState<string>("");
  const [scanMode, setScanMode] = useState<"ocr" | "barcode">("ocr");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Iniciar leitura automática quando o modo de código de barras for ativado
  useEffect(() => {
    if (isOpen && scanMode === "barcode" && videoRef.current) {
      const timer = setTimeout(() => {
        iniciarLeituraAutomatica();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scanMode]);

  const solicitarPermissaoCamera = async () => {
    setIsRequestingCamera(true);
    console.log("📷 Solicitando acesso à câmera...");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(
          "Câmera não disponível. Use HTTPS ou um navegador compatível."
        );
        setIsRequestingCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      console.log("✅ Câmera acessada com sucesso");
      setCameraStream(stream);
      setIsRequestingCamera(false);

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
      setIsRequestingCamera(false);

      if (error.name === "NotAllowedError") {
        toast.error("Permissão de câmera negada. Habilite nas configurações.");
      } else if (error.name === "NotFoundError") {
        toast.error("Nenhuma câmera encontrada no dispositivo.");
      } else if (error.name === "OverconstrainedError") {
        toast.error(
          "Câmera não suporta a resolução solicitada. Tentando com configurações básicas..."
        );
        setTimeout(() => solicitarPermissaoCameraBasica(), 1000);
      } else {
        toast.error(
          `Erro ao acessar câmera: ${error.message || "Desconhecido"}`
        );
      }
    }
  };

  const solicitarPermissaoCameraBasica = async () => {
    console.log("📱 Tentando com configurações básicas da câmera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      console.log("✅ Câmera acessada com configurações básicas");
      setCameraStream(stream);
      setIsRequestingCamera(false);
      toast.success("Câmera ativada com sucesso!");

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

  const fecharCamera = () => {
    console.log("🔴 Fechando câmera");
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (barcodeReaderRef.current) {
      barcodeReaderRef.current = null;
    }
    setIsScanningIMEI(false);
    setLastCapturedImage(null);
    setLastDetectedText("");
    setIsRequestingCamera(false);
  };

  const handleClose = () => {
    fecharCamera();
    onClose();
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
        console.log(
          "🔧 Configurando scanner com modo TRY_HARDER para códigos pequenos"
        );
        const hints = new Map();
        hints.set(2, true);
        barcodeReaderRef.current.hints = hints;
      }

      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const scanBarcodeArea = async () => {
        if (!video.videoWidth || !video.videoHeight) {
          requestAnimationFrame(scanBarcodeArea);
          return;
        }

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        const rectWidth = videoWidth * 0.8;
        const rectHeight = Math.min(120, videoHeight * 0.3);
        const rectX = (videoWidth - rectWidth) / 2;
        const rectY = (videoHeight - rectHeight) / 2;

        canvas.width = rectWidth;
        canvas.height = rectHeight;

        if (context) {
          context.drawImage(
            video,
            rectX,
            rectY,
            rectWidth,
            rectHeight,
            0,
            0,
            rectWidth,
            rectHeight
          );

          try {
            const imageUrl = canvas.toDataURL("image/png");
            const result =
              await barcodeReaderRef.current!.decodeFromImageUrl(imageUrl);

            if (result) {
              const codigoBarras = result.getText();
              console.log("📊 Código detectado na área:", codigoBarras);

              if (/^\d{15}$/.test(codigoBarras)) {
                console.log(
                  "✅ Código de 15 dígitos encontrado:",
                  codigoBarras
                );

                if (canvasRef.current) {
                  canvasRef.current.width = rectWidth;
                  canvasRef.current.height = rectHeight;
                  const previewContext = canvasRef.current.getContext("2d");
                  if (previewContext) {
                    previewContext.drawImage(canvas, 0, 0);
                    setLastCapturedImage(
                      canvasRef.current.toDataURL("image/png")
                    );
                  }
                }

                setLastDetectedText(`✓ IMEI detectado:\n${codigoBarras}`);
                onIMEIDetected(codigoBarras);

                toast.success(`IMEI ${codigoBarras} detectado!`, {
                  id: "scanning",
                });

                barcodeReaderRef.current = null;
                setTimeout(() => handleClose(), 1000);
                return;
              } else {
                console.log(
                  `⚠️ Código ignorado (não tem 15 dígitos): ${codigoBarras}`
                );
              }
            }
          } catch (error: any) {
            if (error.name !== "NotFoundException") {
              console.error("❌ Erro ao decodificar:", error);
            }
          }
        }

        if (barcodeReaderRef.current) {
          requestAnimationFrame(scanBarcodeArea);
        }
      };

      scanBarcodeArea();

      toast.loading(
        "📊 Escaneando... Se o código for pequeno, aproxime BEM da câmera",
        {
          id: "scanning",
          duration: 15000,
        }
      );
    } catch (error: any) {
      console.error("❌ Erro ao iniciar leitura automática:", error);
      toast.error("Erro ao iniciar scanner", { id: "scanning" });
    }
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

      const result = await barcodeReaderRef.current.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current
      );

      const codigoBarras = result.getText();
      console.log("📊 Código detectado:", codigoBarras);

      if (/^\d{15}$/.test(codigoBarras)) {
        console.log("✅ Código de 15 dígitos encontrado:", codigoBarras);

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
        onIMEIDetected(codigoBarras);

        toast.success(`IMEI ${codigoBarras} detectado!`, { id: "scanning" });
        setTimeout(() => handleClose(), 1000);
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
    if (scanMode === "barcode") {
      return capturarCodigoBarrasManual();
    }

    console.log("🎯 Iniciando captura de IMEI com OCR...");

    if (!videoRef.current || !canvasRef.current) {
      console.error("❌ Refs não disponíveis");
      toast.error("Erro: Câmera não inicializada");
      return;
    }

    setIsScanningIMEI(true);
    toast.loading("Lendo IMEI...", { id: "scanning" });

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Vídeo não está pronto. Aguarde a câmera carregar.");
      }

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Não foi possível obter contexto do canvas");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const grayValues: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        grayValues.push(gray);
      }

      const avgGray = grayValues.reduce((a, b) => a + b, 0) / grayValues.length;
      const threshold = avgGray;

      for (let i = 0; i < data.length; i += 4) {
        const gray = grayValues[i / 4];
        const binaryValue = gray > threshold ? 255 : 0;
        const finalValue = binaryValue > 127 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = finalValue;
      }

      context.putImageData(imageData, 0, 0);

      const capturedImageUrl = canvas.toDataURL("image/png");
      setLastCapturedImage(capturedImageUrl);

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

      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
      });

      const {
        data: { text },
      } = await worker.recognize(capturedImageUrl);
      await worker.terminate();

      const textoLimpo = text.replace(/\s+/g, "").replace(/[^\d]/g, "");

      console.log("📝 Texto detectado:", textoLimpo);

      const imeis = textoLimpo.match(/\d{15}/g);

      if (imeis && imeis.length > 0) {
        const imei = imeis[0];
        console.log("✅ IMEI encontrado:", imei);

        setLastDetectedText(`✓ IMEI detectado:\n${imei}`);
        onIMEIDetected(imei);

        toast.success(`IMEI ${imei} detectado com sucesso!`, {
          id: "scanning",
        });

        setTimeout(() => handleClose(), 1500);
      } else if (textoLimpo.length > 0) {
        console.log(
          `⚠️ Números encontrados mas não formam IMEI: ${textoLimpo}`
        );
        setLastDetectedText(
          `⚠️ Números detectados (${textoLimpo.length} dígitos):\n${textoLimpo}\n\n${
            textoLimpo.length < 15
              ? "❌ Menos de 15 dígitos. Tente melhorar a qualidade da imagem."
              : "❌ Mais de 15 dígitos. Posicione apenas o IMEI no quadro."
          }`
        );
        toast.error(
          textoLimpo.length < 15
            ? "Texto incompleto. Tente novamente com melhor iluminação."
            : "Múltiplos números detectados. Posicione apenas o IMEI.",
          { id: "scanning", duration: 3000 }
        );
      } else {
        console.log("❌ Nenhum número detectado");
        setLastDetectedText(
          "❌ Nenhum número detectado\n\nDicas:\n• Melhore a iluminação\n• Aproxime a câmera\n• Posicione o IMEI dentro do quadro\n• Limpe a lente da câmera"
        );
        toast.error("Nenhum texto detectado. Tente melhorar a iluminação.", {
          id: "scanning",
        });
      }
    } catch (error: any) {
      console.error("❌ Erro no OCR:", error);
      toast.error(`Erro ao processar imagem: ${error.message}`, {
        id: "scanning",
      });
    } finally {
      setIsScanningIMEI(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
                      Aproxime BEM o código da câmera (5-10cm) e mantenha firme.
                      Use boa iluminação!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instruções rápidas */}
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

              {/* Overlay de guia - formato muda conforme o modo */}
              {cameraStream && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {scanMode === "barcode" ? (
                    <>
                      <div className="absolute inset-0 bg-black/60"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="relative bg-transparent border-4 border-green-400 rounded-xl shadow-2xl shadow-green-500/50"
                          style={{ width: "80%", height: "120px" }}
                        >
                          <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg"></div>

                          <div className="absolute inset-0 overflow-hidden">
                            <div
                              className="absolute h-full w-1 bg-gradient-to-b from-transparent via-green-400 to-transparent animate-scan-horizontal shadow-lg shadow-green-400/50"
                              style={{
                                animation: "scan-horizontal 2s linear infinite",
                              }}
                            ></div>
                          </div>

                          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap backdrop-blur-sm border border-green-400/50">
                            📊 Alinhe o código de barras aqui
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-3/4 h-1/2">
                        <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-white/70 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-white/70 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-white/70 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-white/70 rounded-br-xl"></div>

                        <div className="absolute inset-0 overflow-hidden">
                          <div
                            className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse shadow-lg shadow-white/30"
                            style={{ top: "50%" }}
                          ></div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/20 text-white/60 px-6 py-3 rounded-xl font-bold text-lg shadow-xl backdrop-blur-sm border border-white/20">
                            📱 Posicione o IMEI aqui
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Indicadores de status nos cantos */}
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

              {/* Botão de captura estilo câmera de celular */}
              {cameraStream && (
                <div className="absolute bottom-8 inset-x-0 flex items-center justify-center z-30">
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

                  <button
                    onClick={capturarELerIMEI}
                    disabled={isScanningIMEI}
                    className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-20 h-20 rounded-full border-4 border-white/90 shadow-2xl backdrop-blur-md bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center group-active:scale-90 transition-transform">
                        {isScanningIMEI ? (
                          <Spinner size="sm" color="default" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-200"></div>
                        )}
                      </div>
                    </div>
                  </button>

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
            onPress={handleClose}
            size="lg"
            className="font-semibold"
            startContent={<XMarkIcon className="w-5 h-5" />}
          >
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
