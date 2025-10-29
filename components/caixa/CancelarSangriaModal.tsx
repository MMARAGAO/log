"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import {
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { Sangria } from "./types";

interface CancelarSangriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sangria: Sangria | null;
  motivoCancelamento: string;
  onMotivoChange: (motivo: string) => void;
  onConfirmar: () => void;
  loading: boolean;
}

export default function CancelarSangriaModal({
  isOpen,
  onClose,
  sangria,
  motivoCancelamento,
  onMotivoChange,
  onConfirmar,
  loading,
}: CancelarSangriaModalProps) {
  if (!sangria) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-danger-50 rounded-t-lg">
          <XCircleIcon className="w-6 h-6 text-danger-600" />
          <span className="text-danger-800">Cancelar Sangria</span>
        </ModalHeader>
        <ModalBody className="py-6">
          {/* Aviso */}
          <div className="flex items-start gap-3 p-4 bg-warning-50 rounded-lg border border-warning-200 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-800 mb-1">
                Atenção!
              </p>
              <p className="text-sm text-warning-700">
                Ao cancelar esta sangria, o valor será revertido no caixa. Esta
                ação ficará registrada no histórico para auditoria.
              </p>
            </div>
          </div>

          {/* Informações da Sangria */}
          <div className="space-y-3 mb-4">
            <div className="p-4 bg-default-50 rounded-lg border border-default-200">
              <h3 className="text-sm font-semibold text-default-600 mb-3">
                Informações da Sangria
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-default-500 mb-1">Valor</p>
                  <p className="text-lg font-bold text-danger-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(sangria.valor)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500 mb-1">Data</p>
                  <p className="text-sm font-semibold text-default-700">
                    {new Date(sangria.data_sangria).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-default-500 mb-1">Motivo Original</p>
                <p className="text-sm text-default-700">{sangria.motivo}</p>
              </div>
            </div>
          </div>

          {/* Campo para motivo do cancelamento */}
          <div>
            <Textarea
              label="Motivo do Cancelamento"
              placeholder="Ex: Erro no valor informado, sangria realizada por engano, etc."
              value={motivoCancelamento}
              onValueChange={onMotivoChange}
              minRows={3}
              maxRows={5}
              isRequired
              variant="bordered"
              description="Este motivo ficará registrado no histórico"
              classNames={{
                input: "resize-y",
              }}
            />
          </div>
        </ModalBody>
        <ModalFooter className="bg-default-50 rounded-b-lg">
          <Button
            color="default"
            variant="light"
            onPress={onClose}
            isDisabled={loading}
          >
            Cancelar
          </Button>
          <Button
            color="danger"
            onPress={onConfirmar}
            isLoading={loading}
            isDisabled={!motivoCancelamento.trim() || loading}
            startContent={!loading ? <XCircleIcon className="w-5 h-5" /> : null}
          >
            Confirmar Cancelamento
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
