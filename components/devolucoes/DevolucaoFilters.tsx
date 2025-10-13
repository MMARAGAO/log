/**
 * DevolucaoFilters - Componente de filtros avançados
 * Busca, filtros por tipo, motivo, crédito, datas e valores
 */

import { useState } from "react";
import {
  Input,
  Button,
  Select,
  SelectItem,
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  MOTIVOS_DEVOLUCAO,
  STATUS_CREDITO,
  TIPO_DEVOLUCAO,
  ORDER_FIELDS,
  type FilterState,
} from "./types";

interface DevolucaoFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onAddClick: () => void;
  canCreate: boolean;
  clientesOptions: Array<{ id: number; nome: string }>;
}

export default function DevolucaoFilters({
  filters,
  onFiltersChange,
  onAddClick,
  canCreate,
  clientesOptions,
}: DevolucaoFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleDirection = () => {
    onFiltersChange({
      ...filters,
      direction: filters.direction === "asc" ? "desc" : "asc",
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      tipo: "",
      motivo: "",
      creditoAplicado: "",
      cliente: "",
      orderBy: "data_devolucao",
      direction: "desc",
      inicio: "",
      fim: "",
      valorMin: "",
      valorMax: "",
    });
    setShowAdvanced(false);
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Barra principal */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por ID venda, cliente, motivo..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          isClearable
          onClear={() => handleChange("search", "")}
          startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
          className="flex-1"
        />
        <Button
          variant={showAdvanced ? "solid" : "flat"}
          color={showAdvanced ? "primary" : "default"}
          startContent={<FunnelIcon className="w-5 h-5" />}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          Filtros
        </Button>
        {canCreate && (
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={onAddClick}
          >
            <span className="hidden lg:inline">Nova Devolução</span>
          </Button>
        )}
      </div>

      {/* Filtros avançados */}
      {showAdvanced && (
        <Card>
          <CardBody className="gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Tipo"
                placeholder="Todos"
                selectedKeys={filters.tipo ? [filters.tipo] : []}
                onSelectionChange={(keys) =>
                  handleChange("tipo", Array.from(keys)[0]?.toString() || "")
                }
              >
                {TIPO_DEVOLUCAO.map((tipo) => (
                  <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Motivo"
                placeholder="Todos"
                selectedKeys={filters.motivo ? [filters.motivo] : []}
                onSelectionChange={(keys) =>
                  handleChange("motivo", Array.from(keys)[0]?.toString() || "")
                }
              >
                {MOTIVOS_DEVOLUCAO.map((motivo) => (
                  <SelectItem key={motivo.key}>{motivo.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Status Crédito"
                placeholder="Todos"
                selectedKeys={
                  filters.creditoAplicado ? [filters.creditoAplicado] : []
                }
                onSelectionChange={(keys) =>
                  handleChange(
                    "creditoAplicado",
                    Array.from(keys)[0]?.toString() || ""
                  )
                }
              >
                {STATUS_CREDITO.map((status) => (
                  <SelectItem key={status.key.toString()}>
                    {status.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="Cliente"
                placeholder="Todos"
                selectedKeys={filters.cliente ? [filters.cliente] : []}
                onSelectionChange={(keys) =>
                  handleChange("cliente", Array.from(keys)[0]?.toString() || "")
                }
              >
                {clientesOptions.map((cliente) => (
                  <SelectItem key={cliente.id.toString()}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                type="date"
                label="Data Início"
                value={filters.inicio}
                onChange={(e) => handleChange("inicio", e.target.value)}
              />
              <Input
                type="date"
                label="Data Fim"
                value={filters.fim}
                onChange={(e) => handleChange("fim", e.target.value)}
              />
              <Input
                type="number"
                label="Valor Mínimo"
                placeholder="0.00"
                value={filters.valorMin}
                onChange={(e) => handleChange("valorMin", e.target.value)}
                startContent={<span className="text-default-400">R$</span>}
              />
              <Input
                type="number"
                label="Valor Máximo"
                placeholder="0.00"
                value={filters.valorMax}
                onChange={(e) => handleChange("valorMax", e.target.value)}
                startContent={<span className="text-default-400">R$</span>}
              />
            </div>

            <Divider />

            <div className="flex gap-2 items-center">
              <Select
                label="Ordenar por"
                className="flex-1"
                selectedKeys={[filters.orderBy]}
                onSelectionChange={(keys) =>
                  handleChange(
                    "orderBy",
                    Array.from(keys)[0]?.toString() || "data_devolucao"
                  )
                }
              >
                {ORDER_FIELDS.map((field) => (
                  <SelectItem key={field.key}>{field.label}</SelectItem>
                ))}
              </Select>
              <Button
                isIconOnly
                variant="flat"
                onPress={toggleDirection}
                className="mt-6"
              >
                {filters.direction === "asc" ? (
                  <ArrowUpIcon className="w-5 h-5" />
                ) : (
                  <ArrowDownIcon className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="light"
                color="danger"
                onPress={clearFilters}
                className="mt-6"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
