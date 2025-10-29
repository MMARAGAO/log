"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import { ClockIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { CaixaAberto, Loja, ResumoVendas } from "./types";
import { CaixaPDFGenerator } from "./CaixaPDFGenerator";

interface HistoricoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  historico: CaixaAberto[];
  loja: Loja | undefined;
  onGerarPDF?: (caixa: CaixaAberto) => void;
}

export default function HistoricoCaixaModal({
  isOpen,
  onClose,
  historico,
  loja,
  onGerarPDF,
}: HistoricoCaixaModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-primary-50 rounded-t-lg">
          <ClockIcon className="w-6 h-6 text-primary-600" />
          <span className="text-primary-800">
            Histórico de Caixa - {loja?.nome || "Todas as Lojas"}
          </span>
        </ModalHeader>
        <ModalBody className="py-6">
          {historico.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <p className="text-default-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historico.map((caixa) => {
                const diferenca = caixa.valor_final
                  ? caixa.valor_final - caixa.valor_inicial
                  : 0;
                const statusColor =
                  caixa.status === "aberto" ? "success" : "default";

                return (
                  <Card key={caixa.id} className="border">
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-default-500 mb-1">
                            Status
                          </p>
                          <Chip color={statusColor} size="sm" variant="flat">
                            {caixa.status === "aberto"
                              ? "🔓 Aberto"
                              : "🔒 Fechado"}
                          </Chip>
                        </div>

                        <div>
                          <p className="text-xs text-default-500 mb-1">
                            Data Abertura
                          </p>
                          <p className="text-sm font-semibold">
                            {new Date(caixa.data_abertura).toLocaleString(
                              "pt-BR"
                            )}
                          </p>
                        </div>

                        {caixa.data_fechamento && (
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Data Fechamento
                            </p>
                            <p className="text-sm font-semibold">
                              {new Date(caixa.data_fechamento).toLocaleString(
                                "pt-BR"
                              )}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-default-500 mb-1">
                            Tempo de Operação
                          </p>
                          <p className="text-sm font-semibold">
                            {caixa.data_fechamento
                              ? `${Math.floor(
                                  (new Date(caixa.data_fechamento).getTime() -
                                    new Date(caixa.data_abertura).getTime()) /
                                    (1000 * 60 * 60)
                                )}h ${Math.floor(
                                  ((new Date(caixa.data_fechamento).getTime() -
                                    new Date(caixa.data_abertura).getTime()) %
                                    (1000 * 60 * 60)) /
                                    (1000 * 60)
                                )}min`
                              : "Em andamento"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="p-3 bg-success-50 rounded-lg border border-success-200">
                          <p className="text-xs text-success-600 mb-1">
                            Valor Inicial
                          </p>
                          <p className="text-lg font-bold text-success-700">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(caixa.valor_inicial)}
                          </p>
                        </div>

                        {caixa.valor_final !== null &&
                          caixa.valor_final !== undefined && (
                            <>
                              <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                                <p className="text-xs text-primary-600 mb-1">
                                  Valor Final
                                </p>
                                <p className="text-lg font-bold text-primary-700">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(caixa.valor_final)}
                                </p>
                              </div>

                              <div
                                className={`p-3 rounded-lg border ${
                                  Math.abs(diferenca) < 0.01
                                    ? "bg-success-50 border-success-200"
                                    : diferenca > 0
                                      ? "bg-warning-50 border-warning-200"
                                      : "bg-danger-50 border-danger-200"
                                }`}
                              >
                                <p
                                  className={`text-xs mb-1 ${
                                    Math.abs(diferenca) < 0.01
                                      ? "text-success-600"
                                      : diferenca > 0
                                        ? "text-warning-600"
                                        : "text-danger-600"
                                  }`}
                                >
                                  Diferença
                                </p>
                                <p
                                  className={`text-lg font-bold ${
                                    Math.abs(diferenca) < 0.01
                                      ? "text-success-700"
                                      : diferenca > 0
                                        ? "text-warning-700"
                                        : "text-danger-700"
                                  }`}
                                >
                                  {diferenca > 0 ? "+" : ""}
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(diferenca)}
                                </p>
                              </div>
                            </>
                          )}
                      </div>

                      {(caixa.observacoes_abertura ||
                        caixa.observacoes_fechamento) && (
                        <div className="mt-4 space-y-2">
                          {caixa.observacoes_abertura && (
                            <div className="p-3 bg-default-50 rounded-lg">
                              <p className="text-xs text-default-500 font-medium mb-1">
                                Obs. Abertura:
                              </p>
                              <p className="text-sm">
                                {caixa.observacoes_abertura}
                              </p>
                            </div>
                          )}
                          {caixa.observacoes_fechamento && (
                            <div className="p-3 bg-default-50 rounded-lg">
                              <p className="text-xs text-default-500 font-medium mb-1">
                                Obs. Fechamento:
                              </p>
                              <p className="text-sm">
                                {caixa.observacoes_fechamento}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Botão para gerar PDF */}
                      {onGerarPDF && caixa.status === "fechado" && (
                        <div className="mt-4 flex justify-end">
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            }
                            onPress={() => onGerarPDF(caixa)}
                          >
                            Baixar PDF
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="bg-default-50 rounded-b-lg">
          <Button color="primary" variant="light" onPress={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
