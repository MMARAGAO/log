"use client";

import { Card, CardBody, Button, Input } from "@heroui/react";
import {
  CalendarIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface FiltroDataProps {
  dataInicio: string;
  dataFim: string;
  onDataInicioChange: (value: string) => void;
  onDataFimChange: (value: string) => void;
  onLimpar: () => void;
  totalFiltrados: number;
  totalGeral: number;
}

export default function FiltroCaixaData({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onLimpar,
  totalFiltrados,
  totalGeral,
}: FiltroDataProps) {
  const temFiltro = dataInicio || dataFim;

  return (
    <Card className="mb-6">
      <CardBody>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          {/* Título */}
          <div className="flex items-center gap-2 flex-1">
            <FunnelIcon className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-lg font-bold">Filtrar por Data</h3>
              <p className="text-xs text-default-500">
                {temFiltro ? (
                  <>
                    Mostrando <strong>{totalFiltrados}</strong> de{" "}
                    <strong>{totalGeral}</strong> registros
                  </>
                ) : (
                  <>
                    Mostrando todos os <strong>{totalGeral}</strong> registros
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Campos de Data */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Input
              type="date"
              label="Data Início"
              placeholder="Selecione a data inicial"
              value={dataInicio}
              onChange={(e) => onDataInicioChange(e.target.value)}
              startContent={
                <CalendarIcon className="w-4 h-4 text-default-400" />
              }
              variant="bordered"
              classNames={{
                input: "text-sm",
              }}
            />

            <Input
              type="date"
              label="Data Fim"
              placeholder="Selecione a data final"
              value={dataFim}
              onChange={(e) => onDataFimChange(e.target.value)}
              startContent={
                <CalendarIcon className="w-4 h-4 text-default-400" />
              }
              variant="bordered"
              classNames={{
                input: "text-sm",
              }}
            />
          </div>

          {/* Botão Limpar */}
          {temFiltro && (
            <Button
              color="default"
              variant="flat"
              startContent={<XMarkIcon className="w-4 h-4" />}
              onPress={onLimpar}
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Atalhos de Data */}
        <div className="flex flex-wrap gap-2 mt-4">
          <p className="text-xs text-default-500 w-full mb-1">Atalhos:</p>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => {
              const hoje = new Date().toISOString().split("T")[0];
              onDataInicioChange(hoje);
              onDataFimChange(hoje);
            }}
          >
            Hoje
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => {
              const hoje = new Date();
              const ontem = new Date(hoje);
              ontem.setDate(ontem.getDate() - 1);
              const dataOntem = ontem.toISOString().split("T")[0];
              onDataInicioChange(dataOntem);
              onDataFimChange(dataOntem);
            }}
          >
            Ontem
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => {
              const hoje = new Date();
              const seteDiasAtras = new Date(hoje);
              seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
              onDataInicioChange(seteDiasAtras.toISOString().split("T")[0]);
              onDataFimChange(hoje.toISOString().split("T")[0]);
            }}
          >
            Últimos 7 dias
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => {
              const hoje = new Date();
              const trintaDiasAtras = new Date(hoje);
              trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
              onDataInicioChange(trintaDiasAtras.toISOString().split("T")[0]);
              onDataFimChange(hoje.toISOString().split("T")[0]);
            }}
          >
            Últimos 30 dias
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => {
              const hoje = new Date();
              const primeiroDiaMes = new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
              );
              onDataInicioChange(primeiroDiaMes.toISOString().split("T")[0]);
              onDataFimChange(hoje.toISOString().split("T")[0]);
            }}
          >
            Este mês
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => {
              const hoje = new Date();
              const mesPassado = new Date(
                hoje.getFullYear(),
                hoje.getMonth() - 1,
                1
              );
              const ultimoDiaMesPassado = new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                0
              );
              onDataInicioChange(mesPassado.toISOString().split("T")[0]);
              onDataFimChange(ultimoDiaMesPassado.toISOString().split("T")[0]);
            }}
          >
            Mês passado
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
