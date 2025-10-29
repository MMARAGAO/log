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
  ClockIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import type { Loja } from "./types";

interface LojaFechadaCardProps {
  loja: Loja;
  canOpenCaixa: boolean;
  onAbrirCaixa: () => void;
  onVerHistorico: () => void;
  hasCaixaFechadoHoje?: boolean;
}

export default function LojaFechadaCard({
  loja,
  canOpenCaixa,
  onAbrirCaixa,
  onVerHistorico,
  hasCaixaFechadoHoje = false,
}: LojaFechadaCardProps) {
  return (
    <Card className="bg-gradient-to-br from-default-50 to-default-100 border-2 border-default-200">
      <CardBody>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-default-200 rounded-full">
              <LockClosedIcon className="w-6 h-6 text-default-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-default-800">
                {loja.nome}
              </h3>
              <p className="text-xs text-default-500">
                {loja.endereco || "Sem endereço"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              color={hasCaixaFechadoHoje ? "warning" : "default"}
              variant="flat"
              size="sm"
            >
              {hasCaixaFechadoHoje ? "Fechado Hoje" : "Fechado"}
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
                  {canOpenCaixa ? (
                    <DropdownItem
                      key="abrir"
                      onPress={onAbrirCaixa}
                      startContent={
                        hasCaixaFechadoHoje ? (
                          <ArrowPathIcon className="w-5 h-5 text-warning" />
                        ) : (
                          <LockOpenIcon className="w-5 h-5 text-success" />
                        )
                      }
                      color={hasCaixaFechadoHoje ? "warning" : "success"}
                    >
                      {hasCaixaFechadoHoje ? "Reabrir Caixa" : "Abrir Caixa"}
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
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <div className="bg-content2 rounded-lg p-3 border border-divider">
          <p className="text-sm text-default-500 text-center">
            {hasCaixaFechadoHoje
              ? "Caixa foi fechado hoje. Você pode reabrir este caixa."
              : "Caixa fechado. Abra um novo caixa para iniciar as operações."}
          </p>
        </div>

        {/* Botões de Ação - Removidos, substituídos pelo dropdown */}
      </CardBody>
    </Card>
  );
}
