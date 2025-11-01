"use client";

import {
  Card,
  CardBody,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/react";
import {
  LockOpenIcon,
  LockClosedIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import type { CaixaAberto, Loja, ResumoVendas, Sangria } from "./types";

interface CaixaAbertoCardProps {
  caixa: CaixaAberto;
  loja: Loja | undefined;
  resumo: ResumoVendas;
  sangrias?: Sangria[];
  canCloseCaixa: boolean;
  onVerDetalhes: () => void;
  onFecharCaixa: () => void;
  onVerHistorico: () => void;
  onFazerSangria?: () => void;
}

export default function CaixaAbertoCard({
  caixa,
  loja,
  resumo,
  sangrias = [],
  canCloseCaixa,
  onVerDetalhes,
  onFecharCaixa,
  onVerHistorico,
  onFazerSangria,
}: CaixaAbertoCardProps) {
  const tempoAberto = Math.floor(
    (new Date().getTime() - new Date(caixa.data_abertura).getTime()) /
      (1000 * 60 * 60)
  );

  // Calcular total de sangrias ATIVAS apenas
  // Sangrias sem status são consideradas ativas (retrocompatibilidade)
  const sangriasAtivas = sangrias.filter(
    (s) => !s.status || s.status === "ativa"
  );
  const totalSangrias = sangriasAtivas.reduce((acc, s) => acc + s.valor, 0);

  return (
    <Card className="bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-200">
      <CardBody>
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-200 rounded-full">
              <LockOpenIcon className="w-6 h-6 text-success-700" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-success-800">
                {loja?.nome || "Loja"}
              </h3>
              <p className="text-xs text-success-600">
                Aberto há {tempoAberto}h
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="success" variant="flat" size="sm">
              <CheckCircleIcon className="w-3 h-3 inline mr-1" />
              Ativo
            </Chip>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  startContent={<EllipsisVerticalIcon className="w-5 h-5" />}
                />
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownSection title="Ações">
                  <DropdownItem
                    key="detalhes"
                    onPress={onVerDetalhes}
                    startContent={<EyeIcon className="w-5 h-5 text-primary" />}
                  >
                    Ver Detalhes
                  </DropdownItem>

                  {onFazerSangria ? (
                    <DropdownItem
                      key="sangria"
                      onPress={onFazerSangria}
                      startContent={
                        <BanknotesIcon className="w-5 h-5 text-warning" />
                      }
                    >
                      Fazer Sangria
                    </DropdownItem>
                  ) : null}

                  <DropdownItem
                    key="historico"
                    onPress={onVerHistorico}
                    startContent={
                      <ClockIcon className="w-5 h-5 text-default-500" />
                    }
                  >
                    Ver Histórico
                  </DropdownItem>

                  {canCloseCaixa ? (
                    <DropdownItem
                      key="fechar"
                      onPress={onFecharCaixa}
                      className="text-danger"
                      startContent={
                        <LockClosedIcon className="w-5 h-5 text-danger" />
                      }
                    >
                      Fechar Caixa
                    </DropdownItem>
                  ) : null}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="space-y-3 mb-4">
          <div className="bg-content2 rounded-lg p-3 border border-divider">
            <p className="text-xs text-default-500 mb-1">Valor Inicial</p>
            <p className="text-lg font-bold text-success">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(caixa.valor_inicial)}
            </p>
          </div>

          <div className="bg-content2 rounded-lg p-3 border border-divider">
            <p className="text-xs text-default-500 mb-1">Vendas Hoje</p>
            <p className="text-lg font-bold text-primary">
              {resumo.totalVendas} vendas -{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(resumo.valorTotalVendas)}
            </p>
            {resumo.totalDevolvidas > 0 && (
              <p className="text-xs text-danger mt-1">
                ⚠ {resumo.totalDevolvidas} devolvida{resumo.totalDevolvidas > 1 ? 's' : ''} ({" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(resumo.valorTotalDevolvido)})
              </p>
            )}
          </div>

          <div className="bg-content2 rounded-lg p-3 border border-divider">
            <p className="text-xs text-default-500 mb-1">Dinheiro no Caixa</p>
            <p className="text-lg font-bold text-warning">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(
                caixa.valor_inicial + resumo.valorDinheiro - totalSangrias
              )}
            </p>
            {totalSangrias > 0 && (
              <p className="text-xs text-danger mt-1">
                Sangrias: -{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totalSangrias)}
              </p>
            )}
          </div>
        </div>

        {/* Botões de Ação - Removidos, substituídos pelo dropdown */}
      </CardBody>
    </Card>
  );
}
