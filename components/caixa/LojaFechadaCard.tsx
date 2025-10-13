"use client";

import { Card, CardBody, Button, Chip } from "@heroui/react";
import {
  LockOpenIcon,
  LockClosedIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { Loja } from "./types";

interface LojaFechadaCardProps {
  loja: Loja;
  canOpenCaixa: boolean;
  onAbrirCaixa: () => void;
  onVerHistorico: () => void;
}

export default function LojaFechadaCard({
  loja,
  canOpenCaixa,
  onAbrirCaixa,
  onVerHistorico,
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
          <Chip color="default" variant="flat" size="sm">
            Fechado
          </Chip>
        </div>

        <div className="bg-white rounded-lg p-3 mb-4">
          <p className="text-sm text-default-500 text-center">
            Caixa fechado. Abra um novo caixa para iniciar as operações.
          </p>
        </div>

        <div className="flex gap-2">
          {canOpenCaixa && (
            <Button
              size="sm"
              color="success"
              className="flex-1"
              startContent={<LockOpenIcon className="w-4 h-4" />}
              onPress={onAbrirCaixa}
            >
              Abrir Caixa
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
