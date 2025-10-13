import { Card, CardBody, Chip, Progress } from "@heroui/react";
import {
  Battery0Icon,
  Battery50Icon,
  Battery100Icon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { EstoqueInfo } from "./types";

interface EstoqueStatusProps {
  info: EstoqueInfo;
}

export function EstoqueStatus({ info }: EstoqueStatusProps) {
  const percAbaixoMinimo =
    info.totalProdutos > 0
      ? (info.produtosAbaixoMinimo / info.totalProdutos) * 100
      : 0;
  const percSemEstoque =
    info.totalProdutos > 0
      ? (info.produtosSemEstoque / info.totalProdutos) * 100
      : 0;

  const statusColor =
    percAbaixoMinimo > 30
      ? "danger"
      : percAbaixoMinimo > 15
        ? "warning"
        : "success";

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-4">
          <Battery100Icon className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-bold">Status do Estoque</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery100Icon className="w-5 h-5 text-success-500" />
              <span className="text-sm">Total de Produtos</span>
            </div>
            <Chip size="sm" color="success" variant="flat">
              {info.totalProdutos}
            </Chip>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery50Icon className="w-5 h-5 text-warning-500" />
              <span className="text-sm">Abaixo do Mínimo</span>
            </div>
            <Chip size="sm" color="warning" variant="flat">
              {info.produtosAbaixoMinimo}
            </Chip>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery0Icon className="w-5 h-5 text-danger-500" />
              <span className="text-sm">Sem Estoque</span>
            </div>
            <Chip size="sm" color="danger" variant="flat">
              {info.produtosSemEstoque}
            </Chip>
          </div>

          <div className="pt-4 border-t border-default-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Status Geral</span>
              <Chip size="sm" color={statusColor} variant="flat">
                {percAbaixoMinimo.toFixed(1)}% crítico
              </Chip>
            </div>
            <Progress
              value={100 - percAbaixoMinimo}
              color={statusColor}
              size="sm"
              className="max-w-full"
            />
          </div>

          {info.produtosSemEstoque > 0 && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-danger-700">
                  Atenção!
                </p>
                <p className="text-xs text-danger-600">
                  {info.produtosSemEstoque} produto(s) sem estoque
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <p className="text-2xl font-bold text-primary-700">
              R${" "}
              {info.valorTotal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-default-500">Valor Total em Estoque</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
