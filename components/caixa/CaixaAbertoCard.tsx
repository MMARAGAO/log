"use client";

import { Card, CardBody, Button, Chip } from "@heroui/react";
import {
  LockOpenIcon,
  LockClosedIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { CaixaAberto, Loja, ResumoVendas } from "./types";

interface CaixaAbertoCardProps {
  caixa: CaixaAberto;
  loja: Loja | undefined;
  resumo: ResumoVendas;
  canCloseCaixa: boolean;
  onVerDetalhes: () => void;
  onFecharCaixa: () => void;
  onVerHistorico: () => void;
}

export default function CaixaAbertoCard({
  caixa,
  loja,
  resumo,
  canCloseCaixa,
  onVerDetalhes,
  onFecharCaixa,
  onVerHistorico,
}: CaixaAbertoCardProps) {
  const tempoAberto = Math.floor(
    (new Date().getTime() - new Date(caixa.data_abertura).getTime()) /
      (1000 * 60 * 60)
  );

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
          <Chip color="success" variant="flat" size="sm">
            <CheckCircleIcon className="w-3 h-3 inline mr-1" />
            Ativo
          </Chip>
        </div>

        {/* Informações Principais */}
        <div className="space-y-3 mb-4">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-default-500 mb-1">Valor Inicial</p>
            <p className="text-lg font-bold text-success-700">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(caixa.valor_inicial)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-default-500 mb-1">Vendas Hoje</p>
            <p className="text-lg font-bold text-primary-700">
              {resumo.totalVendas} vendas -{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(resumo.valorTotalVendas)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-default-500 mb-1">Dinheiro no Caixa</p>
            <p className="text-lg font-bold text-warning-700">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(caixa.valor_inicial + resumo.valorDinheiro)}
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="flex-1"
            startContent={<EyeIcon className="w-4 h-4" />}
            onPress={onVerDetalhes}
          >
            Detalhes
          </Button>

          {canCloseCaixa && (
            <Button
              size="sm"
              color="danger"
              className="flex-1"
              startContent={<LockClosedIcon className="w-4 h-4" />}
              onPress={onFecharCaixa}
            >
              Fechar
            </Button>
          )}

          <Button
            size="sm"
            variant="flat"
            color="default"
            isIconOnly
            onPress={onVerHistorico}
          >
            <ClockIcon className="w-4 h-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
