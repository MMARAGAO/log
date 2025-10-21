"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Divider,
  Badge,
  Spinner,
} from "@heroui/react";

export default function Cameras() {
  const API_BASE = "http://localhost:5000";

  const cameras = Array.from({ length: 5 }, (_, i) => ({
    id: `cam_${i + 1}`,
    channel: i + 1,
    label: `Câmera ${i + 1}`,
  }));

  const [modalCamera, setModalCamera] = useState<{
    id: string;
    channel: number;
    label: string;
  } | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  const [recordingStates, setRecordingStates] = useState<{
    [channel: number]: {
      isRecording: boolean;
      recordingId: string | null;
      isProcessing: boolean; // NOVO: Prevenir cliques duplos
    };
  }>(
    cameras.reduce(
      (acc, cam) => ({
        ...acc,
        [cam.channel]: {
          isRecording: false,
          recordingId: null,
          isProcessing: false,
        },
      }),
      {}
    )
  );

  const [thumbnailTimestamps, setThumbnailTimestamps] = useState<{
    [key: string]: number;
  }>(cameras.reduce((acc, cam) => ({ ...acc, [cam.id]: 0 }), {}));

  const [thumbnailErrors, setThumbnailErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Estado de loading do stream no modal
  const [streamLoading, setStreamLoading] = useState(false);

  // NOVO: Refs para prevenir múltiplas requisições
  const processingRequests = useRef<Set<number>>(new Set());

  const makeStreamUrl = (channel: number) =>
    `${API_BASE}/stream?cam=${channel}`;

  const makeSnapshotUrl = (channel: number, timestamp: number) =>
    `${API_BASE}/snapshot?cam=${channel}&t=${timestamp}`;

  useEffect(() => {
    const now = Date.now();
    setThumbnailTimestamps(
      cameras.reduce((acc, cam) => ({ ...acc, [cam.id]: now }), {})
    );
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setThumbnailTimestamps((prev) =>
        cameras.reduce((acc, cam) => ({ ...acc, [cam.id]: Date.now() }), {})
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isMounted]);

  const handleThumbnailError = (camId: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [camId]: true }));
  };

  const handleThumbnailLoad = (camId: string) => {
    setThumbnailErrors((prev) => ({ ...prev, [camId]: false }));
  };

  // useEffect para iniciar loading quando modal abre
  useEffect(() => {
    if (modalCamera) {
      setStreamLoading(true);
    }
  }, [modalCamera]);

  // MODIFICADO: Iniciar gravação com proteção de duplicatas
  const startRecording = async (channel: number) => {
    // Prevenir múltiplas requisições simultâneas
    if (processingRequests.current.has(channel)) {
      console.log(`⚠ Requisição já em andamento para canal ${channel}`);
      return;
    }

    if (recordingStates[channel]?.isProcessing) {
      console.log(`⚠ Canal ${channel} já está processando`);
      return;
    }

    processingRequests.current.add(channel);

    setRecordingStates((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], isProcessing: true },
    }));

    try {
      const response = await fetch(`${API_BASE}/record/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecordingStates((prev) => ({
          ...prev,
          [channel]: {
            isRecording: true,
            recordingId: data.recording_id,
            isProcessing: false,
          },
        }));
        alert(
          `✓ Gravação iniciada!\nCâmera: ${channel}\nID: ${data.recording_id}`
        );
      } else {
        alert(`✗ Erro ao iniciar gravação: ${data.error}`);
        setRecordingStates((prev) => ({
          ...prev,
          [channel]: { ...prev[channel], isProcessing: false },
        }));
      }
    } catch (error) {
      alert(`✗ Erro de conexão: ${error}`);
      setRecordingStates((prev) => ({
        ...prev,
        [channel]: { ...prev[channel], isProcessing: false },
      }));
    } finally {
      processingRequests.current.delete(channel);
    }
  };

  // MODIFICADO: Parar gravação com proteção de duplicatas
  const stopRecording = async (channel: number) => {
    const recordingId = recordingStates[channel]?.recordingId;
    if (!recordingId) return;

    // Prevenir múltiplas requisições simultâneas
    if (processingRequests.current.has(channel)) {
      console.log(
        `⚠ Requisição de parada já em andamento para canal ${channel}`
      );
      return;
    }

    if (recordingStates[channel]?.isProcessing) {
      console.log(`⚠ Canal ${channel} já está processando`);
      return;
    }

    processingRequests.current.add(channel);

    setRecordingStates((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], isProcessing: true },
    }));

    try {
      const response = await fetch(`${API_BASE}/record/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recording_id: recordingId }),
      });

      const data = await response.json();

      if (response.ok) {
        setRecordingStates((prev) => ({
          ...prev,
          [channel]: {
            isRecording: false,
            recordingId: null,
            isProcessing: false,
          },
        }));
        alert(
          `✓ Gravação salva!\nCâmera: ${channel}\nArquivo: ${data.filename}\nDuração: ${data.duration}s\nTamanho: ${(data.file_size / 1024 / 1024).toFixed(1)}MB`
        );
      } else {
        alert(`✗ Erro ao parar gravação: ${data.error}`);
        setRecordingStates((prev) => ({
          ...prev,
          [channel]: { ...prev[channel], isProcessing: false },
        }));
      }
    } catch (error) {
      alert(`✗ Erro de conexão: ${error}`);
      setRecordingStates((prev) => ({
        ...prev,
        [channel]: { ...prev[channel], isProcessing: false },
      }));
    } finally {
      processingRequests.current.delete(channel);
    }
  };

  // Iniciar gravação de todas as câmeras
  const startAllRecordings = async () => {
    if (
      !confirm(`Deseja iniciar gravação em todas as ${cameras.length} câmeras?`)
    ) {
      return;
    }

    for (const cam of cameras) {
      if (!recordingStates[cam.channel]?.isRecording) {
        await startRecording(cam.channel);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay maior
      }
    }
  };

  // Parar gravação de todas as câmeras
  const stopAllRecordings = async () => {
    const recordingCameras = cameras.filter(
      (cam) => recordingStates[cam.channel]?.isRecording
    );

    if (recordingCameras.length === 0) {
      alert("Nenhuma gravação ativa no momento");
      return;
    }

    if (
      !confirm(
        `Deseja parar ${recordingCameras.length} gravação(ões) ativa(s)?`
      )
    ) {
      return;
    }

    for (const cam of recordingCameras) {
      await stopRecording(cam.channel);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const recordingCount = Object.values(recordingStates).filter(
    (state) => state.isRecording
  ).length;

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <div className="mt-4 text-xl font-semibold">
            Inicializando câmeras...
          </div>
          <div className="mt-2 text-sm text-default-500">
            Aguarde enquanto carregamos o sistema
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sistema de Câmeras
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Monitore e gerencie todas as câmeras do sistema
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {recordingCount > 0 && (
            <Badge content={recordingCount} color="danger" shape="circle">
              <Chip
                color="danger"
                variant="flat"
                startContent={
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                }
              >
                Gravando
              </Chip>
            </Badge>
          )}

          <Button
            color="danger"
            variant="solid"
            startContent={<span>●</span>}
            onPress={startAllRecordings}
            className="font-semibold"
          >
            Gravar Todas
          </Button>

          <Button
            color="default"
            variant="solid"
            startContent={<span>■</span>}
            onPress={stopAllRecordings}
            className="font-semibold"
          >
            Parar Todas
          </Button>

          <Chip color="primary" variant="flat">
            📹 {cameras.length} câmeras
          </Chip>
        </div>
      </div>

      {/* Grid de Câmeras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cameras.map((cam) => {
          const isRecording = recordingStates[cam.channel]?.isRecording;
          const isProcessing = recordingStates[cam.channel]?.isProcessing;

          return (
            <Card
              key={cam.id}
              className={`${
                isRecording
                  ? "border-2 border-danger shadow-lg shadow-danger/20"
                  : ""
              } transition-all hover:scale-105`}
            >
              <CardBody className="p-0">
                <div
                  className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                  onClick={() => setModalCamera(cam)}
                >
                  {thumbnailErrors[cam.id] ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <div className="text-5xl mb-2">📹</div>
                      <div className="text-sm font-medium">Câmera offline</div>
                    </div>
                  ) : (
                    <img
                      src={makeSnapshotUrl(
                        cam.channel,
                        thumbnailTimestamps[cam.id]
                      )}
                      alt={cam.label}
                      onError={() => handleThumbnailError(cam.id)}
                      onLoad={() => handleThumbnailLoad(cam.id)}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  <Chip
                    size="sm"
                    color={
                      isRecording
                        ? "danger"
                        : thumbnailErrors[cam.id]
                          ? "default"
                          : "success"
                    }
                    variant="solid"
                    className="absolute top-2 right-2 font-bold"
                    startContent={
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    }
                  >
                    {isRecording
                      ? "GRAVANDO"
                      : thumbnailErrors[cam.id]
                        ? "OFFLINE"
                        : "AO VIVO"}
                  </Chip>

                  {/* Overlay de hover */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center group">
                    <div className="text-6xl opacity-0 group-hover:opacity-100 transition-opacity">
                      ▶️
                    </div>
                  </div>
                </div>
              </CardBody>

              <CardFooter className="flex-col items-start gap-2 p-4">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <h3 className="font-semibold text-base">{cam.label}</h3>
                    <p className="text-xs text-default-500">
                      Canal {cam.channel}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    onPress={() => {
                      setModalCamera(cam);
                    }}
                  >
                    Visualizar
                  </Button>
                </div>

                <Button
                  fullWidth
                  size="sm"
                  color={isRecording ? "default" : "danger"}
                  variant="solid"
                  isDisabled={isProcessing}
                  isLoading={isProcessing}
                  startContent={!isProcessing && (isRecording ? "■" : "●")}
                  onPress={() => {
                    if (isProcessing) return;

                    if (isRecording) {
                      stopRecording(cam.channel);
                    } else {
                      startRecording(cam.channel);
                    }
                  }}
                  className="font-semibold"
                >
                  {isProcessing
                    ? "Processando..."
                    : isRecording
                      ? "Parar Gravação"
                      : "Gravar"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Modal de Visualização */}
      <Modal
        isOpen={!!modalCamera}
        onClose={() => setModalCamera(null)}
        size="5xl"
        scrollBehavior="outside"
        backdrop="blur"
        classNames={{
          base: "bg-background",
          backdrop: "bg-black/80",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-divider">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{modalCamera?.label}</h2>
                    <p className="text-sm text-default-500 font-normal">
                      Canal {modalCamera?.channel} • Transmissão ao vivo
                      {modalCamera &&
                        recordingStates[modalCamera.channel]?.isRecording && (
                          <span className="text-danger font-bold">
                            {" "}
                            • GRAVANDO
                          </span>
                        )}
                    </p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="p-0">
                <div className="relative bg-black w-full h-[600px] flex items-center justify-center">
                  {/* Loading Overlay */}
                  {streamLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
                      <Spinner size="lg" color="primary" />
                      <p className="mt-4 text-white text-lg font-semibold">
                        Carregando transmissão...
                      </p>
                      <p className="mt-2 text-gray-400 text-sm">
                        Conectando à câmera {modalCamera?.channel}
                      </p>
                    </div>
                  )}

                  <img
                    src={modalCamera ? makeStreamUrl(modalCamera.channel) : ""}
                    alt={modalCamera?.label || ""}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => {
                      setStreamLoading(false);
                    }}
                    onError={(e) => {
                      setStreamLoading(false);
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector(".error-overlay")) {
                        const errorDiv = document.createElement("div");
                        errorDiv.className = "error-overlay";
                        errorDiv.style.cssText = `
                          position: absolute;
                          inset: 0;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          flex-direction: column;
                          color: #fff;
                          background: rgba(0,0,0,0.9);
                        `;
                        errorDiv.innerHTML = `
                          <div style="font-size: 48px; margin-bottom: 16px">⚠️</div>
                          <div style="font-size: 18px; margin-bottom: 8px">Câmera Offline</div>
                          <div style="font-size: 14px; color: #999">Não foi possível conectar ao stream</div>
                        `;
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />

                  <Chip
                    size="lg"
                    color={
                      modalCamera &&
                      recordingStates[modalCamera.channel]?.isRecording
                        ? "danger"
                        : "success"
                    }
                    variant="solid"
                    className="absolute top-4 left-4 font-bold"
                    startContent={
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    }
                  >
                    {modalCamera &&
                    recordingStates[modalCamera.channel]?.isRecording
                      ? "● GRAVANDO"
                      : "AO VIVO - 15 FPS"}
                  </Chip>

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {modalCamera &&
                    !recordingStates[modalCamera.channel]?.isRecording ? (
                      <Button
                        color="danger"
                        variant="solid"
                        startContent={<span>●</span>}
                        onPress={() =>
                          modalCamera && startRecording(modalCamera.channel)
                        }
                        className="font-semibold"
                      >
                        Iniciar Gravação
                      </Button>
                    ) : (
                      <Button
                        color="default"
                        variant="solid"
                        startContent={<span>■</span>}
                        onPress={() =>
                          modalCamera && stopRecording(modalCamera.channel)
                        }
                        className="font-semibold"
                      >
                        Parar Gravação
                      </Button>
                    )}

                    <Button
                      isIconOnly
                      color="default"
                      variant="solid"
                      onPress={() => {
                        const img = document.querySelector(
                          `img[src*="cam=${modalCamera?.channel}"]`
                        ) as HTMLImageElement;
                        if (img) {
                          const src = img.src;
                          img.src = "";
                          setTimeout(() => (img.src = src), 100);
                        }
                      }}
                    >
                      🔄
                    </Button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
