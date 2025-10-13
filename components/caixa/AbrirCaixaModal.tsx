"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Input,
  Textarea,
} from "@heroui/react";
import {
  LockOpenIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import {
  currencyMask,
  currencyToNumber,
  numberToCurrencyInput,
} from "@/utils/maskInput";
import type { Loja, FormAbrir } from "./types";

interface AbrirCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lojas: Loja[];
  formData: FormAbrir;
  onFormChange: (field: keyof FormAbrir, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function AbrirCaixaModal({
  isOpen,
  onClose,
  lojas,
  formData,
  onFormChange,
  onSubmit,
  loading,
}: AbrirCaixaModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-success-50 rounded-t-lg">
          <LockOpenIcon className="w-6 h-6 text-success-600" />
          <span className="text-success-800">Abrir Novo Caixa</span>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-4">
            <Select
              label="Selecione a Loja"
              placeholder="Escolha a loja"
              selectedKeys={formData.loja_id ? [formData.loja_id] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                onFormChange("loja_id", key);
              }}
              isRequired
              variant="bordered"
              startContent={<BanknotesIcon className="w-5 h-5" />}
            >
              {lojas.map((loja) => (
                <SelectItem key={loja.id} textValue={loja.nome}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{loja.nome}</span>
                    {loja.endereco && (
                      <span className="text-xs text-default-500">
                        {loja.endereco}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </Select>

            <Input
              label="Valor Inicial"
              placeholder="R$ 0,00"
              value={formData.valor_inicial}
              onChange={(e) => {
                const masked = currencyMask(e.target.value);
                onFormChange("valor_inicial", masked);
              }}
              onBlur={(e) => {
                const number = currencyToNumber(e.target.value);
                const formatted = numberToCurrencyInput(number);
                onFormChange("valor_inicial", formatted);
              }}
              isRequired
              variant="bordered"
              startContent={<CurrencyDollarIcon className="w-5 h-5" />}
            />

            <Textarea
              label="Observações (Opcional)"
              placeholder="Observações sobre a abertura do caixa"
              value={formData.observacoes_abertura}
              onChange={(e) =>
                onFormChange("observacoes_abertura", e.target.value)
              }
              variant="bordered"
              minRows={3}
            />

            <div className="p-4 bg-success-50 rounded-lg border border-success-200">
              <p className="text-sm text-success-700">
                ℹ️ <strong>Importante:</strong> Após abrir o caixa, será
                possível registrar vendas para esta loja.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-default-50 rounded-b-lg">
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button
            color="success"
            onPress={onSubmit}
            isLoading={loading}
            isDisabled={!formData.loja_id || !formData.valor_inicial}
            startContent={!loading && <LockOpenIcon className="w-4 h-4" />}
          >
            Abrir Caixa
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
