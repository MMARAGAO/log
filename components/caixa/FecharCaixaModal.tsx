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
  Card,
  CardBody,
} from "@heroui/react";
import {
  LockClosedIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  currencyMask,
  currencyToNumber,
  numberToCurrencyInput,
} from "@/utils/maskInput";
import type { CaixaAberto, Loja, ResumoVendas, FormFechar } from "./types";

interface FecharCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixa: CaixaAberto | null;
  loja: Loja | undefined;
  resumo: ResumoVendas | null;
  formData: FormFechar;
  onFormChange: (field: keyof FormFechar, value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function FecharCaixaModal({
  isOpen,
  onClose,
  caixa,
  loja,
  resumo,
  formData,
  onFormChange,
  onSubmit,
  loading,
}: FecharCaixaModalProps) {
  if (!caixa || !resumo) return null;

  const valorEsperado = caixa.valor_inicial + resumo.valorDinheiro;
  const valorInformado = currencyToNumber(formData.valor_final || "0");
  const diferenca = valorInformado - valorEsperado;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-danger-50 rounded-t-lg">
          <LockClosedIcon className="w-6 h-6 text-danger-600" />
          <span className="text-danger-800">Fechar Caixa - {loja?.nome}</span>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-4">
            {/* Resumo do Caixa */}
            <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-2 border-warning-200">
              <CardBody>
                <h3 className="text-lg font-semibold mb-4 text-warning-800">
                  📊 Resumo do Caixa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-default-500 mb-1">
                      Valor Inicial
                    </p>
                    <p className="text-lg font-bold text-default-800">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(caixa.valor_inicial)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-default-500 mb-1">
                      Vendas em Dinheiro
                    </p>
                    <p className="text-lg font-bold text-success-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorDinheiro)}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-default-500 mb-1">
                      Valor Esperado
                    </p>
                    <p className="text-lg font-bold text-primary-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(valorEsperado)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Valor Final */}
            <Input
              label="Valor Final no Caixa"
              placeholder="R$ 0,00"
              value={formData.valor_final}
              onChange={(e) => {
                const masked = currencyMask(e.target.value);
                onFormChange("valor_final", masked);
              }}
              onBlur={(e) => {
                const number = currencyToNumber(e.target.value);
                const formatted = numberToCurrencyInput(number);
                onFormChange("valor_final", formatted);
              }}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<CurrencyDollarIcon className="w-5 h-5" />}
              description="Conte todo o dinheiro físico no caixa"
            />

            {/* Diferença */}
            {formData.valor_final && (
              <div
                className={`p-4 rounded-lg border ${
                  Math.abs(diferenca) < 0.01
                    ? "bg-success-50 border-success-200"
                    : diferenca > 0
                      ? "bg-primary-50 border-primary-200"
                      : "bg-danger-50 border-danger-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Diferença:</span>
                  <span
                    className={`text-xl font-bold ${
                      Math.abs(diferenca) < 0.01
                        ? "text-success-700"
                        : diferenca > 0
                          ? "text-primary-700"
                          : "text-danger-700"
                    }`}
                  >
                    {diferenca > 0 ? "+" : ""}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(diferenca)}
                  </span>
                </div>
                <p className="text-xs mt-2">
                  {Math.abs(diferenca) < 0.01
                    ? "✅ Caixa confere!"
                    : diferenca > 0
                      ? "⚠️ Sobra no caixa - Verifique se há dinheiro extra"
                      : "⚠️ Falta no caixa - Verifique se há algum erro"}
                </p>
              </div>
            )}

            {/* Observações */}
            <Textarea
              label="Observações do Fechamento"
              placeholder="Observações sobre o fechamento do caixa (opcional)"
              value={formData.observacoes_fechamento}
              onChange={(e) =>
                onFormChange("observacoes_fechamento", e.target.value)
              }
              variant="bordered"
              minRows={3}
            />

            {/* Aviso */}
            <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
              <p className="text-sm text-danger-700">
                <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
                <strong>Atenção:</strong> Após fechar o caixa, não será possível
                registrar novas vendas até que um novo caixa seja aberto.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-default-50 rounded-b-lg">
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button
            color="danger"
            onPress={onSubmit}
            isLoading={loading}
            isDisabled={!formData.valor_final}
            startContent={!loading && <LockClosedIcon className="w-4 h-4" />}
          >
            Fechar Caixa
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
