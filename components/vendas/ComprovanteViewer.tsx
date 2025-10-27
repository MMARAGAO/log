/**
 * Componente para visualizar comprovantes de pagamento
 * Usado no sistema de vendas
 */

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardBody,
  Image,
} from "@heroui/react";
import {
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";

interface ComprovanteViewerProps {
  comprovantes: string[];
  isOpen: boolean;
  onClose: () => void;
  vendaId?: number;
}

export function ComprovanteViewer({
  comprovantes,
  isOpen,
  onClose,
  vendaId,
}: ComprovanteViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!comprovantes || comprovantes.length === 0) {
    return null;
  }

  const currentUrl = comprovantes[currentIndex];
  const isPDF = currentUrl.toLowerCase().endsWith(".pdf");
  const fileName =
    currentUrl.split("/").pop() || `comprovante_${currentIndex + 1}`;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : comprovantes.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < comprovantes.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erro ao baixar comprovante:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPDF ? (
              <DocumentTextIcon className="w-6 h-6 text-danger" />
            ) : (
              <PhotoIcon className="w-6 h-6 text-primary" />
            )}
            <span>
              Comprovante {currentIndex + 1} de {comprovantes.length}
              {vendaId && ` - Venda #${vendaId}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<CloudArrowDownIcon className="w-4 h-4" />}
              onPress={handleDownload}
            >
              Baixar
            </Button>
          </div>
        </ModalHeader>
        <ModalBody className="p-4">
          <Card className="border-2 border-default-200">
            <CardBody className="p-0 overflow-hidden">
              {isPDF ? (
                <iframe
                  src={currentUrl}
                  className="w-full h-[600px]"
                  title={`Comprovante ${currentIndex + 1}`}
                />
              ) : (
                <div className="flex items-center justify-center bg-default-100 min-h-[600px] p-4">
                  <Image
                    src={currentUrl}
                    alt={`Comprovante ${currentIndex + 1}`}
                    className="max-w-full max-h-[580px] object-contain"
                  />
                </div>
              )}
            </CardBody>
          </Card>

          {/* Navegação entre comprovantes */}
          {comprovantes.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="flat"
                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                onPress={handlePrevious}
              >
                Anterior
              </Button>

              <div className="flex gap-2">
                {comprovantes.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? "bg-primary w-8"
                        : "bg-default-300 hover:bg-default-400"
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Ver comprovante ${idx + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="flat"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
                onPress={handleNext}
              >
                Próximo
              </Button>
            </div>
          )}

          {/* Miniaturas (thumbnail) */}
          {comprovantes.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {comprovantes.map((url, idx) => {
                const isCurrentPDF = url.toLowerCase().endsWith(".pdf");
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all ${
                      idx === currentIndex
                        ? "border-primary scale-105 shadow-lg"
                        : "border-default-200 hover:border-primary-300 opacity-60"
                    }`}
                  >
                    {isCurrentPDF ? (
                      <div className="w-full h-full flex items-center justify-center bg-danger-50">
                        <DocumentTextIcon className="w-8 h-8 text-danger" />
                      </div>
                    ) : (
                      <Image
                        src={url}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ComprovanteViewer;
