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
} from "@heroui/react";
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import type { CaixaAberto, Loja, ResumoVendas, Venda } from "./types";
import { CaixaPDFGenerator } from "./CaixaPDFGenerator";

interface DetalhesCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  caixa: CaixaAberto | null;
  loja: Loja | undefined;
  resumo: ResumoVendas | null;
  vendas?: Venda[];
}

export default function DetalhesCaixaModal({
  isOpen,
  onClose,
  caixa,
  loja,
  resumo,
  vendas = [],
}: DetalhesCaixaModalProps) {
  if (!caixa || !resumo) return null;

  const tempoAberto = Math.floor(
    (new Date().getTime() - new Date(caixa.data_abertura).getTime()) /
      (1000 * 60 * 60)
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
                      {new Date(caixa.data_abertura).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
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
                  <div className="mt-4 p-3 bg-white rounded-lg">
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
                      <p className="text-2xl font-bold text-secondary-700">
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
                    <p className="text-lg font-bold text-success-700">
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
                    <p className="text-lg font-bold text-secondary-700">
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
                    <p className="text-lg font-bold text-primary-700">
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
                    <p className="text-lg font-bold text-primary-700">
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
                    <p className="text-lg font-bold text-warning-700">
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
                    <p className="text-lg font-bold text-default-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorBoleto)}
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-600 font-medium mb-1">
                      📅 Crediário
                    </p>
                    <p className="text-lg font-bold text-indigo-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorCrediario)}
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="text-sm text-rose-600 font-medium mb-1">
                      ✋ Fiado
                    </p>
                    <p className="text-lg font-bold text-rose-700">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(resumo.valorFiado)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter className="bg-default-50 rounded-b-lg">
          <Button
            color="success"
            variant="flat"
            startContent={<ArrowDownTrayIcon className="w-5 h-5" />}
            onPress={() => {
              if (loja) {
                CaixaPDFGenerator.gerar({ caixa, loja, resumo, vendas });
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
