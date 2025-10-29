"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { currencyMask, currencyToNumber } from "@/utils/maskInput";
import type { CaixaAberto, Loja, FormSangria } from "./types";

interface SangriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixa: CaixaAberto | null;
  loja: Loja | undefined;
  form: FormSangria;
  onChangeForm: (field: keyof FormSangria, value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function SangriaModal({
  isOpen,
  onClose,
  caixa,
  loja,
  form,
  onChangeForm,
  onSubmit,
  loading = false,
}: SangriaModalProps) {
  if (!caixa) return null;

  const handleSubmit = () => {
    const valorNumerico = currencyToNumber(form.valor);
    if (!valorNumerico || valorNumerico <= 0) {
      return;
    }
    if (!form.motivo.trim()) {
      return;
    }
    onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-warning-50 rounded-t-lg">
          <BanknotesIcon className="w-6 h-6 text-warning-600" />
          <div>
            <span className="text-warning-800">Realizar Sangria</span>
            <p className="text-sm font-normal text-warning-600">{loja?.nome}</p>
          </div>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-4">
            <Input
              label="Valor da Sangria"
              placeholder="R$ 0,00"
              value={form.valor}
              onChange={(e) =>
                onChangeForm("valor", currencyMask(e.target.value))
              }
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">R$</span>
                </div>
              }
              variant="bordered"
              isRequired
            />

            <Textarea
              label="Motivo da Sangria"
              placeholder="Descreva o motivo da sangria..."
              value={form.motivo}
              onChange={(e) => onChangeForm("motivo", e.target.value)}
              variant="bordered"
              minRows={3}
              isRequired
            />

            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-sm text-warning-700">
                ⚠️ A sangria remove dinheiro do caixa. Certifique-se de
                registrar o valor e motivo corretamente.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button
            color="warning"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={
              !form.valor ||
              currencyToNumber(form.valor) <= 0 ||
              !form.motivo.trim()
            }
          >
            Confirmar Sangria
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
