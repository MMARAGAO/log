import { Card, CardBody, Chip, Progress } from "@heroui/react";
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Ordem } from "./types";

interface OrdensStatusProps {
  ordens: Ordem[];
}

export function OrdensStatus({ ordens }: OrdensStatusProps) {
  const ordensAbertas = ordens.filter((o) => o.status === "aberta").length;
  const ordensAndamento = ordens.filter(
    (o) => o.status === "em_andamento"
  ).length;
  const ordensConcluidas = ordens.filter(
    (o) => o.status === "concluida"
  ).length;
  const ordensTotal = ordens.length;

  const taxaConclusao =
    ordensTotal > 0 ? (ordensConcluidas / ordensTotal) * 100 : 0;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-4">
          <WrenchScrewdriverIcon className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold">Ordens de Serviço</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-warning-500" />
              <span className="text-sm">Abertas</span>
            </div>
            <Chip size="sm" color="warning" variant="flat">
              {ordensAbertas}
            </Chip>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-5 h-5 text-primary-500" />
              <span className="text-sm">Em Andamento</span>
            </div>
            <Chip size="sm" color="primary" variant="flat">
              {ordensAndamento}
            </Chip>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-success-500" />
              <span className="text-sm">Concluídas</span>
            </div>
            <Chip size="sm" color="success" variant="flat">
              {ordensConcluidas}
            </Chip>
          </div>

          <div className="pt-4 border-t border-default-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taxa de Conclusão</span>
              <span className="text-sm font-bold text-success-600">
                {taxaConclusao.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={taxaConclusao}
              color="success"
              size="sm"
              className="max-w-full"
            />
          </div>

          <div className="pt-2 text-center">
            <p className="text-2xl font-bold text-primary-700">{ordensTotal}</p>
            <p className="text-xs text-default-500">Total no Período</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
