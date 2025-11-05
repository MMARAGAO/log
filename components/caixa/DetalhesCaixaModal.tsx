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
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { CaixaAberto, Loja, ResumoVendas, Venda, Sangria } from "./types";
import { CaixaPDFGenerator } from "./CaixaPDFGenerator";

// Helper para formatar datas corretamente (timestamps UTC do banco)
function formatarDataHora(timestamp: string): string {
  // Se o timestamp já tem timezone (+00, -03, Z), usa direto
  // Se não tem, adiciona 'Z' para forçar interpretação como UTC
  const ts =
    timestamp.includes("+") || timestamp.includes("Z")
      ? timestamp
      : timestamp + "Z";
  const date = new Date(ts);
  return date.toLocaleString("pt-BR");
}

interface DetalhesCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixa: CaixaAberto | null;
  loja: Loja | undefined;
  resumo: ResumoVendas | null;
  vendas?: Venda[];
  sangrias?: Sangria[];
  onCancelarSangria?: (sangriaId: number) => void;
  canCancelSangria?: boolean;
}

export default function DetalhesCaixaModal({
  isOpen,
  onClose,
  caixa,
  loja,
  resumo,
  vendas = [],
  sangrias = [],
  onCancelarSangria,
  canCancelSangria = false,
}: DetalhesCaixaModalProps) {
  if (!caixa || !resumo) return null;

  const tempoAberto = Math.floor(
    (new Date().getTime() - new Date(caixa.data_abertura).getTime()) /
      (1000 * 60 * 60)
  );

  // Separar sangrias ativas e canceladas
  // Sangrias sem status são consideradas ativas (retrocompatibilidade)
  const sangriasAtivas = sangrias.filter(
    (s) => !s.status || s.status === "ativa"
  );
  const sangriasCanceladas = sangrias.filter((s) => s.status === "cancelada");
  const totalSangriasAtivas = sangriasAtivas.reduce(
    (acc, s) => acc + s.valor,
    0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 bg-primary-50 rounded-t-lg">
          <ChartBarIcon className="w-6 h-6 text-primary-600" />
          <span className="text-primary-800">
            Detalhes do Caixa - {loja?.nome}
          </span>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Informações do Caixa */}
            <Card className="bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-200">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-success-600 mb-1">
                      Valor Inicial
                    </p>
                    <p className="text-xl font-bold text-success-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(caixa.valor_inicial)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-success-600 mb-1">Aberto em</p>
                    <p className="text-sm font-semibold text-success-800">
                      {formatarDataHora(caixa.data_abertura)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-success-600 mb-1">
                      Tempo Aberto
                    </p>
                    <p className="text-xl font-bold text-success-700">
                      {tempoAberto}h
                    </p>
                  </div>
                </div>
                {caixa.observacoes_abertura && (
                  <div className="mt-4 p-3 bg-content2 rounded-lg border border-divider">
                    <p className="text-xs text-default-500 font-medium mb-1">
                      Observações:
                    </p>
                    <p className="text-sm">{caixa.observacoes_abertura}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Resumo de Vendas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary-50 to-primary-100">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-200 rounded-full">
                      <ShoppingCartIcon className="w-6 h-6 text-primary-700" />
                    </div>
                    <div>
                      <p className="text-sm text-default-600">
                        Total de Vendas
                      </p>
                      <p className="text-2xl font-bold text-primary-700">
                        {resumo.totalVendas}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-success-50 to-success-100">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-success-200 rounded-full">
                      <CurrencyDollarIcon className="w-6 h-6 text-success-700" />
                    </div>
                    <div>
                      <p className="text-sm text-default-600">Valor Total</p>
                      <p className="text-2xl font-bold text-success-700">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(resumo.valorTotalVendas)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-warning-50 to-warning-100">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-warning-200 rounded-full">
                      <ChartBarIcon className="w-6 h-6 text-warning-700" />
                    </div>
                    <div>
                      <p className="text-sm text-default-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-warning-700">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(resumo.ticketMedio)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100">
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary-200 rounded-full">
                      <BanknotesIcon className="w-6 h-6 text-secondary-700" />
                    </div>
                    <div>
                      <p className="text-sm text-default-600">
                        Dinheiro no Caixa
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          caixa.valor_inicial + resumo.valorDinheiro < 0
                            ? "text-danger"
                            : "text-secondary-700"
                        }`}
                      >
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(caixa.valor_inicial + resumo.valorDinheiro)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Detalhamento por Forma de Pagamento */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-4">
                  💳 Detalhamento por Forma de Pagamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-success-50 rounded-lg border border-success-200">
                    <p className="text-sm text-success-600 font-medium mb-1">
                      💵 Dinheiro
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorDinheiro < 0
                          ? "text-danger"
                          : "text-success-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorDinheiro)}
                    </p>
                  </div>

                  <div className="p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                    <p className="text-sm text-secondary-600 font-medium mb-1">
                      📱 PIX
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorPix < 0
                          ? "text-danger"
                          : "text-secondary-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorPix)}
                    </p>
                  </div>

                  <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-sm text-primary-600 font-medium mb-1">
                      💳 Cartão Débito
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorCartaoDebito < 0
                          ? "text-danger"
                          : "text-primary-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorCartaoDebito)}
                    </p>
                  </div>

                  <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-sm text-primary-600 font-medium mb-1">
                      💳 Cartão Crédito
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorCartaoCredito < 0
                          ? "text-danger"
                          : "text-primary-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorCartaoCredito)}
                    </p>
                  </div>

                  <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                    <p className="text-sm text-warning-600 font-medium mb-1">
                      🏦 Transferência
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorTransferencia < 0
                          ? "text-danger"
                          : "text-warning-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorTransferencia)}
                    </p>
                  </div>

                  <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                    <p className="text-sm text-default-600 font-medium mb-1">
                      📄 Boleto
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorBoleto < 0
                          ? "text-danger"
                          : "text-default-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorBoleto)}
                    </p>
                  </div>

                  <div className="p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                    <p className="text-sm text-secondary-600 font-medium mb-1">
                      📅 Crediário
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorCrediario < 0
                          ? "text-danger"
                          : "text-secondary-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorCrediario)}
                    </p>
                  </div>

                  <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
                    <p className="text-sm text-danger-600 font-medium mb-1">
                      ✋ Fiado
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        resumo.valorFiado < 0
                          ? "text-danger"
                          : "text-danger-700"
                      }`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorFiado)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Sangrias */}
            {sangrias && sangrias.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-4">
                    💸 Sangrias Realizadas
                  </h3>

                  {/* Sangrias Ativas */}
                  {sangriasAtivas.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <h4 className="text-sm font-semibold text-success-600">
                        ✅ Sangrias Ativas ({sangriasAtivas.length})
                      </h4>
                      {sangriasAtivas.map((sangria) => (
                        <div
                          key={sangria.id}
                          className="p-4 bg-warning-50 rounded-lg border border-warning-200"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Chip size="sm" color="success" variant="flat">
                                  Ativa
                                </Chip>
                              </div>
                              <p className="text-sm font-medium text-warning-800 mb-1">
                                {sangria.motivo}
                              </p>
                              <p className="text-xs text-warning-600">
                                {formatarDataHora(sangria.data_sangria)}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="text-lg font-bold text-warning-700">
                                -{" "}
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(sangria.valor)}
                              </p>
                              {canCancelSangria &&
                                onCancelarSangria &&
                                caixa.status === "aberto" && (
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    startContent={
                                      <XCircleIcon className="w-4 h-4" />
                                    }
                                    onPress={() =>
                                      onCancelarSangria(sangria.id)
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 bg-warning-100 rounded-lg border-2 border-warning-300">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-warning-800">
                            Total de Sangrias Ativas:
                          </p>
                          <p className="text-xl font-bold text-warning-800">
                            -{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(totalSangriasAtivas)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sangrias Canceladas */}
                  {sangriasCanceladas.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-danger-600">
                        ❌ Sangrias Canceladas ({sangriasCanceladas.length})
                      </h4>
                      {sangriasCanceladas.map((sangria) => (
                        <div
                          key={sangria.id}
                          className="p-4 bg-danger-50 rounded-lg border border-danger-200 opacity-70"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Chip size="sm" color="danger" variant="flat">
                                  Cancelada
                                </Chip>
                              </div>
                              <p className="text-sm font-medium text-danger-800 mb-1 line-through">
                                {sangria.motivo}
                              </p>
                              <p className="text-xs text-danger-600">
                                Criada em:{" "}
                                {formatarDataHora(sangria.data_sangria)}
                              </p>
                              {sangria.data_cancelamento && (
                                <p className="text-xs text-danger-600 mt-1">
                                  Cancelada em:{" "}
                                  {formatarDataHora(sangria.data_cancelamento)}
                                </p>
                              )}
                              {sangria.motivo_cancelamento && (
                                <p className="text-xs text-danger-700 mt-2 italic">
                                  Motivo: {sangria.motivo_cancelamento}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-danger-700 line-through">
                                -{" "}
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(sangria.valor)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="bg-default-50 rounded-b-lg">
          <Button
            color="success"
            variant="flat"
            startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
            onPress={() => {
              if (loja) {
                CaixaPDFGenerator.gerar({
                  caixa,
                  loja,
                  resumo,
                  vendas,
                  sangrias,
                });
              }
            }}
          >
            Baixar PDF
          </Button>
          <Button color="primary" variant="light" onPress={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
