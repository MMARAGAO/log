/**
 * EstoqueCard - Card de produto individual
 * Exibe informações do produto com foto, preços e estoque por loja
 */

import {
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import {
  EllipsisVerticalIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import PhotoCarousel from "./PhotoCarousel";
import type { EstoqueItem, Loja } from "./types";

interface EstoqueCardProps {
  produto: EstoqueItem;
  lojas: Loja[];
  onEdit: (produto: EstoqueItem) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export default function EstoqueCard({
  produto,
  lojas,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: EstoqueCardProps) {
  const quantidadeTotal = produto.quantidade_total || 0;
  const abaixoMinimo =
    produto.minimo !== undefined &&
    quantidadeTotal < produto.minimo &&
    quantidadeTotal > 0;
  const semEstoque = quantidadeTotal === 0;

  // Status do estoque
  const getStatusChip = () => {
    if (semEstoque) {
      return (
        <Chip size="sm" color="danger" variant="flat">
          Sem Estoque
        </Chip>
      );
    }
    if (abaixoMinimo) {
      return (
        <Chip
          size="sm"
          color="warning"
          variant="flat"
          startContent={<ExclamationTriangleIcon className="w-3 h-3" />}
        >
          Abaixo do Mínimo
        </Chip>
      );
    }
    return (
      <Chip
        size="sm"
        color="success"
        variant="flat"
        startContent={<CheckCircleIcon className="w-3 h-3" />}
      >
        Em Estoque
      </Chip>
    );
  };

  // Calcula margem
  const margemLucro =
    produto.preco_compra && produto.preco_venda
      ? ((produto.preco_venda - produto.preco_compra) / produto.preco_compra) *
        100
      : 0;

  return (
    <Card className="w-full">
      <CardBody className="p-0">
        {/* Foto */}
        <PhotoCarousel photos={produto.fotourl || []} alt={produto.descricao} />

        {/* Conteúdo */}
        <div className="p-4 space-y-3">
          {/* Header com título e ações */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">
                {produto.modelo
                  ? `${produto.descricao} - ${produto.modelo}`
                  : produto.descricao}
              </h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {produto.marca && (
                  <Chip size="sm" variant="flat" color="primary">
                    {produto.marca}
                  </Chip>
                )}
                {produto.modelo && (
                  <Chip size="sm" variant="flat" color="secondary">
                    {produto.modelo}
                  </Chip>
                )}
              </div>
            </div>

            {(canEdit || canDelete) && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="flex-shrink-0"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  {canEdit ? (
                    <DropdownItem
                      key="edit"
                      onPress={() => onEdit(produto)}
                      startContent={<PencilIcon className="w-4 h-4" />}
                    >
                      Editar
                    </DropdownItem>
                  ) : null}
                  {canDelete ? (
                    <DropdownItem
                      key="delete"
                      onPress={() => onDelete(produto.id)}
                      className="text-danger"
                      color="danger"
                      startContent={<TrashIcon className="w-4 h-4" />}
                    >
                      Excluir
                    </DropdownItem>
                  ) : null}
                </DropdownMenu>
              </Dropdown>
            )}
          </div>

          {/* Compatibilidade */}
          {produto.compativel && (
            <p className="text-xs text-default-500 truncate">
              Compatível: {produto.compativel}
            </p>
          )}

          <Divider />

          {/* Preços */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-default-500">Preço Compra</p>
              <p className="font-semibold text-success">
                R${" "}
                {(produto.preco_compra || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-default-500">Preço Venda</p>
              <p className="font-semibold text-primary">
                R${" "}
                {(produto.preco_venda || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Margem */}
          {margemLucro > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <CurrencyDollarIcon className="w-4 h-4 text-success" />
              <span className="text-success font-medium">
                Margem: {margemLucro.toFixed(1)}%
              </span>
            </div>
          )}

          <Divider />

          {/* Quantidade e Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-default-500">Quantidade Total</p>
              <p
                className={`text-xl font-bold ${
                  semEstoque
                    ? "text-danger"
                    : abaixoMinimo
                      ? "text-warning"
                      : "text-success"
                }`}
              >
                {quantidadeTotal}
              </p>
              {produto.minimo !== undefined && (
                <p className="text-xs text-default-400">
                  Mínimo: {produto.minimo}
                </p>
              )}
            </div>
            {getStatusChip()}
          </div>

          {/* Estoque por loja */}
          {produto.estoque_lojas && produto.estoque_lojas.length > 0 && (
            <>
              <Divider />
              <div className="space-y-1">
                <p className="text-xs text-default-500 font-medium">
                  Por loja:
                </p>
                <div className="flex flex-wrap gap-1">
                  {produto.estoque_lojas.map((el) => {
                    const loja = lojas.find((l) => l.id === el.loja_id);
                    return (
                      <Tooltip
                        key={el.id}
                        content={loja?.nome || `Loja ${el.loja_id}`}
                      >
                        <Chip size="sm" variant="flat">
                          {loja?.nome?.substring(0, 10) || `L${el.loja_id}`}:{" "}
                          {el.quantidade}
                        </Chip>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {produto.observacoes && (
            <>
              <Divider />
              <p className="text-xs text-default-500 line-clamp-2">
                {produto.observacoes}
              </p>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
